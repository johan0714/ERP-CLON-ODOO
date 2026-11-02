from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import ResPartner
from backend.app.schemas.schemas import PartnerCreate, PartnerOut

router = APIRouter(prefix="/contacts", tags=["Contactos"])


@router.get("/", response_model=List[PartnerOut])
def list_partners(
    search: Optional[str] = Query(None),
    is_customer: Optional[bool] = Query(None),
    is_supplier: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ResPartner).filter(ResPartner.active == True)
    if search:
        query = query.filter(ResPartner.name.ilike(f"%{search}%") | ResPartner.email.ilike(f"%{search}%") | ResPartner.vat.ilike(f"%{search}%"))
    if is_customer is not None:
        query = query.filter(ResPartner.is_customer == is_customer)
    if is_supplier is not None:
        query = query.filter(ResPartner.is_supplier == is_supplier)
    return query.order_by(ResPartner.name.asc()).all()


@router.get("/{partner_id}", response_model=PartnerOut)
def get_partner(partner_id: int, db: Session = Depends(get_db)):
    partner = db.query(ResPartner).filter(ResPartner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    return partner


@router.post("/", response_model=PartnerOut)
def create_partner(partner_in: PartnerCreate, db: Session = Depends(get_db)):
    partner = ResPartner(**partner_in.model_dump())
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.put("/{partner_id}", response_model=PartnerOut)
def update_partner(partner_id: int, partner_in: PartnerCreate, db: Session = Depends(get_db)):
    partner = db.query(ResPartner).filter(ResPartner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    for key, value in partner_in.model_dump().items():
        setattr(partner, key, value)
    db.commit()
    db.refresh(partner)
    return partner


@router.delete("/{partner_id}")
def delete_partner(partner_id: int, db: Session = Depends(get_db)):
    partner = db.query(ResPartner).filter(ResPartner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")
    partner.active = False
    db.commit()
    return {"message": "Contacto archivado correctamente"}
