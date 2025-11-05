from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from enum import Enum


# ---------- ENUM ----------
class LandStatus(str, Enum):
    available = "available"
    reserved = "reserved"
    sold = "sold"
    archived = "archived"


# ---------- Requests ----------
class LandCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price_amount: float
    area_sq_m: Optional[float] = None

    address_line: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None  # ISO-2 code (e.g. SA)
    postal_code: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_place_id: Optional[str] = None


class LandUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price_amount: Optional[float] = None
    area_sq_m: Optional[float] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[LandStatus] = None  # ✅ Enum يحمي من القيم الغلط


class LandListQuery(BaseModel):
    status: Optional[LandStatus] = None
    city: Optional[str] = None
    q: Optional[str] = None
    limit: int = 20
    offset: int = 0


# ---------- Responses ----------
class LandOut(BaseModel):
    land_id: int
    owner_id: Optional[int]
    title: str
    description: Optional[str]
    price_amount: float
    status: LandStatus
    area_sq_m: Optional[float]
    address_line: Optional[str]
    city: Optional[str]
    region: Optional[str]
    country: Optional[str]
    postal_code: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    google_place_id: Optional[str]
    cover_image_id: Optional[int]

    class Config:
        from_attributes = True


class LandListOut(BaseModel):
    total: int
    items: List[LandOut]


# ---------- Images ----------
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
