# app/schemas/user.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ===== Request Schemas =====

class SignupIn(BaseModel):
    """User registration request"""
    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(..., min_length=1, max_length=255, description="User's full name")
    password: str = Field(..., min_length=8, max_length=72, description="Password (8-72 characters)")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if len(v) > 72:
            raise ValueError('Password must not exceed 72 characters (bcrypt limitation)')
        
        # Check for common weak passwords
        weak_passwords = ['password', '12345678', 'qwerty123', 'password123']
        if v.lower() in weak_passwords:
            raise ValueError('Password is too common. Please choose a stronger password')
        
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "user@example.com",
                "full_name": "John Doe",
                "password": "SecurePassword123"
            }]
        }
    }


class LoginIn(BaseModel):
    """User login request"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, max_length=72, description="User password")
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "email": "user@example.com",
                "password": "SecurePassword123"
            }]
        }
    }


class UserUpdate(BaseModel):
    """User profile update request"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    picture_url: Optional[str] = Field(None, max_length=512)
    
    @field_validator('picture_url')
    @classmethod
    def validate_picture_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate picture URL format"""
        if v is None:
            return v
        
        # Basic URL validation
        if not v.startswith(('http://', 'https://')):
            raise ValueError('Picture URL must start with http:// or https://')
        
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "full_name": "Jane Smith",
                "picture_url": "https://example.com/avatar.jpg"
            }]
        }
    }


class ResetPasswordRequest(BaseModel):
    """Password reset request with verification code"""
    code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code from email")
    new_password: str = Field(..., min_length=8, max_length=72, description="New password (8-72 characters)")
    
    @field_validator('code')
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Validate verification code format"""
        if not v.isdigit():
            raise ValueError('Verification code must contain only digits')
        if len(v) != 6:
            raise ValueError('Verification code must be exactly 6 digits')
        return v
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 72:
            raise ValueError('Password must not exceed 72 characters (bcrypt limitation)')
        
        # Check for common weak passwords
        weak_passwords = ['password', '12345678', 'qwerty123', 'password123']
        if v.lower() in weak_passwords:
            raise ValueError('Password is too common. Please choose a stronger password')
        
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "code": "123456",
                "new_password": "NewSecurePassword123"
            }]
        }
    }


# ===== Response Schemas =====

class UserOut(BaseModel):
    """User profile response"""
    user_id: int
    email: str
    full_name: str
    picture_url: Optional[str] = None
    role: str = "user"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [{
                "user_id": 1,
                "email": "user@example.com",
                "full_name": "John Doe",
                "role": "user",
                "picture_url": "https://example.com/avatar.jpg",
                "created_at": "2024-01-01T00:00:00",
                "updated_at": "2024-01-01T00:00:00"
            }]
        }
    }


class TokenOut(BaseModel):
    """Authentication token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "user_id": 1,
                    "email": "user@example.com",
                    "full_name": "John Doe",
                    "role": "user"
                }
            }]
        }
    }


# Keep backward compatibility with old class names (can be removed later)
PasswordResetWithCode = ResetPasswordRequest
from pydantic import BaseModel, HttpUrl
from typing import Optional


class UserPictureOut(BaseModel):
    """Response for profile picture endpoints"""
    picture_url: str
    user_id: int
    full_name: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "picture_url": "https://res.cloudinary.com/smartlands/image/upload/v1234567890/smartlands/users/1/profile.jpg",
                "user_id": 1,
                "full_name": "John Doe"
            }]
        }
    }


class PictureUploadResponse(BaseModel):
    """Response after successful picture upload"""
    picture_url: str
    message: str = "Profile picture uploaded successfully"
    
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "picture_url": "https://res.cloudinary.com/smartlands/image/upload/v1234567890/smartlands/users/1/profile.jpg",
                "message": "Profile picture uploaded successfully"
            }]
        }
    }