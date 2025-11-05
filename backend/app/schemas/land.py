from pydantic import BaseModel, Field
from typing import Optional

# ---------- Requests ----------
class LandCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price_amount: float
    currency_code: str = Field(default="SAR", min_length=3, max_length=3)
    area_sq_m: Optional[float] = None

    address_line: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None  # ISO-2
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

# ---------- Responses ----------
class LandOut(BaseModel):
    land_id: int
    owner_id: int | None
    title: str
    description: str | None
    price_amount: float
    currency_code: str
    status: str
    area_sq_m: float | None
    address_line: str | None = None
    city: str | None
    region: str | None
    country: str | None
    postal_code: str | None = None
    latitude: float | None
    longitude: float | None
    google_place_id: str | None = None
    cover_image_id: int | None

    class Config:
        from_attributes = True

class LandListOut(BaseModel):
    total: int
    items: list[LandOut]
from pydantic import BaseModel, HttpUrl
from typing import Optional

class LandUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price_amount: Optional[float] = None
    currency_code: Optional[str] = None
    area_sq_m: Optional[float] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None  # available/reserved/sold/archived

# ------- Images -------
class LandImageCreate(BaseModel):
    file_url: HttpUrl
    sort_order: int = 0

class LandImageOut(BaseModel):
    image_id: int
    land_id: int
    file_url: str
    is_cover: bool
    sort_order: int

    class Config:
        from_attributes = True
