"""
services/otp_sender.py
----------------------
Sends OTP SMS to Indian mobile numbers via Fast2SMS.

Why Fast2SMS over MSG91?
- Cheaper for low volume (₹0.18-0.22 per OTP vs MSG91 ~₹0.25)
- Their "OTP route" / Quick SMS doesn't need DLT registration,
  which is a multi-day TRAI process. MSG91 needs DLT for any
  transactional template.
- Simpler signup - you can be sending real OTPs in 10 minutes.

Docs: https://docs.fast2sms.com/

If FAST2SMS_API_KEY is missing OR DEV_MODE_FAKE_OTP is true, we
print the OTP to the server log instead of sending - useful while
developing locally without burning SMS credits.
"""

import logging
import secrets
import string

import httpx

from config import settings
from services.usage_tracker import tracked

log = logging.getLogger("otp_sender")


def generate_otp() -> str:
    """Cryptographically random N-digit code."""
    return "".join(
        secrets.choice(string.digits) for _ in range(settings.OTP_LENGTH)
    )


@tracked(provider="fast2sms", operation="send_otp")
async def _send_otp_real(mobile: str, otp_code: str) -> dict:
    """Real Fast2SMS call. Always returns a dict for the @tracked decorator."""
    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        "authorization": settings.FAST2SMS_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "variables_values": otp_code,
        "route": "otp",
        "numbers": mobile,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, headers=headers, data=data)
        body = resp.json()
        log.info("Fast2SMS response: %s", body)
    return {"ok": bool(body.get("return")), "_meta": {"units": 1}}


async def send_otp_sms(mobile: str, otp_code: str) -> bool:
    """
    Send the OTP to the given 10-digit Indian mobile number.
    Returns True if Fast2SMS accepted the request, False otherwise.
    """
    # Local-dev escape hatch: don't hit the SMS API (and don't track cost)
    if settings.DEV_MODE_FAKE_OTP or not settings.FAST2SMS_API_KEY:
        log.warning(
            "DEV MODE: OTP for %s is %s (not sending real SMS)",
            mobile, otp_code,
        )
        print(f"\n[DEV MODE OTP] mobile={mobile} otp={otp_code}\n", flush=True)
        return True

    try:
        res = await _send_otp_real(mobile, otp_code)
        return bool(res.get("ok"))
    except Exception as exc:  # noqa: BLE001
        log.error("Fast2SMS error: %s", exc)
        return False
