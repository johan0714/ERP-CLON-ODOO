from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.database import engine, Base
from backend.app.models.models import *
from backend.app.modules.contacts.router import router as contacts_router
from backend.app.modules.inventory.router import router as inventory_router
from backend.app.modules.sales.router import router as sales_router
from backend.app.modules.invoicing.router import router as invoicing_router
from backend.app.modules.dashboard.router import router as dashboard_router
from backend.app.modules.auth.router import router as auth_router

from sqlalchemy import text

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auto-migration for newly added columns
with engine.connect() as conn:
    for tbl in ["sale_order_line", "account_move_line", "stock_move"]:
        try:
            conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN uom_name VARCHAR(64)"))
            conn.commit()
        except Exception:
            pass

app = FastAPI(
    title="Odoo Clone ERP API",
    description="Backend modular para ERP inspirado en Odoo (Ventas, Inventario, Facturación, Contactos)",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include module routers
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(contacts_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(invoicing_router, prefix="/api")


@app.get("/")
def root():
    return {
        "status": "online",
        "system": "Odoo Clone ERP API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
