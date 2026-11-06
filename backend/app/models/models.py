from datetime import datetime, date
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class IrSequence(Base):
    __tablename__ = "ir_sequence"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    prefix = Column(String(32), default="")
    padding = Column(Integer, default=4)
    next_number = Column(Integer, default=1)

    @classmethod
    def get_next(cls, db, code: str) -> str:
        seq = db.query(cls).filter(cls.code == code).with_for_update().first()
        if not seq:
            # Fallback default sequence
            seq = cls(code=code, name=code, prefix=code[:3].upper() + "-", padding=4, next_number=1)
            db.add(seq)
            db.flush()
        num_str = str(seq.next_number).zfill(seq.padding)
        result = f"{seq.prefix}{num_str}"
        seq.next_number += 1
        db.commit()
        return result


class ResUser(Base):
    __tablename__ = "res_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), default="employee")  # 'admin' o 'employee'
    active = Column(Boolean, default=True)
    city = Column(String(128), nullable=True)  # Ciudad/Sede desde donde opera
    avatar_color = Column(String(32), default="bg-indigo-600")
    created_at = Column(DateTime, default=datetime.utcnow)


class ResPartner(Base):
    __tablename__ = "res_partner"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    is_company = Column(Boolean, default=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(64), nullable=True)
    vat = Column(String(64), nullable=True)  # Tax ID / CIF / RUT / RFC
    street = Column(String(255), nullable=True)
    city = Column(String(128), nullable=True)
    country = Column(String(64), default="Colombia")
    is_customer = Column(Boolean, default=True)
    is_supplier = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sale_orders = relationship("SaleOrder", back_populates="partner")
    pickings = relationship("StockPicking", back_populates="partner")
    invoices = relationship("AccountMove", back_populates="partner")


class ProductProduct(Base):
    __tablename__ = "product_product"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    default_code = Column(String(64), nullable=True, index=True)  # SKU
    barcode = Column(String(64), nullable=True)
    type = Column(String(32), default="product")  # 'product' (almacenable), 'service', 'consu'
    list_price = Column(Float, default=0.0)  # Precio de venta
    standard_price = Column(Float, default=0.0)  # Coste
    qty_available = Column(Float, default=0.0)  # Stock actual disponible
    uom_name = Column(String(32), default="Unidades")
    active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class StockPicking(Base):
    __tablename__ = "stock_picking"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, index=True)  # WH/OUT/0001
    partner_id = Column(Integer, ForeignKey("res_partner.id"), nullable=True)
    picking_type = Column(String(32), default="outgoing")  # 'outgoing' (entrega a cliente), 'incoming' (recepción)
    origin = Column(String(64), nullable=True, index=True)  # 'SO-0001'
    state = Column(String(32), default="draft")  # draft, waiting, assigned (listo), done (transferido), cancel
    scheduled_date = Column(DateTime, default=datetime.utcnow)
    date_done = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    partner = relationship("ResPartner", back_populates="pickings")
    move_lines = relationship("StockMove", back_populates="picking", cascade="all, delete-orphan")


class StockMove(Base):
    __tablename__ = "stock_move"

    id = Column(Integer, primary_key=True, index=True)
    picking_id = Column(Integer, ForeignKey("stock_picking.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product_product.id"), nullable=False)
    name = Column(String(255), nullable=False)
    uom_name = Column(String(64), nullable=True)
    product_uom_qty = Column(Float, default=1.0)  # Cantidad demandada
    quantity_done = Column(Float, default=0.0)  # Cantidad entregada/recibida
    state = Column(String(32), default="draft")

    picking = relationship("StockPicking", back_populates="move_lines")
    product = relationship("ProductProduct")


class SaleOrder(Base):
    __tablename__ = "sale_order"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, index=True)  # SO-0001
    partner_id = Column(Integer, ForeignKey("res_partner.id"), nullable=False)
    date_order = Column(DateTime, default=datetime.utcnow)
    state = Column(String(32), default="draft")  # draft (presupuesto), sent, sale (pedido de venta), done, cancel
    invoice_status = Column(String(32), default="no")  # 'no', 'to_invoice', 'invoiced'
    delivery_status = Column(String(32), default="pending")  # 'pending', 'partial', 'delivered'
    
    amount_untaxed = Column(Float, default=0.0)
    amount_tax = Column(Float, default=0.0)
    amount_total = Column(Float, default=0.0)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    partner = relationship("ResPartner", back_populates="sale_orders")
    order_lines = relationship("SaleOrderLine", back_populates="order", cascade="all, delete-orphan")
    invoices = relationship("AccountMove", back_populates="sale_order")


class SaleOrderLine(Base):
    __tablename__ = "sale_order_line"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sale_order.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product_product.id"), nullable=False)
    name = Column(String(255), nullable=False)
    uom_name = Column(String(64), nullable=True)
    product_uom_qty = Column(Float, default=1.0)
    qty_delivered = Column(Float, default=0.0)
    qty_invoiced = Column(Float, default=0.0)
    price_unit = Column(Float, default=0.0)
    tax_percent = Column(Float, default=19.0)
    price_subtotal = Column(Float, default=0.0)
    price_total = Column(Float, default=0.0)

    order = relationship("SaleOrder", back_populates="order_lines")
    product = relationship("ProductProduct")


class AccountMove(Base):
    __tablename__ = "account_move"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, index=True)  # INV-2026-0001
    move_type = Column(String(32), default="out_invoice")  # out_invoice (cliente), in_invoice (proveedor)
    partner_id = Column(Integer, ForeignKey("res_partner.id"), nullable=False)
    sale_order_id = Column(Integer, ForeignKey("sale_order.id"), nullable=True)
    invoice_date = Column(Date, default=date.today)
    invoice_date_due = Column(Date, nullable=True)
    
    state = Column(String(32), default="draft")  # draft, posted, cancel
    payment_state = Column(String(32), default="not_paid")  # not_paid, partial, paid
    
    amount_untaxed = Column(Float, default=0.0)
    amount_tax = Column(Float, default=0.0)
    amount_total = Column(Float, default=0.0)
    amount_residual = Column(Float, default=0.0)  # Monto pendiente de cobro
    
    invoice_origin = Column(String(64), nullable=True)
    narration = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    partner = relationship("ResPartner", back_populates="invoices")
    sale_order = relationship("SaleOrder", back_populates="invoices")
    invoice_lines = relationship("AccountMoveLine", back_populates="move", cascade="all, delete-orphan")
    payments = relationship("AccountPayment", back_populates="move", cascade="all, delete-orphan")
    dian_stamp = relationship("DianInvoiceStamp", back_populates="move", uselist=False, cascade="all, delete-orphan")


class AccountMoveLine(Base):
    __tablename__ = "account_move_line"

    id = Column(Integer, primary_key=True, index=True)
    move_id = Column(Integer, ForeignKey("account_move.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product_product.id"), nullable=True)
    name = Column(String(255), nullable=False)
    uom_name = Column(String(64), nullable=True)
    quantity = Column(Float, default=1.0)
    price_unit = Column(Float, default=0.0)
    tax_percent = Column(Float, default=19.0)
    price_subtotal = Column(Float, default=0.0)
    price_total = Column(Float, default=0.0)

    move = relationship("AccountMove", back_populates="invoice_lines")
    product = relationship("ProductProduct")


class AccountPayment(Base):
    __tablename__ = "account_payment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, index=True)  # PAY-0001
    move_id = Column(Integer, ForeignKey("account_move.id"), nullable=False)
    partner_id = Column(Integer, ForeignKey("res_partner.id"), nullable=False)
    amount = Column(Float, default=0.0)
    payment_date = Column(Date, default=date.today)
    payment_method = Column(String(32), default="transfer")  # transfer, cash, card
    memo = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    move = relationship("AccountMove", back_populates="payments")


class DianInvoiceStamp(Base):
    __tablename__ = "dian_invoice_stamp"

    id = Column(Integer, primary_key=True, index=True)
    move_id = Column(Integer, ForeignKey("account_move.id"), unique=True, index=True, nullable=False)
    status = Column(String(32), default="accepted")  # accepted, pending, rejected
    cufe = Column(String(128), nullable=True, index=True)
    dian_number = Column(String(64), nullable=True)
    qr_data = Column(Text, nullable=True)
    pdf_url = Column(String(500), nullable=True)
    xml_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    move = relationship("AccountMove", back_populates="dian_stamp")


class DianConfig(Base):
    __tablename__ = "dian_config"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(32), default="factus")  # factus, thefactory
    is_sandbox = Column(Boolean, default=True)
    client_id = Column(String(255), nullable=True)
    client_secret = Column(String(255), nullable=True)
    token = Column(Text, nullable=True)
    company_nit = Column(String(32), default="901234567")
    company_name = Column(String(255), default="Grupo Soluciones Colombia")
    updated_at = Column(DateTime, default=datetime.utcnow)

