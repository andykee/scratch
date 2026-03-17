import hashlib
import hmac
import os

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

COOKIE_NAME = "scratch_session"
COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def _secret() -> str:
    return os.getenv("SCRATCH_SECRET", "")


def _username() -> str:
    return os.getenv("SCRATCH_USERNAME", "")


def _password() -> str:
    return os.getenv("SCRATCH_PASSWORD", "")


def _make_token() -> str:
    secret = _secret()
    if not secret:
        raise HTTPException(status_code=500, detail="SCRATCH_SECRET not configured")
    return hmac.new(secret.encode(), b"authenticated", hashlib.sha256).hexdigest()


def verify_session(request: Request) -> None:
    token = request.cookies.get(COOKIE_NAME)
    try:
        expected = _make_token()
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="Not authenticated")


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(body: LoginBody, response: Response):
    username = _username()
    password = _password()
    if not username or not password:
        raise HTTPException(status_code=500, detail="SCRATCH_USERNAME or SCRATCH_PASSWORD not configured")
    username_ok = hmac.compare_digest(body.username.encode(), username.encode())
    password_ok = hmac.compare_digest(body.password.encode(), password.encode())
    if not username_ok or not password_ok:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _make_token()
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )
    return {"ok": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, samesite="lax")
    return {"ok": True}


@router.get("/check")
def check(request: Request):
    verify_session(request)
    return {"ok": True}
