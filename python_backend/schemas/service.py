
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional, List

class ServiceBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str  # 'hotel' or 'bus'
    location: str
    city: str
    state: str
    price_per_person: Decimal
    currency: str = 'INR'
    availability: int = 1
    image_url: Optional[str] = None
    rating: Optional[Decimal] = 0
    amenities: Optional[str] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(ServiceBase):
    title: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    price_per_person: Optional[Decimal] = None

class ServiceResponse(ServiceBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ServiceSearch(BaseModel):
    destination: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    type: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    rating: Optional[float] = None
    amenities: Optional[List[str]] = None
