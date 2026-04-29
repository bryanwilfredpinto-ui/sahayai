"""
routes/chat.py
--------------
Chitti AI Chat. DeepSeek-powered. Stores last 50 messages per user so
the chat survives reload.

  GET    /api/chat                - last 50 messages
  POST   /api/chat                - send a message; returns assistant reply
  DELETE /api/chat                - wipe history

Context Chitti has access to:
  - User's name + watchlist symbols
  - Current Nifty + Sensex (cached)
  - Recent open call reports
We do NOT send portfolio holdings to the LLM by default - that's
sensitive. Add a flag if the user opts in later.
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.stock import CallReport, ChatMessage, WatchlistItem
from models.user import User
from services.cache import cache
from services.data_source import (
    DataSourceAuthError, DataSourceError, get_quote,
)
from services.deepseek_client import DeepSeekError, chat as deepseek_chat
from services.deps import get_current_user

log = logging.getLogger("chat")

router = APIRouter(prefix="/api/chat", tags=["chat"])

MAX_HISTORY_RETURNED = 50
MAX_HISTORY_FOR_CONTEXT = 10  # last N messages we resend to DeepSeek


class ChatIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


@router.get("")
def get_history(user: User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    rows = (db.query(ChatMessage)
            .filter(ChatMessage.user_id == user.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(MAX_HISTORY_RETURNED).all())
    return [
        {"role": r.role, "content": r.content,
         "created_at": r.created_at.isoformat()}
        for r in reversed(rows)
    ]


@router.post("")
async def send_message(payload: ChatIn,
                       user: User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    # Persist user message
    user_msg = ChatMessage(user_id=user.id, role="user", content=payload.message)
    db.add(user_msg); db.commit()

    # Build context string
    context = _build_context(user, db)

    # Last few messages for continuity
    recent = (db.query(ChatMessage)
              .filter(ChatMessage.user_id == user.id)
              .order_by(ChatMessage.created_at.desc())
              .limit(MAX_HISTORY_FOR_CONTEXT).all())
    recent = list(reversed(recent))

    history_text = "\n".join(
        f"{'User' if m.role=='user' else 'Chitti'}: {m.content[:500]}"
        for m in recent[:-1]   # drop the message we just stored - we'll send it separately
    )

    lang_pin = (
        "Reply in English."
        if (user.language or "en") == "en"
        else "Reply in clear Hindi (Devanagari script). Numbers and ticker symbols may stay in English."
    )

    system = (
        "You are Chitti, an AI trading assistant for Indian retail traders. "
        "Be concise (3-5 sentences max), specific, and practical. "
        "If asked for a stock pick or buy/sell call, ALWAYS include: "
        "rationale, entry zone, stop loss, target. "
        "Use plain language. No financial-advice disclaimers - the app "
        "shows that elsewhere. Currency is INR. "
        "If a question is outside trading/markets, answer briefly and steer "
        "back to the user's watchlist or markets.\n\n"
        f"{lang_pin}\n\n"
        f"User context:\n{context}\n\n"
        f"Recent conversation:\n{history_text or '(none)'}"
    )

    try:
        reply = await deepseek_chat(system, payload.message,
                                    max_tokens=500, temperature=0.7,
                                    user_id=user.id)
    except DeepSeekError as e:
        # Roll back the user message so they can retry without dupes
        db.delete(user_msg); db.commit()
        raise HTTPException(status_code=502, detail=f"DeepSeek error: {e}")

    asst_msg = ChatMessage(user_id=user.id, role="assistant", content=reply)
    db.add(asst_msg); db.commit()

    return {
        "reply": reply,
        "created_at": asst_msg.created_at.isoformat(),
    }


@router.delete("")
def wipe_history(user: User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"ok": True}


def _build_context(user: User, db: Session) -> str:
    parts = [f"Name: {user.name or 'Trader'}"]

    # Watchlist
    wl = (db.query(WatchlistItem)
          .filter(WatchlistItem.user_id == user.id).limit(20).all())
    if wl:
        symbols = [w.symbol for w in wl]
        parts.append(f"Watchlist: {', '.join(symbols)}")
        try:
            quotes = get_quote(symbols, db=db)
            lines = []
            for s in symbols:
                q = quotes.get(s) or {}
                last = q.get("last_price")
                prev = q.get("prev_close")
                if last and prev:
                    pct = (last - prev) / prev * 100
                    lines.append(f"  {s} {last:.2f} ({pct:+.2f}%)")
            if lines:
                parts.append("Watchlist quotes:\n" + "\n".join(lines))
        except (DataSourceAuthError, DataSourceError):
            pass

    # Indices summary - reuse the cached one if present
    idx = cache.get("indices")
    if idx:
        n = idx.get("nifty") or {}
        s = idx.get("sensex") or {}
        parts.append(
            f"Market right now: NIFTY {n.get('value')} ({n.get('change_pct')}% / {n.get('signal')}), "
            f"SENSEX {s.get('value')} ({s.get('change_pct')}% / {s.get('signal')}), "
            f"market_open={idx.get('market_open')}"
        )

    # Open calls (this user's)
    open_calls = (db.query(CallReport)
                  .filter(CallReport.user_id == user.id,
                          CallReport.status == "open").limit(10).all())
    if open_calls:
        lines = [f"  {c.call_type} {c.symbol} entry {c.entry_price} target {c.target} SL {c.stop_loss}"
                 for c in open_calls]
        parts.append("Your open calls:\n" + "\n".join(lines))

    return "\n".join(parts)
