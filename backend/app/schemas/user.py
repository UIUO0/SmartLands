from pydantic import BaseModel, EmailStr

# ===== Responses =====
class UserOut(BaseModel):
    user_id: int
    email: EmailStr
    full_name: str
    picture_url: str | None = None
    role: str

    class Config:
        from_attributes = True  # Pydantic v2: لتحويل SQLAlchemy models إلى Pydantic

# ===== Requests =====
class SignupIn(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
from pydantic import BaseModel
from typing import Optional

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    picture_url: Optional[str] = None
from pydantic import BaseModel, constr


class PasswordResetWithCode(BaseModel):
    code: str
    new_password: constr(min_length=8)
from pydantic import BaseModel, constr


class ResetPasswordRequest(BaseModel):
    code: str
    new_password: constr(min_length=8)
