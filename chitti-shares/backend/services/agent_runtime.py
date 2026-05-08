"""
services/agent_runtime.py
-------------------------
Generic agentic loop:

  1. user question + system prompt + tool definitions ->
  2. LLM picks a tool (or answers directly) ->
  3. we execute the tool, append the result to the chat ->
  4. loop until the LLM produces a final text answer (no more tool calls).

Provider: DeepSeek (services.deepseek_client.chat_with_tools). Same OpenAI-
style tool-calling shape as Anthropic / OpenAI / Mistral, so swapping providers
later is one-line.

Public:
    run_agent(system, user, tools, executors, *, max_steps=6)
        -> {"answer": str, "trace": [...], "steps": int}

`tools`     : OpenAI-style tool definitions (schemas only).
`executors` : {tool_name: callable(arguments_dict) -> JSON-serialisable}
              — the actual tool implementations. Sync or async.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Awaitable, Callable

from services.deepseek_client import DeepSeekError, chat_with_tools

log = logging.getLogger("agent_runtime")

ToolFn = Callable[[dict], Any] | Callable[[dict], Awaitable[Any]]


async def _maybe_await(v: Any) -> Any:
    if asyncio.iscoroutine(v):
        return await v
    return v


_DS_INPUT_PER_M  = 22.50    # INR / 1M input tokens  (mirrors usage_tracker.PRICING)
_DS_OUTPUT_PER_M = 91.50    # INR / 1M output tokens


def _cost_inr(tokens_in: int, tokens_out: int) -> float:
    return round((tokens_in / 1_000_000) * _DS_INPUT_PER_M
                 + (tokens_out / 1_000_000) * _DS_OUTPUT_PER_M, 4)


async def run_agent(system: str, user: str,
                    tools: list[dict],
                    executors: dict[str, ToolFn],
                    *,
                    max_steps: int = 6) -> dict:
    """
    Run a tool-using agent loop. Caps at max_steps to bound cost.
    The response carries `cost: {input_tokens, output_tokens, inr}` so
    the UI can show "🪙 X in / Y out · ₹Z" next to every Chitti reply.
    """
    messages: list[dict] = [
        {"role": "system", "content": system},
        {"role": "user",   "content": user},
    ]
    trace: list[dict] = []
    tot_in = tot_out = 0

    for step in range(max_steps):
        try:
            res = await chat_with_tools(messages, tools=tools, max_tokens=900)
        except DeepSeekError as e:
            return {
                "answer": f"(Agent unavailable — {e}). Please retry shortly.",
                "trace": trace,
                "steps": step,
                "error": str(e),
                "cost": {"input_tokens": tot_in, "output_tokens": tot_out,
                         "inr": _cost_inr(tot_in, tot_out)},
            }

        # Sum tokens across loop steps.
        tu = res.get("tokens_used") or {}
        tot_in  += int(tu.get("input")  or 0)
        tot_out += int(tu.get("output") or 0)

        msg = res["message"]
        tool_calls = msg.get("tool_calls") or []

        # No tool calls -> final text answer, return.
        if not tool_calls:
            return {
                "answer": (msg.get("content") or "").strip(),
                "trace": trace,
                "steps": step + 1,
                "cost": {"input_tokens": tot_in, "output_tokens": tot_out,
                         "inr": _cost_inr(tot_in, tot_out)},
            }

        # Persist the assistant message verbatim so tool_call_id round-trips.
        messages.append(msg)

        # Run every tool call the model emitted (sequentially — Angel SmartAPI
        # rate-limits historical-data calls anyway). Append each result back
        # in a {role:"tool"} message keyed by tool_call_id.
        for tc in tool_calls:
            fn = (tc.get("function") or {})
            name = fn.get("name") or ""
            args_raw = fn.get("arguments") or "{}"
            try:
                args = json.loads(args_raw)
            except (TypeError, json.JSONDecodeError):
                args = {}

            executor = executors.get(name)
            if executor is None:
                result: Any = {"error": f"unknown tool: {name}"}
            else:
                try:
                    result = await _maybe_await(executor(args))
                except Exception as e:  # noqa: BLE001
                    log.warning("[agent] tool %s crashed: %s", name, e)
                    result = {"error": str(e)}

            trace.append({"step": step + 1, "tool": name, "args": args,
                          "result_preview": str(result)[:300]})

            messages.append({
                "role": "tool",
                "tool_call_id": tc.get("id"),
                "content": json.dumps(result, default=str)[:6000],
            })

    # Loop exhausted — force a synthesis turn with no tools.
    try:
        res = await chat_with_tools(
            messages + [{"role": "user", "content":
                         "Step budget reached. Synthesise the best answer you can from the tool results above. "
                         "Close with the SEBI/MEDICAL disclaimer relevant to this product."}],
            tools=None, max_tokens=600,
        )
        tu = res.get("tokens_used") or {}
        tot_in  += int(tu.get("input")  or 0)
        tot_out += int(tu.get("output") or 0)
        return {
            "answer": (res["message"].get("content") or "").strip(),
            "trace": trace,
            "steps": max_steps,
            "note": "max_steps reached; forced synthesis",
            "cost": {"input_tokens": tot_in, "output_tokens": tot_out,
                     "inr": _cost_inr(tot_in, tot_out)},
        }
    except DeepSeekError as e:
        return {"answer": f"(Agent timed out — {e}).",
                "trace": trace, "steps": max_steps, "error": str(e),
                "cost": {"input_tokens": tot_in, "output_tokens": tot_out,
                         "inr": _cost_inr(tot_in, tot_out)}}
