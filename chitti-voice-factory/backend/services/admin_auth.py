"""Admin OAuth authentication — GitHub/Google."""

import hashlib
import json
import os
import secrets
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass

from config import settings


@dataclass
class OAuthToken:
    access_token: str
    token_type: str
    expires_in: int


@dataclass
class OAuthUser:
    id: str
    email: str
    name: str
    avatar_url: str | None = None


_OAUTH_STATE_CACHE = {}  # state -> (timestamp, nonce)
_OAUTH_STATE_TTL_S = 600  # 10 minutes


def _is_admin(user: OAuthUser) -> bool:
    return user.email in settings.ADMIN_EMAILS


def generate_oauth_state() -> str:
    """Generate state token for OAuth flow."""
    state = secrets.token_urlsafe(32)
    _OAUTH_STATE_CACHE[state] = (time.time(), secrets.token_urlsafe(16))
    return state


def validate_oauth_state(state: str) -> bool:
    """Validate state token and clean expired entries."""
    now = time.time()
    _OAUTH_STATE_CACHE = {
        s: v for s, v in _OAUTH_STATE_CACHE.items()
        if now - v[0] < _OAUTH_STATE_TTL_S
    }
    if state not in _OAUTH_STATE_CACHE:
        return False
    del _OAUTH_STATE_CACHE[state]
    return True


async def exchange_github_code(code: str) -> tuple[OAuthUser | None, str | None]:
    """Exchange GitHub code for user info."""
    try:
        token_url = "https://github.com/login/oauth/access_token"
        token_data = urllib.parse.urlencode({
            "client_id": settings.ADMIN_OAUTH_ID,
            "client_secret": settings.ADMIN_OAUTH_SECRET,
            "code": code,
        }).encode("utf-8")

        token_req = urllib.request.Request(
            token_url,
            data=token_data,
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(token_req, timeout=5) as resp:
            token_data = json.loads(resp.read().decode())
            access_token = token_data.get("access_token")

        if not access_token:
            return None, "failed_to_get_access_token"

        user_req = urllib.request.Request(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(user_req, timeout=5) as resp:
            user_data = json.loads(resp.read().decode())

        user_email_req = urllib.request.Request(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(user_email_req, timeout=5) as resp:
            emails_data = json.loads(resp.read().decode())
            primary_email = next(
                (e["email"] for e in emails_data if e.get("primary")),
                emails_data[0]["email"] if emails_data else None,
            )

        user = OAuthUser(
            id=str(user_data.get("id")),
            email=primary_email or user_data.get("email", ""),
            name=user_data.get("name", user_data.get("login", "")),
            avatar_url=user_data.get("avatar_url"),
        )
        return user, None
    except Exception as e:
        return None, str(e)


async def exchange_google_code(code: str, redirect_uri: str) -> tuple[OAuthUser | None, str | None]:
    """Exchange Google code for user info."""
    try:
        token_url = "https://oauth2.googleapis.com/token"
        token_data = urllib.parse.urlencode({
            "client_id": settings.ADMIN_OAUTH_ID,
            "client_secret": settings.ADMIN_OAUTH_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }).encode("utf-8")

        token_req = urllib.request.Request(token_url, data=token_data)
        with urllib.request.urlopen(token_req, timeout=5) as resp:
            token_data = json.loads(resp.read().decode())
            access_token = token_data.get("access_token")

        if not access_token:
            return None, "failed_to_get_access_token"

        user_req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(user_req, timeout=5) as resp:
            user_data = json.loads(resp.read().decode())

        user = OAuthUser(
            id=user_data.get("id", ""),
            email=user_data.get("email", ""),
            name=user_data.get("name", ""),
            avatar_url=user_data.get("picture"),
        )
        return user, None
    except Exception as e:
        return None, str(e)
