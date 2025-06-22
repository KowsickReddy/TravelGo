
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.connection import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse, Token
from middleware.auth import create_access_token, verify_token
import uuid

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=Token)
async def login(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Login with Replit Auth token"""
    # Verify the Replit token and extract user info
    user_data = verify_token(credentials.credentials)
    
    # Create or update user
    user = db.query(User).filter(User.id == user_data["user_id"]).first()
    if not user:
        user = User(
            id=user_data["user_id"],
            email=user_data.get("email"),
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            profile_image_url=user_data.get("profile_image_url")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create JWT token
    access_token = create_access_token(data={"sub": user.id})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    current_user: User = Depends(verify_token)
):
    """Get current user profile"""
    return current_user

@router.post("/logout")
async def logout():
    """Logout user"""
    return {"message": "Successfully logged out"}
