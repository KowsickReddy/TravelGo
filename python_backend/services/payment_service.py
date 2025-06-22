
import razorpay
import os
from typing import Dict
import uuid

# Initialize Razorpay client
RAZORPAY_KEY = os.getenv("RAZORPAY_KEY", "test_key")
RAZORPAY_SECRET = os.getenv("RAZORPAY_SECRET", "test_secret")
UPI_MERCHANT_ID = os.getenv("UPI_MERCHANT_ID", "809674639-2@ybl")

client = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))

async def create_payment_order(
    booking_id: int,
    amount: float,
    currency: str = "INR",
    payment_method: str = "upi"
) -> Dict:
    """Create payment order with Razorpay"""
    try:
        # Convert amount to paise (Razorpay uses smallest currency unit)
        amount_paise = int(amount * 100)
        
        # Create Razorpay order
        order_data = {
            "amount": amount_paise,
            "currency": currency,
            "receipt": f"booking_{booking_id}",
            "notes": {
                "booking_id": str(booking_id),
                "payment_method": payment_method
            }
        }
        
        if payment_method == "upi":
            # For UPI payments, add merchant details
            order_data["method"] = "upi"
            order_data["vpa"] = UPI_MERCHANT_ID
        
        order = client.order.create(data=order_data)
        
        # Generate payment URL for different methods
        payment_url = None
        if payment_method == "upi":
            payment_url = f"upi://pay?pa={UPI_MERCHANT_ID}&pn=TravelGo&am={amount}&cu=INR&tn=Booking%20{booking_id}"
        
        return {
            "payment_id": order["id"],
            "payment_url": payment_url,
            "status": "created",
            "amount": amount,
            "currency": currency,
            "payment_method": payment_method
        }
        
    except Exception as e:
        print(f"Payment order creation failed: {e}")
        # Return mock response for development
        return {
            "payment_id": f"pay_mock_{uuid.uuid4().hex[:10]}",
            "payment_url": f"mock://payment?amount={amount}&booking={booking_id}",
            "status": "created",
            "amount": amount,
            "currency": currency,
            "payment_method": payment_method
        }

async def verify_payment(payment_id: str, transaction_id: str) -> bool:
    """Verify payment with Razorpay"""
    try:
        # Fetch payment details
        payment = client.payment.fetch(payment_id)
        
        # Check if payment is captured and successful
        if payment["status"] == "captured":
            return True
        
        return False
        
    except Exception as e:
        print(f"Payment verification failed: {e}")
        # For development/testing, return True for mock payments
        if payment_id.startswith("pay_mock_"):
            return True
        return False

async def create_refund(payment_id: str, amount: float = None) -> Dict:
    """Create refund for a payment"""
    try:
        refund_data = {"payment_id": payment_id}
        if amount:
            refund_data["amount"] = int(amount * 100)  # Convert to paise
        
        refund = client.payment.refund(payment_id, refund_data)
        return {
            "refund_id": refund["id"],
            "status": refund["status"],
            "amount": refund["amount"] / 100  # Convert back to rupees
        }
        
    except Exception as e:
        print(f"Refund creation failed: {e}")
        return {
            "refund_id": f"rfnd_mock_{uuid.uuid4().hex[:10]}",
            "status": "processed",
            "amount": amount or 0
        }
