"""
lib/hooks.py
------------
Four checkpoints around every Chitti's model / tool call sites:

  before_model(user_text, ctx)              -> str | RefusalResponse
  after_model(user_text, model_output, ctx) -> str
  before_tool(tool_name, args, ctx)         -> dict | RefusalResponse
  after_tool(tool_name, args, result, ctx)  -> result (unchanged; just logs)

Each hook routes input/output through the configured Quadrails and writes
audit-log entries via Observability. The hook signatures are deliberately
stable — call sites in each Chitti's services/*.py just wrap the LLM /
tool call with two lines.

Return shape
------------
- before_model / before_tool MAY return a `RefusalResponse` instead of the
  normal payload when a rail says BLOCK. The caller is expected to bail
  out and return that refusal to the user verbatim (already-disclaimer'd).
- after_model returns the (possibly modified) string. Modifications:
    - Compliance INJECT appends the per-Chitti disclaimer.
    - Safety WARN (distress) prepends a KIRAN helpline pointer.
    - Truth WARN does NOT modify the string — it just logs.

Threading
---------
Hooks are thread-safe: they only read shared state (quadrails registry)
and write through the Observability layer's own locking.
"""
from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Callable

from .quadrails import Action, CheckResult, Quadrail


log = logging.getLogger("hooks")


# ---------- Refusal payload -----------------------------------------------


@dataclass
class RefusalResponse:
    """What a hook returns when a rail says BLOCK."""

    chitti: str
    user_facing: str
    rail: str
    reason: str
    request_id: str

    def to_dict(self) -> dict:
        return {
            "ok": False,
            "blocked": True,
            "rail": self.rail,
            "reason": self.reason,
            "request_id": self.request_id,
            "message": self.user_facing,
        }


_REFUSAL_COPY = {
    "hate_speech": (
        "I won't produce content that targets people for who they are. "
        "If you'd like to learn about a community, I can help with that respectfully."
    ),
    "violence_howto": (
        "I can't help with making weapons or explosives. "
        "If you're worried about your safety, in India you can call 112."
    ),
    "self_harm_method_request": (
        "I won't share self-harm methods. If you're in pain right now, please call "
        "KIRAN at 1800-599-0019 (24/7, free, in 13 Indian languages). You deserve support."
    ),
    "off_topic": (
        "I'm focused on a specific job. {hint} "
        "Try rephrasing toward that — I'll do my best."
    ),
}


def _refusal_for(chitti: str, rail_result: CheckResult, request_id: str) -> RefusalResponse:
    template = _REFUSAL_COPY.get(rail_result.reason)
    if rail_result.reason == "off_topic":
        topics = (rail_result.payload or {}).get("expected_topics", [])
        hint = f"I work on: {', '.join(topics)}." if topics else "I work on a different topic."
        msg = template.format(hint=hint)
    else:
        msg = template or "I can't help with that. Try a different angle."
    return RefusalResponse(
        chitti=chitti, user_facing=msg, rail=rail_result.rail,
        reason=rail_result.reason, request_id=request_id,
    )


# ---------- Registry ------------------------------------------------------


@dataclass
class HookRegistry:
    """Bundle of state every Chitti needs to enforce the quality framework.

    Construct ONCE at app startup. Pass to every service/route that calls
    the model or a tool.
    """

    chitti: str
    quadrails: list[Quadrail]
    observability: Any  # avoid circular import; duck-typed Observability
    # Optional hook for the WARN action on safety:distress_signal.
    # Default: prepend the KIRAN helpline pointer.
    care_path_prefix: str = (
        "Before I answer — if you're going through a really hard time, "
        "please call KIRAN 1800-599-0019 (24/7, free, 13 Indian languages). "
        "I'm here too.\n\n"
    )

    # ---- input gate ----

    def before_model(self, user_text: str, ctx: dict | None = None) -> str | RefusalResponse:
        ctx = ctx or {}
        request_id = ctx.setdefault("request_id", uuid.uuid4().hex[:12])
        ctx.setdefault("ts_start", time.time())

        for rail in self.quadrails:
            result = rail.check_input(user_text, ctx)
            self._record_rail_result(result, request_id, phase="before_model")
            if result.action == Action.BLOCK:
                return _refusal_for(self.chitti, result, request_id)
            if result.action == Action.REDIRECT:
                return _refusal_for(self.chitti, result, request_id)
            # WARN actions don't gate input here — they're surfaced to the
            # model via ctx so the after_model step can add the care prefix.
            if result.action == Action.WARN and result.reason == "distress_signal":
                ctx["_care_path"] = True

        self.observability.record_request(self.chitti, request_id, user_text, ctx)
        return user_text

    # ---- output gate ----

    def after_model(self, user_text: str, model_output: str, ctx: dict | None = None) -> str:
        ctx = ctx or {}
        request_id = ctx.get("request_id", uuid.uuid4().hex[:12])
        modified = model_output
        # JSON-output callers set ctx["_skip_compliance_inject"]=True so the
        # Compliance rail still RECORDS the inject decision in the audit
        # log, but doesn't append the disclaimer string (which would corrupt
        # the JSON). The caller is then responsible for surfacing the
        # disclaimer outside the JSON envelope.
        skip_inject = bool(ctx.get("_skip_compliance_inject"))

        for rail in self.quadrails:
            result = rail.check_output(user_text, modified, ctx)
            self._record_rail_result(result, request_id, phase="after_model")
            if result.action == Action.INJECT and rail.name == "compliance" and not skip_inject:
                disclaimer = (result.payload or {}).get("text", "")
                if disclaimer and disclaimer not in modified:
                    modified = modified.rstrip() + "\n\n" + disclaimer
            # WARN actions (truth, soft_disclaimer) are logged only.

        if ctx.get("_care_path"):
            modified = self.care_path_prefix + modified

        latency_ms = int((time.time() - ctx.get("ts_start", time.time())) * 1000)
        self.observability.record_response(
            self.chitti, request_id, user_text, modified,
            latency_ms=latency_ms, ctx=ctx,
        )
        return modified

    # ---- one-shot LLM wrap ----

    def wrap_llm(
        self,
        call_fn: Callable[[str], str],
        user_text: str,
        ctx: dict | None = None,
        *,
        compliance_inject: bool = True,
    ) -> dict:
        """Wrap a DeepSeek (or any LLM) call with before_model + after_model.

        Service code that already returns a string from `call_fn(safe_text)`
        becomes one line:

            wrapped = hooks.wrap_llm(lambda s: _raw_deepseek(s), user_text, ctx)
            if wrapped["blocked"]:
                return {"ok": False, "reply": wrapped["reply"], ...}
            return {"ok": True, "reply": wrapped["reply"], ...}

        Returns a dict; never raises (rail BLOCK is communicated via
        `blocked=True`, not an exception).

        `compliance_inject=False` keeps the Compliance rail RECORDING in the
        audit log but skips appending the disclaimer to the raw model
        output. Required for JSON-output callers
        (e.g. legal_service.explain_notice, medupi_recognition._vision_extract)
        where the caller surfaces the disclaimer outside the JSON envelope.
        """
        ctx = ctx or {}
        if not compliance_inject:
            ctx["_skip_compliance_inject"] = True
        gated = self.before_model(user_text, ctx)
        if isinstance(gated, RefusalResponse):
            return {
                "ok": False,
                "blocked": True,
                "rail": gated.rail,
                "reason": gated.reason,
                "reply": gated.user_facing,
                "request_id": gated.request_id,
                "latency_ms": 0,
            }

        raw_output = call_fn(gated)
        final = self.after_model(gated, raw_output or "", ctx)
        latency_ms = int((time.time() - ctx.get("ts_start", time.time())) * 1000)
        return {
            "ok": True,
            "blocked": False,
            "reply": final,
            "request_id": ctx.get("request_id"),
            "latency_ms": latency_ms,
        }

    # ---- tool gates ----

    def before_tool(self, tool_name: str, args: dict, ctx: dict | None = None) -> dict | RefusalResponse:
        """Pre-flight check for tool calls (DB writes, external APIs, etc.).

        Today the policy is permissive — we just log. Block patterns live
        in code (e.g. chitti-vaani's COP_DENYLIST). Future rails can be
        added here without touching call sites.
        """
        ctx = ctx or {}
        request_id = ctx.setdefault("request_id", uuid.uuid4().hex[:12])
        self.observability.record_tool_call(
            self.chitti, request_id, tool_name, args, phase="before",
        )
        return args

    def after_tool(self, tool_name: str, args: dict, result: Any, ctx: dict | None = None) -> Any:
        ctx = ctx or {}
        request_id = ctx.get("request_id", uuid.uuid4().hex[:12])
        self.observability.record_tool_call(
            self.chitti, request_id, tool_name, args, phase="after", result_summary=_summarise(result),
        )
        return result

    # ---- internals ----

    def _record_rail_result(self, result: CheckResult, request_id: str, *, phase: str) -> None:
        # PASS results aren't worth a row each. Only log non-trivial outcomes.
        if result.action == Action.PASS:
            return
        try:
            self.observability.record_rail(
                self.chitti, request_id, rail=result.rail,
                action=result.action.value, reason=result.reason,
                payload=result.payload, phase=phase,
            )
        except Exception as e:  # noqa: BLE001 — observability must never crash a request
            log.warning("observability.record_rail failed: %s", e)


def _summarise(result: Any, max_chars: int = 200) -> str:
    """Compact representation of a tool result for the audit log."""
    try:
        s = repr(result)
    except Exception:
        s = "<unrepr-able result>"
    if len(s) > max_chars:
        s = s[:max_chars] + "…"
    return s
