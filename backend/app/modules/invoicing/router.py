from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import AccountMove, AccountPayment, IrSequence
from backend.app.schemas.schemas import AccountMoveOut, AccountPaymentCreate, AccountPaymentOut

router = APIRouter(prefix="/invoicing", tags=["Facturación"])


@router.get("/", response_model=List[AccountMoveOut])
def list_invoices(
    state: Optional[str] = Query(None),
    payment_state: Optional[str] = Query(None),
    move_type: Optional[str] = Query("out_invoice"),
    db: Session = Depends(get_db)
):
    query = db.query(AccountMove)
    if move_type:
        query = query.filter(AccountMove.move_type == move_type)
    if state:
        query = query.filter(AccountMove.state == state)
    if payment_state:
        query = query.filter(AccountMove.payment_state == payment_state)
    return query.order_by(AccountMove.id.desc()).all()


@router.get("/{invoice_id}", response_model=AccountMoveOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(AccountMove).filter(AccountMove.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return inv


@router.post("/{invoice_id}/post", response_model=AccountMoveOut)
def post_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Publica / Confirma la factura de cliente."""
    inv = db.query(AccountMove).filter(AccountMove.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if inv.state == "posted":
        raise HTTPException(status_code=400, detail="La factura ya está publicada")

    inv.state = "posted"
    if not inv.invoice_date:
        inv.invoice_date = date.today()

    db.commit()
    db.refresh(inv)
    return inv


@router.post("/{invoice_id}/payments", response_model=AccountPaymentOut)
def register_payment(invoice_id: int, payment_in: AccountPaymentCreate, db: Session = Depends(get_db)):
    """Registra un pago parcial o total contra la factura."""
    inv = db.query(AccountMove).filter(AccountMove.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if inv.state != "posted":
        raise HTTPException(status_code=400, detail="Solo se pueden registrar pagos en facturas publicadas")
    if inv.payment_state == "paid":
        raise HTTPException(status_code=400, detail="Esta factura ya está completamente pagada")

    pay_name = IrSequence.get_next(db, "account.payment")
    payment = AccountPayment(
        name=pay_name,
        move_id=inv.id,
        partner_id=inv.partner_id,
        amount=payment_in.amount,
        payment_date=date.today(),
        payment_method=payment_in.payment_method,
        memo=payment_in.memo or f"Cobro de {inv.name}"
    )
    db.add(payment)

    # Actualizar monto residual y estado de pago
    new_residual = round(inv.amount_residual - payment_in.amount, 2)
    if new_residual <= 0.001:
        inv.amount_residual = 0.0
        inv.payment_state = "paid"
    else:
        inv.amount_residual = new_residual
        inv.payment_state = "partial"

    db.commit()
    db.refresh(payment)
    return payment
