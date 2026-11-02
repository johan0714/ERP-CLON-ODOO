from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.models.models import (
    SaleOrder, ProductProduct, ResPartner, StockPicking, AccountMove
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_sales = db.query(func.sum(SaleOrder.amount_total)).filter(SaleOrder.state.in_(["sale", "done"])).scalar() or 0.0
    pending_orders_count = db.query(SaleOrder).filter(SaleOrder.state == "draft").count()
    confirmed_orders_count = db.query(SaleOrder).filter(SaleOrder.state == "sale").count()
    
    total_products = db.query(ProductProduct).filter(ProductProduct.active == True).count()
    total_customers = db.query(ResPartner).filter(ResPartner.active == True, ResPartner.is_customer == True).count()
    
    pending_deliveries = db.query(StockPicking).filter(StockPicking.picking_type == "outgoing", StockPicking.state != "done").count()
    
    unpaid_invoices_amount = db.query(func.sum(AccountMove.amount_residual)).filter(
        AccountMove.state == "posted", AccountMove.payment_state != "paid"
    ).scalar() or 0.0
    
    unpaid_invoices_count = db.query(AccountMove).filter(
        AccountMove.state == "posted", AccountMove.payment_state != "paid"
    ).count()

    return {
        "total_sales": round(total_sales, 2),
        "pending_orders_count": pending_orders_count,
        "confirmed_orders_count": confirmed_orders_count,
        "total_products": total_products,
        "total_customers": total_customers,
        "pending_deliveries": pending_deliveries,
        "unpaid_invoices_amount": round(unpaid_invoices_amount, 2),
        "unpaid_invoices_count": unpaid_invoices_count
    }
