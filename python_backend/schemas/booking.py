
from pydantic import BaseModel
from decimal import Decimal
from datetime import date, datetime
from typing import Optional

class BookingBase(BaseModel):
    service_id: int
    booking_date: date
    number_of_people: int
    special_requests: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    booking_date: Optional[date] = None
    number_of_people: Optional[int] = None
    special_requests: Optional[str] = None

class BookingResponse(BookingBase):
    id: int
    user_id: str
    total_amount: Decimal
    currency: str
    status: str
    payment_status: str
    payment_id: Optional[str] = None
    transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaymentRequest(BaseModel):
    booking_id: int
    payment_method: str  # 'upi', 'card', 'netbanking', 'wallet'

class PaymentResponse(BaseModel):
    payment_id: str
    payment_url: Optional[str] = None
    status: str
