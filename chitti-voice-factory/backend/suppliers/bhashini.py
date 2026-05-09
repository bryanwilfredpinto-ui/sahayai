"""Real Bhashini supplier (Govt of India NLTM · ULCA inference API).

DISABLED until ULCA credentials are issued. When env vars are set
(BHASHINI_USER_ID, BHASHINI_API_KEY, BHASHINI_INFERENCE_KEY) and
VOICE_FACTORY_USE_MOCK_BHASHINI != "1", this supplier becomes active and the
cascade prefers it over mock_bhashini.

The wire protocol below is a thin sketch matching ULCA's pipeline-config →
inference call shape. We won't run it until creds + a real test target exist;
the file's job today is to be ready to flip on without code changes.
"""

import os
import time

import requests

import languages
from suppliers.base import Supplier, SynthesisResult


_PIPELINE_CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
_TIMEOUT_S = 20


def _is_configured() -> bool:
    use_mock = os.environ.get("VOICE_FACTORY_USE_MOCK_BHASHINI", "1") == "1"
    if use_mock:
        return False
    return all(
        os.environ.get(k)
        for k in ("BHASHINI_USER_ID", "BHASHINI_API_KEY", "BHASHINI_INFERENCE_KEY")
    )


class BhashiniSupplier(Supplier):
    name = "bhashini"

    @property
    def enabled(self) -> bool:
        return _is_configured()

    def supports(self, language_code: str) -> bool:
        lang = languages.get(language_code)
        return lang is not None and lang.bhashini_supported

    def synthesize(self, text: str, language_code: str) -> SynthesisResult:
        if not self.enabled:
            return SynthesisResult(
                ok=False, supplier=self.name,
                error_code="not_configured",
                error_message="ULCA credentials not set; using mock_bhashini.",
            )
        if not self.supports(language_code):
            return SynthesisResult(
                ok=False, supplier=self.name,
                error_code="language_not_supported_by_bhashini",
                error_message=f"Bhashini does not advertise TTS for {language_code}.",
            )

        t0 = time.perf_counter()
        try:
            headers = {
                "Content-Type": "application/json",
                "userID": os.environ["BHASHINI_USER_ID"],
                "ulcaApiKey": os.environ["BHASHINI_API_KEY"],
            }
            payload = {
                "pipelineTasks": [{"taskType": "tts", "config": {"language": {"sourceLanguage": language_code}}}],
                "pipelineRequestConfig": {"pipelineId": "64392f96daac500b55c543cd"},
            }
            r = requests.post(_PIPELINE_CONFIG_URL, json=payload, headers=headers, timeout=_TIMEOUT_S)
            r.raise_for_status()
            cfg = r.json()
            inf_endpoint = cfg["pipelineInferenceAPIEndPoint"]["callbackUrl"]
            inf_auth_name = cfg["pipelineInferenceAPIEndPoint"]["inferenceApiKey"]["name"]
            inf_auth_value = cfg["pipelineInferenceAPIEndPoint"]["inferenceApiKey"]["value"]
            tts_cfg = cfg["pipelineResponseConfig"][0]["config"][0]
            service_id = tts_cfg["serviceId"]
            voice_gender = tts_cfg.get("supportedVoices", ["male"])[0]

            inf_payload = {
                "pipelineTasks": [{
                    "taskType": "tts",
                    "config": {
                        "language": {"sourceLanguage": language_code},
                        "serviceId": service_id,
                        "gender": voice_gender,
                    },
                }],
                "inputData": {"input": [{"source": text}]},
            }
            inf_headers = {"Content-Type": "application/json", inf_auth_name: inf_auth_value}
            r2 = requests.post(inf_endpoint, json=inf_payload, headers=inf_headers, timeout=_TIMEOUT_S)
            r2.raise_for_status()
            data = r2.json()
            audio_b64 = data["pipelineResponse"][0]["audio"][0]["audioContent"]
            latency_ms = int((time.perf_counter() - t0) * 1000)
            return SynthesisResult(
                ok=True,
                supplier=self.name,
                audio_url=None,                       # base64 returned inline; main.py wraps as data: URL
                audio_bytes_count=len(audio_b64) * 3 // 4,
                client_directive=None,
                voice_lang_code=languages.get(language_code).web_speech_code,
                latency_ms=latency_ms,
                disclaimer="Voice via Bhashini (Govt of India NLTM). Not a real person.",
            )
        except requests.RequestException as e:
            latency_ms = int((time.perf_counter() - t0) * 1000)
            return SynthesisResult(
                ok=False, supplier=self.name, latency_ms=latency_ms,
                error_code="upstream_error",
                error_message=f"{type(e).__name__}: {e}",
            )
        except (KeyError, IndexError, ValueError) as e:
            latency_ms = int((time.perf_counter() - t0) * 1000)
            return SynthesisResult(
                ok=False, supplier=self.name, latency_ms=latency_ms,
                error_code="parse_error",
                error_message=f"{type(e).__name__}: {e}",
            )
