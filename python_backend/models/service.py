
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Boolean
from sqlalchemy.sql import func
from database.connection import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)  # 'hotel' or 'bus'
    location = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    price_per_person = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default='INR')
    availability = Column(Integer, default=1)
    image_url = Column(String(500))
    rating = Column(Numeric(2, 1), default=0)
    amenities = Column(Text)  # JSON string of amenities
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
