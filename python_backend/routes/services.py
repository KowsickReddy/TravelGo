
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from database.connection import get_db
from models.service import Service
from models.user import User
from schemas.service import ServiceResponse, ServiceSearch, ServiceCreate, ServiceUpdate
from middleware.auth import get_current_user
from utils.indian_cities import INDIAN_CITIES

router = APIRouter()

@router.get("/", response_model=List[ServiceResponse])
async def search_services(
    destination: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    rating: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """Search services with filters"""
    query = db.query(Service).filter(Service.is_active == True)
    
    if destination:
        query = query.filter(
            or_(
                Service.location.ilike(f"%{destination}%"),
                Service.city.ilike(f"%{destination}%"),
                Service.state.ilike(f"%{destination}%")
            )
        )
    
    if city:
        # Validate Indian city
        if city not in INDIAN_CITIES:
            raise HTTPException(
                status_code=400,
                detail=f"City '{city}' is not supported. We only serve Indian cities."
            )
        query = query.filter(Service.city.ilike(f"%{city}%"))
    
    if state:
        query = query.filter(Service.state.ilike(f"%{state}%"))
    
    if type:
        if type not in ["hotel", "bus"]:
            raise HTTPException(status_code=400, detail="Type must be 'hotel' or 'bus'")
        query = query.filter(Service.type == type)
    
    if min_price:
        query = query.filter(Service.price_per_person >= min_price)
    
    if max_price:
        query = query.filter(Service.price_per_person <= max_price)
    
    if rating:
        query = query.filter(Service.rating >= rating)
    
    services = query.order_by(Service.rating.desc()).all()
    return services

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: int, db: Session = Depends(get_db)):
    """Get service by ID"""
    service = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@router.post("/", response_model=ServiceResponse)
async def create_service(
    service_data: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new service (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate Indian city
    if service_data.city not in INDIAN_CITIES:
        raise HTTPException(
            status_code=400,
            detail=f"City '{service_data.city}' is not supported. We only serve Indian cities."
        )
    
    service = Service(**service_data.dict())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.get("/cities/list")
async def get_supported_cities():
    """Get list of supported Indian cities"""
    return {"cities": INDIAN_CITIES}
