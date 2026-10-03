from typing import Literal

from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    refresh_token: str


class TokenPayload(BaseModel):
    sub: str
    user_id: int
    exp: int
    iat: int
    type: Literal["access", "refresh"]


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or enrollment number")
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    refresh_token: str = ""  # Empty because it's in cookie
    must_change_password: bool
    role: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ActivateRequest(BaseModel):
    token: str
    enrollment_no: str
    dob: str = Field(..., description="Date of birth in YYYY-MM-DD format")
    new_password: str = Field(..., min_length=10)
    accepted_terms: bool = True


class ActivateResponse(BaseModel):
    status: Literal["activated"] = "activated"


class ActivateCheckResponse(BaseModel):
    valid: bool


class TokenCheckResponse(BaseModel):
    valid: bool


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=10)


class ChangePasswordResponse(BaseModel):
    message: str
