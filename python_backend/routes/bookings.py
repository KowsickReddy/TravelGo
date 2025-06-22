
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from database.connection import get_db
from models.booking import Booking
from models.service import Service
from models.user import User
from schemas.booking import BookingCreate, BookingResponse, PaymentRequest, PaymentResponse
from middleware.auth import get_current_user
from services.payment_service import create_payment_order, verify_payment
from services.email_service import send_booking_confirmation
from utils.currency import format_inr

router = APIRouter()

@router.post("/", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking"""
    # Check service availability
    service = db.query(Service).filter(
        Service.id == booking_data.service_id,
        Service.is_active == True
    ).first()
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if service.availability < booking_data.number_of_people:
        raise HTTPException(status_code=400, detail="Insufficient availability")
    
    # Calculate total amount
    total_amount = service.price_per_person * booking_data.number_of_people
    
    # Create booking
    booking = Booking(
        user_id=current_user.id,
        service_id=booking_data.service_id,
        booking_date=booking_data.booking_date,
        number_of_people=booking_data.number_of_people,
        total_amount=total_amount,
        special_requests=booking_data.special_requests
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)
    
    return booking

@router.get("/", response_model=List[BookingResponse])
async def get_user_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's bookings"""
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    return bookings

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific booking"""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return booking

@router.post("/{booking_id}/payment", response_model=PaymentResponse)
async def initiate_payment(
    booking_id: int,
    payment_data: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initiate payment for booking"""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.payment_status == "completed":
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    # Create payment order
    payment_response = await create_payment_order(
        booking_id=booking.id,
        amount=float(booking.total_amount),
        currency=booking.currency,
        payment_method=payment_data.payment_method
    )
    
    # Update booking with payment ID
    booking.payment_id = payment_response["payment_id"]
    db.commit()
    
    return payment_response

@router.post("/{booking_id}/payment/verify")
async def verify_booking_payment(
    booking_id: int,
    payment_id: str,
    transaction_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verify payment and confirm booking"""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify payment with gateway
    is_verified = await verify_payment(payment_id, transaction_id)
    
    if is_verified:
        # Update booking status
        booking.payment_status = "completed"
        booking.status = "confirmed"
        booking.transaction_id = transaction_id
        
        # Update service availability
        service = db.query(Service).filter(Service.id == booking.service_id).first()
        service.availability -= booking.number_of_people
        
        db.commit()
        
        # Send confirmation email
        background_tasks.add_task(
            send_booking_confirmation,
            user_email=current_user.email,
            booking=booking,
            service=service
        )
        
        return {"message": "Payment verified and booking confirmed"}
    else:
        booking.payment_status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed")

@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel booking"""
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status == "cancelled":
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    
    # Update booking status
    booking.status = "cancelled"
    
    # Restore service availability
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    service.availability += booking.number_of_people
    
    db.commit()
    
    return {"message": "Booking cancelled successfully"}
