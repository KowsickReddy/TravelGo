
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
import os
from utils.currency import format_inr

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

async def send_email(to_email: str, subject: str, html_content: str):
    """Send email using SMTP"""
    if not SMTP_USER or not SMTP_PASS:
        print("Email not configured. Skipping email send.")
        return
    
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SMTP_USER
    message["To"] = to_email
    
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)
    
    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASS,
        )
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")

async def send_booking_confirmation(user_email: str, booking, service):
    """Send booking confirmation email"""
    template = Template("""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Booking Confirmation - TravelGo</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">🎉 Booking Confirmed!</h1>
            
            <p>Dear Traveler,</p>
            
            <p>Your booking has been confirmed successfully! Here are your booking details:</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #1e40af; margin-top: 0;">Booking Details</h2>
                <p><strong>Booking ID:</strong> #{{ booking.id }}</p>
                <p><strong>Service:</strong> {{ service.title }}</p>
                <p><strong>Type:</strong> {{ service.type|title }}</p>
                <p><strong>Location:</strong> {{ service.location }}, {{ service.city }}, {{ service.state }}</p>
                <p><strong>Date:</strong> {{ booking.booking_date }}</p>
                <p><strong>Number of People:</strong> {{ booking.number_of_people }}</p>
                <p><strong>Total Amount:</strong> {{ total_amount }}</p>
                <p><strong>Transaction ID:</strong> {{ booking.transaction_id }}</p>
                <p><strong>Payment Status:</strong> ✅ Completed</p>
            </div>
            
            {% if booking.special_requests %}
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">Special Requests</h3>
                <p>{{ booking.special_requests }}</p>
            </div>
            {% endif %}
            
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #065f46; margin-top: 0;">💡 What's Next?</h3>
                <ul style="margin: 0;">
                    <li>Save this email for your records</li>
                    <li>Carry a valid ID for verification</li>
                    <li>Contact us if you need any assistance</li>
                </ul>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #475569; margin-top: 0;">📞 Need Help?</h3>
                <p>Contact our support team:</p>
                <p>📧 Email: support@travelgo.com</p>
                <p>📱 Phone: +91-1234567890</p>
                <p>🕒 Available 24/7</p>
            </div>
            
            <p>Thank you for choosing TravelGo! We hope you have a wonderful journey.</p>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #64748b;">
                <p>TravelGo - Your Ultimate Travel Companion</p>
                <p>Making travel dreams come true across India 🇮🇳</p>
            </div>
        </div>
    </body>
    </html>
    """)
    
    html_content = template.render(
        booking=booking,
        service=service,
        total_amount=format_inr(float(booking.total_amount))
    )
    
    subject = f"🎉 Booking Confirmed - {service.title} (#{booking.id})"
    
    await send_email(user_email, subject, html_content)
