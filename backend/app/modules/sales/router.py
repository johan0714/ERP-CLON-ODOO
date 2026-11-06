from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import (
    SaleOrder, SaleOrderLine, ProductProduct, ResPartner,
    StockPicking, StockMove, AccountMove, AccountMoveLine, IrSequence
)
from backend.app.schemas.schemas import SaleOrderCreate, SaleOrderOut

router = APIRouter(prefix="/sales", tags=["Ventas"])


def _enrich_order_counts(db: Session, order: SaleOrder) -> SaleOrderOut:
    pickings_count = db.query(StockPicking).filter(StockPicking.origin == order.name).count()
    invoices_count = db.query(AccountMove).filter(AccountMove.sale_order_id == order.id).count()
    
    out = SaleOrderOut.model_validate(order)
    out.pickings_count = pickings_count
    out.invoices_count = invoices_count
    return out


@router.get("/", response_model=List[SaleOrderOut])
def list_sales_orders(
    state: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SaleOrder)
    if state:
        query = query.filter(SaleOrder.state == state)
    if search:
        query = query.filter(SaleOrder.name.ilike(f"%{search}%"))
    orders = query.order_by(SaleOrder.id.desc()).all()
    return [_enrich_order_counts(db, o) for o in orders]


@router.get("/{order_id}", response_model=SaleOrderOut)
def get_sales_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(SaleOrder).filter(SaleOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return _enrich_order_counts(db, order)


@router.post("/", response_model=SaleOrderOut)
def create_sales_order(order_in: SaleOrderCreate, db: Session = Depends(get_db)):
    partner = db.query(ResPartner).filter(ResPartner.id == order_in.partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    order_name = IrSequence.get_next(db, "sale.order")

    sale_order = SaleOrder(
        name=order_name,
        partner_id=order_in.partner_id,
        note=order_in.note,
        state="draft",
        invoice_status="no",
        delivery_status="pending",
        amount_untaxed=0.0,
        amount_tax=0.0,
        amount_total=0.0
    )
    db.add(sale_order)
    db.flush()

    total_untaxed = 0.0
    total_tax = 0.0

    for line_in in order_in.lines:
        prod = db.query(ProductProduct).filter(ProductProduct.id == line_in.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Producto {line_in.product_id} no encontrado")

        line_name = line_in.name or prod.name
        subtotal = round(line_in.product_uom_qty * line_in.price_unit, 2)
        tax = round(subtotal * (line_in.tax_percent / 100.0), 2)
        total = round(subtotal + tax, 2)

        total_untaxed += subtotal
        total_tax += tax

        uom = line_in.uom_name or prod.uom_name or "Unidad"
        line = SaleOrderLine(
            order_id=sale_order.id,
            product_id=prod.id,
            name=line_name,
            uom_name=uom,
            product_uom_qty=line_in.product_uom_qty,
            price_unit=line_in.price_unit,
            tax_percent=line_in.tax_percent,
            price_subtotal=subtotal,
            price_total=total
        )
        db.add(line)

    sale_order.amount_untaxed = round(total_untaxed, 2)
    sale_order.amount_tax = round(total_tax, 2)
    sale_order.amount_total = round(total_untaxed + total_tax, 2)

    db.commit()
    db.refresh(sale_order)
    return _enrich_order_counts(db, sale_order)


@router.post("/{order_id}/confirm", response_model=SaleOrderOut)
def confirm_sales_order(order_id: int, db: Session = Depends(get_db)):
    """Confirma el presupuesto, convirtiéndolo en Pedido de Venta y generando la Remisión de Entrega."""
    order = db.query(SaleOrder).filter(SaleOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.state == "sale":
        raise HTTPException(status_code=400, detail="El pedido ya está confirmado")

    order.state = "sale"
    order.invoice_status = "to_invoice"

    # Generar Remisión de Entrega (Stock Picking) para productos almacenables
    storable_lines = [l for l in order.order_lines if l.product and l.product.type == "product"]
    if storable_lines:
        picking_name = IrSequence.get_next(db, "stock.picking.out")
        picking = StockPicking(
            name=picking_name,
            partner_id=order.partner_id,
            picking_type="outgoing",
            origin=order.name,
            state="assigned",
            note=f"Entrega correspondiente al pedido {order.name}"
        )
        db.add(picking)
        db.flush()

        for line in storable_lines:
            move = StockMove(
                picking_id=picking.id,
                product_id=line.product_id,
                name=line.name,
                uom_name=line.uom_name or (line.product.uom_name if line.product else "Unidad"),
                product_uom_qty=line.product_uom_qty,
                quantity_done=0.0,
                state="assigned"
            )
            db.add(move)

    db.commit()
    db.refresh(order)
    return _enrich_order_counts(db, order)


@router.post("/{order_id}/create-invoice")
def create_invoice_from_order(order_id: int, db: Session = Depends(get_db)):
    """Crea una factura de cliente (AccountMove) basada en la orden de venta."""
    order = db.query(SaleOrder).filter(SaleOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    if order.state != "sale":
        raise HTTPException(status_code=400, detail="Solo se pueden facturar pedidos confirmados")

    inv_name = IrSequence.get_next(db, "account.move.out")
    invoice = AccountMove(
        name=inv_name,
        move_type="out_invoice",
        partner_id=order.partner_id,
        sale_order_id=order.id,
        state="draft",
        payment_state="not_paid",
        amount_untaxed=order.amount_untaxed,
        amount_tax=order.amount_tax,
        amount_total=order.amount_total,
        amount_residual=order.amount_total,
        invoice_origin=order.name,
        narration=f"Factura generada desde {order.name}"
    )
    db.add(invoice)
    db.flush()

    for sol in order.order_lines:
        inv_line = AccountMoveLine(
            move_id=invoice.id,
            product_id=sol.product_id,
            name=sol.name,
            uom_name=sol.uom_name or (sol.product.uom_name if sol.product else "Unidad"),
            quantity=sol.product_uom_qty,
            price_unit=sol.price_unit,
            tax_percent=sol.tax_percent,
            price_subtotal=sol.price_subtotal,
            price_total=sol.price_total
        )
        db.add(inv_line)
        sol.qty_invoiced = sol.product_uom_qty

    order.invoice_status = "invoiced"
    db.commit()
    db.refresh(invoice)

    return {"message": "Factura creada con éxito", "invoice_id": invoice.id, "invoice_name": invoice.name}


@router.delete("/{order_id}")
def delete_sales_order(order_id: int, db: Session = Depends(get_db)):
    """Elimina un pedido de venta y limpia sus registros relacionados (remisiones y facturas asociadas)."""
    order = db.query(SaleOrder).filter(SaleOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    # 1. Limpiar o revertir remisiones asociadas (StockPicking)
    pickings = db.query(StockPicking).filter(StockPicking.origin == order.name).all()
    for picking in pickings:
        for move in picking.move_lines:
            # Si ya se había descontado stock, revertir el inventario al eliminar el pedido
            if move.state == "done" and move.quantity_done > 0:
                prod = db.query(ProductProduct).filter(ProductProduct.id == move.product_id).first()
                if prod:
                    prod.qty_available += move.quantity_done
            db.delete(move)
        db.delete(picking)

    # 2. Limpiar facturas asociadas generadas desde este pedido
    invoices = db.query(AccountMove).filter(
        (AccountMove.sale_order_id == order.id) | (AccountMove.invoice_origin == order.name)
    ).all()
    for inv in invoices:
        db.delete(inv)

    # 3. Eliminar el pedido de venta (sus order_lines se eliminan por cascade)
    order_name = order.name
    db.delete(order)
    db.commit()

    return {"message": f"Pedido {order_name} eliminado con éxito", "id": order_id}

