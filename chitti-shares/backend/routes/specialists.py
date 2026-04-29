"""
routes/specialists.py
---------------------
Stock-specific Chitti specialists.

  GET  /api/specialists                        - list all configured specialists
  POST /api/stocks/{symbol}/chat               - ask the specialist for a stock
       body: { message: string }

History for specialists is stored in chat_messages with a `specialist_symbol`
prefix in the role field, but to keep things simple in this drop, specialist
chats are NOT persisted to history (they're question-answer transactions).
General /api/chat keeps its own history.
"""

from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from services import specialist
from services.deepseek_client import DeepSeekError
from services.deps import get_current_user

router = APIRouter(tags=["specialists"])


class AskIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


@router.get("/api/specialists")
def list_specialists(_user: User = Depends(get_current_user)):
    """Returns all configured specialists with their metadata."""
    items = []
    for sym, meta in specialist.get_all().items():
        items.append({
            "symbol": sym,
            "display_name": meta.get("display_name"),
            "long_name": meta.get("long_name"),
            "expertise": meta.get("expertise"),
        })
    return items


@router.post("/api/stocks/{symbol:path}/chat")
async def ask_specialist(symbol: str,
                         payload: AskIn,
                         user: User = Depends(get_current_user),
                         db: Session = Depends(get_db)):
    sym = unquote(symbol)
    if not specialist.is_specialist(sym):
        raise HTTPException(
            status_code=404,
            detail=f"No specialist for {sym}. Available: {list(specialist.get_all().keys())}"
        )

    try:
        reply = await specialist.ask(
            sym, payload.message,
            language=user.language or "en",
            user_id=user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except DeepSeekError as e:
        raise HTTPException(status_code=502, detail=f"DeepSeek error: {e}")
    return {"symbol": sym, "reply": reply}
