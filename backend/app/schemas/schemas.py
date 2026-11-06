from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field


# --- PARTNERS / CONTACTS ---
class PartnerBase(BaseModel):
    name: str
    is_company: bool = False
    email: Optional[str] = None
    phone: Optional[str] = None
    vat: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    country: str = "Colombia"
    is_customer: bool = True
    is_supplier: bool = False
    comment: Optional[str] = None


class PartnerCreate(PartnerBase):
    pass


class PartnerOut(PartnerBase):
    id: int
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- PRODUCTS ---
class ProductBase(BaseModel):
    name: str
    default_code: Optional[str] = None
    barcode: Optional[str] = None
    type: str = "product"
    list_price: float = 0.0
    standard_price: float = 0.0
    uom_name: str = "Unidades"
    description: Optional[str] = None
    image_url: Optional[str] = None


class ProductCreate(ProductBase):
    initial_qty: Optional[float] = 0.0
    qty_available: Optional[float] = None


class ProductOut(ProductBase):
    id: int
    qty_available: float
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- STOCK MOVES & PICKING ---
class StockMoveOut(BaseModel):
    id: int
    product_id: int
    name: str
    product_uom_qty: float
    quantity_done: float
    state: str
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class StockPickingOut(BaseModel):
    id: int
    name: str
    partner_id: Optional[int] = None
    picking_type: str
    origin: Optional[str] = None
    state: str
    scheduled_date: datetime
    date_done: Optional[datetime] = None
    note: Optional[str] = None
    created_at: datetime
    partner: Optional[PartnerOut] = None
    move_lines: List[StockMoveOut] = []

    class Config:
        from_attributes = True


class StockPickingValidate(BaseModel):
    lines: Optional[List[dict]] = None


# --- SALE ORDER ---
class SaleOrderLineCreate(BaseModel):
    product_id: int
    name: Optional[str] = None
    uom_name: Optional[str] = None
    product_uom_qty: float = 1.0
    price_unit: float
    tax_percent: float = 19.0


class SaleOrderLineOut(BaseModel):
    id: int
    product_id: int
    name: str
    uom_name: Optional[str] = None
    product_uom_qty: float
    qty_delivered: float
    qty_invoiced: float
    price_unit: float
    tax_percent: float
    price_subtotal: float
    price_total: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class SaleOrderCreate(BaseModel):
    partner_id: int
    note: Optional[str] = None
    lines: List[SaleOrderLineCreate]


class SaleOrderOut(BaseModel):
    id: int
    name: str
    partner_id: int
    date_order: datetime
    state: str
    invoice_status: str
    delivery_status: str
    amount_untaxed: float
    amount_tax: float
    amount_total: float
    note: Optional[str] = None
    created_at: datetime
    partner: Optional[PartnerOut] = None
    order_lines: List[SaleOrderLineOut] = []
    
    # Counts for smart buttons
    pickings_count: int = 0
    invoices_count: int = 0

    class Config:
        from_attributes = True


# --- INVOICE & PAYMENTS ---
class AccountMoveLineOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    name: str
    uom_name: Optional[str] = None
    quantity: float
    price_unit: float
    tax_percent: float
    price_subtotal: float
    price_total: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class AccountPaymentCreate(BaseModel):
    amount: float
    payment_method: str = "transfer"
    memo: Optional[str] = None


class AccountPaymentOut(BaseModel):
    id: int
    name: str
    move_id: int
    partner_id: int
    amount: float
    payment_date: date
    payment_method: str
    memo: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DianInvoiceStampOut(BaseModel):
    id: int
    status: str
    cufe: Optional[str] = None
    dian_number: Optional[str] = None
    qr_data: Optional[str] = None
    pdf_url: Optional[str] = None
    xml_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AccountMoveOut(BaseModel):
    id: int
    name: str
    move_type: str
    partner_id: int
    sale_order_id: Optional[int] = None
    invoice_date: date
    invoice_date_due: Optional[date] = None
    state: str
    payment_state: str
    amount_untaxed: float
    amount_tax: float
    amount_total: float
    amount_residual: float
    invoice_origin: Optional[str] = None
    narration: Optional[str] = None
    created_at: datetime
    partner: Optional[PartnerOut] = None
    invoice_lines: List[AccountMoveLineOut] = []
    payments: List[AccountPaymentOut] = []
    dian_stamp: Optional[DianInvoiceStampOut] = None

    class Config:
        from_attributes = True


class DianConfigIn(BaseModel):
    provider: str = "factus"
    is_sandbox: bool = True
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    token: Optional[str] = None
    company_nit: Optional[str] = "901234567"
    company_name: Optional[str] = "Grupo Soluciones Colombia"


class DianConfigOut(DianConfigIn):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

