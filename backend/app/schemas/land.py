from pydantic import BaseModel, Field
from typing import Optional

# --------- Requests ----------
class LandCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price_amount: float
    currency_code: str = Field(default="SAR", min_length=3, max_length=3)
    area_sq_m: Optional[float] = None

    address_line: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None  # ISO-2 لو تبغى
    postal_code: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_place_id: Optional[str] = None

class LandListQuery(BaseModel):
    status: Optional[str] = None
    city: Optional[str] = None
    q: Optional[str] = None
    limit: int = 20
    offset: int = 0

# --------- Responses ----------
class LandOut(BaseModel):
    land_id: int
    owner_id: int | None
    title: str
    description: str | None
    price_amount: float
    currency_code: str
    status: str
    area_sq_m: float | None
    city: str | None
    region: str | None
    country: str | None
    latitude: float | None
    longitude: float | None
    cover_image_id: int | None

    class Config:
        from_attributes = True

class LandListOut(BaseModel):
    total: int
    items: list[LandOut]
