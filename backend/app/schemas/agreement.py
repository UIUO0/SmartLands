from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AgreementOut(BaseModel):
    agreement_id: int
    land_id: int
    buyer_user_id: int
    seller_user_id: int
    request_id: int
    agreed_amount: float
    status: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
