from datetime import date, datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import AccountMove, AccountPayment, IrSequence, DianConfig, DianInvoiceStamp
from backend.app.schemas.schemas import AccountMoveOut, AccountPaymentCreate, AccountPaymentOut, DianConfigIn, DianConfigOut, DianInvoiceStampOut
from backend.app.services.factus_service import get_or_create_dian_config, test_factus_connection, emit_invoice_to_dian

router = APIRouter(prefix="/invoicing", tags=["Facturación"])


# --- CONFIGURACIÓN FACTURACIÓN ELECTRÓNICA DIAN (FACTUS) ---

@router.get("/dian/config", response_model=DianConfigOut)
def get_dian_configuration(db: Session = Depends(get_db)):
    """Obtiene la configuración actual de Factus / DIAN."""
    return get_or_create_dian_config(db)


@router.post("/dian/config", response_model=DianConfigOut)
def update_dian_configuration(config_in: DianConfigIn, db: Session = Depends(get_db)):
    """Actualiza las credenciales de la API de Factus."""
    config = get_or_create_dian_config(db)
    config.provider = config_in.provider
    config.is_sandbox = config_in.is_sandbox
    config.client_id = config_in.client_id
    config.client_secret = config_in.client_secret
    config.token = config_in.token
    config.company_nit = config_in.company_nit or "901.458.921-3"
    config.company_name = config_in.company_name or "Grupo Soluciones Colombia S.A.S."
    config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(config)
    return config


@router.post("/dian/test-connection")
def test_dian_connection(db: Session = Depends(get_db)):
    """Prueba la conexión y credenciales con la API de Factus."""
    config = get_or_create_dian_config(db)
    return test_factus_connection(config)


@router.post("/{invoice_id}/emit-dian", response_model=DianInvoiceStampOut)
def emit_invoice_dian(invoice_id: int, db: Session = Depends(get_db)):
    """Emite la factura electrónica a la DIAN mediante la API de Factus, generando CUFE y validación previa."""
    inv = db.query(AccountMove).filter(AccountMove.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if inv.state != "posted":
        raise HTTPException(status_code=400, detail="Solo se pueden emitir a la DIAN facturas en estado Publicada")

    try:
        stamp = emit_invoice_to_dian(db, inv)
        return stamp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al emitir factura a la DIAN: {str(e)}")


@router.get("/{invoice_id}/dian-xml")
def get_invoice_dian_xml(invoice_id: int, db: Session = Depends(get_db)):
    """Retorna el XML UBL 2.1 con la firma digital y validación de la DIAN."""
    inv = db.query(AccountMove).filter(AccountMove.id == invoice_id).first()
    if not inv or not inv.dian_stamp:
        raise HTTPException(status_code=404, detail="XML no encontrado o factura no emitida a la DIAN")

    stamp = inv.dian_stamp
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>10</cbc:CustomizationID>
    <cbc:ProfileID>DIAN 2.1: Factura Electrónica de Venta</cbc:ProfileID>
    <cbc:ID>{stamp.dian_number or inv.name}</cbc:ID>
    <cbc:UUID schemeName="CUFE-SHA384">{stamp.cufe}</cbc:UUID>
    <cbc:IssueDate>{inv.invoice_date}</cbc:IssueDate>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeName="31">901458921</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>Grupo Soluciones Colombia S.A.S.</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="COP">{inv.amount_untaxed}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="COP">{inv.amount_tax}</cbc:TaxExclusiveAmount>
        <cbc:PayableAmount currencyID="COP">{inv.amount_total}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
</Invoice>"""
    return Response(content=xml_content, media_type="application/xml")



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
