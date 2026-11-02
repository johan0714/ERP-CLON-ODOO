from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import ProductProduct, StockPicking, StockMove, SaleOrder, IrSequence
from backend.app.schemas.schemas import ProductCreate, ProductOut, StockPickingOut

router = APIRouter(prefix="/inventory", tags=["Inventario"])


# --- PRODUCTOS ---
@router.get("/products", response_model=List[ProductOut])
def list_products(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ProductProduct).filter(ProductProduct.active == True)
    if search:
        query = query.filter(
            ProductProduct.name.ilike(f"%{search}%") | 
            ProductProduct.default_code.ilike(f"%{search}%")
        )
    return query.order_by(ProductProduct.name.asc()).all()


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(ProductProduct).filter(ProductProduct.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return prod


@router.post("/products", response_model=ProductOut)
def create_product(prod_in: ProductCreate, db: Session = Depends(get_db)):
    data = prod_in.model_dump()
    initial_qty = data.pop("initial_qty", 0.0)
    product = ProductProduct(**data, qty_available=initial_qty)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, prod_in: ProductCreate, db: Session = Depends(get_db)):
    prod = db.query(ProductProduct).filter(ProductProduct.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    data = prod_in.model_dump()
    data.pop("initial_qty", None)
    for key, val in data.items():
        setattr(prod, key, val)
    db.commit()
    db.refresh(prod)
    return prod


# --- ALBARANES / PICKINGS (ENTREGAS Y RECEPCIONES) ---
@router.get("/pickings", response_model=List[StockPickingOut])
def list_pickings(
    picking_type: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(StockPicking)
    if picking_type:
        query = query.filter(StockPicking.picking_type == picking_type)
    if state:
        query = query.filter(StockPicking.state == state)
    if origin:
        query = query.filter(StockPicking.origin == origin)
    return query.order_by(StockPicking.id.desc()).all()


@router.get("/pickings/{picking_id}", response_model=StockPickingOut)
def get_picking(picking_id: int, db: Session = Depends(get_db)):
    picking = db.query(StockPicking).filter(StockPicking.id == picking_id).first()
    if not picking:
        raise HTTPException(status_code=404, detail="Albarán no encontrado")
    return picking


@router.post("/pickings/{picking_id}/validate", response_model=StockPickingOut)
def validate_picking(picking_id: int, db: Session = Depends(get_db)):
    """Valida la entrega o recepción, descontando o sumando stock de los productos."""
    picking = db.query(StockPicking).filter(StockPicking.id == picking_id).first()
    if not picking:
        raise HTTPException(status_code=404, detail="Albarán no encontrado")
    if picking.state == "done":
        raise HTTPException(status_code=400, detail="El albarán ya ha sido validado")

    for move in picking.move_lines:
        move.quantity_done = move.product_uom_qty
        move.state = "done"
        
        # Descontar si es salida (entrega) o aumentar si es entrada (recepción)
        product = db.query(ProductProduct).filter(ProductProduct.id == move.product_id).first()
        if product and product.type == "product":
            if picking.picking_type == "outgoing":
                product.qty_available -= move.quantity_done
            elif picking.picking_type == "incoming":
                product.qty_available += move.quantity_done

    picking.state = "done"
    picking.date_done = datetime.utcnow()

    # Si proviene de una orden de venta, actualizar estado de entrega
    if picking.origin:
        so = db.query(SaleOrder).filter(SaleOrder.name == picking.origin).first()
        if so:
            so.delivery_status = "delivered"
            for sol in so.order_lines:
                sol.qty_delivered = sol.product_uom_qty

    db.commit()
    db.refresh(picking)
    return picking
