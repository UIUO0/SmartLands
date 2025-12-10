from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict
from app.schemas.land import LandOut


class RequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class LandRequestCreate(BaseModel):
    pass  # We might not need any fields if we just use land_id from path


class LandRequestUpdate(BaseModel):
    status: RequestStatus


class LandRequestOut(BaseModel):
    request_id: int
    land_id: int
    from_user_id: int
    to_user_id: int
    amount: float
    status: RequestStatus
    created_at: datetime
    
    # Optional: include land details if needed
    # land: Optional[LandOut] = None

    model_config = ConfigDict(from_attributes=True)
