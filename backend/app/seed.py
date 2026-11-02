from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.auth import hash_password
from backend.app.models.models import (
    IrSequence, ResPartner, ProductProduct, SaleOrder, SaleOrderLine, StockPicking, StockMove, ResUser
)

def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 0. Usuarios para acceso remoto inter-ciudades
    if db.query(ResUser).count() == 0:
        admin_user = ResUser(
            name="Pedro Albarracín (Admin)",
            email="admin@empresa.com",
            hashed_password=hash_password("admin123"),
            role="admin",
            city="Madrid (Central)",
            avatar_color="bg-[#714B67]"
        )
        emp_user = ResUser(
            name="Laura Gómez (Ventas & Almacén)",
            email="empleado@empresa.com",
            hashed_password=hash_password("empleado123"),
            role="employee",
            city="Barcelona (Sucursal)",
            avatar_color="bg-emerald-600"
        )
        db.add_all([admin_user, emp_user])
        db.commit()

    # 1. Configurar Secuencias
    sequences = [
        {"code": "sale.order", "name": "Ventas", "prefix": "SO-", "padding": 4, "next_number": 1001},
        {"code": "stock.picking.out", "name": "Entregas", "prefix": "WH/OUT/", "padding": 4, "next_number": 101},
        {"code": "stock.picking.in", "name": "Recepciones", "prefix": "WH/IN/", "padding": 4, "next_number": 101},
        {"code": "account.move.out", "name": "Facturas Cliente", "prefix": "INV-2026-", "padding": 4, "next_number": 501},
        {"code": "account.payment", "name": "Pagos", "prefix": "PAY-", "padding": 4, "next_number": 201},
    ]

    for s_data in sequences:
        existing = db.query(IrSequence).filter(IrSequence.code == s_data["code"]).first()
        if not existing:
            db.add(IrSequence(**s_data))

    # 2. Contactos / Clientes / Proveedores
    if db.query(ResPartner).count() == 0:
        partners = [
            ResPartner(
                name="Tecnología & Redes Globales S.A.",
                is_company=True,
                email="compras@tecglobal.com",
                phone="+34 912 345 678",
                vat="B87654321",
                street="Avenida Gran Vía 45, Planta 4",
                city="Madrid",
                country="España",
                is_customer=True,
                is_supplier=False,
                comment="Cliente VIP corporativo"
            ),
            ResPartner(
                name="Distribuidora Ibérica de Hardware",
                is_company=True,
                email="ventas@distriiberica.es",
                phone="+34 933 112 233",
                vat="A12345678",
                street="Polígono Industrial Sur, Nave 12",
                city="Barcelona",
                country="España",
                is_customer=False,
                is_supplier=True,
                comment="Proveedor principal de periféricos"
            ),
            ResPartner(
                name="Carlos Morales (Diseño Web)",
                is_company=False,
                email="carlos.morales@freelance.io",
                phone="+34 600 987 654",
                vat="53421190K",
                street="Calle Mayor 12",
                city="Valencia",
                country="España",
                is_customer=True,
                is_supplier=False,
                comment="Desarrollador independiente"
            ),
        ]
        db.add_all(partners)
        db.commit()

    # 3. Productos y Servicios
    if db.query(ProductProduct).count() == 0:
        products = [
            ProductProduct(
                name="Laptop Ultrabook Pro 15\"",
                default_code="LAP-ULTRA-15",
                type="product",
                list_price=1250.00,
                standard_price=850.00,
                qty_available=15.0,
                uom_name="Unidades",
                description="Portátil empresarial Intel i7, 32GB RAM, 1TB SSD NVMe",
                image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"
            ),
            ProductProduct(
                name="Monitor Curvo 27\" UltraHD",
                default_code="MON-27-UHD",
                type="product",
                list_price=340.00,
                standard_price=220.00,
                qty_available=28.0,
                uom_name="Unidades",
                description="Panel IPS 144Hz, HDR400, conexiones HDMI 2.1 y DisplayPort",
                image_url="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400"
            ),
            ProductProduct(
                name="Teclado Mecánico Ergonómico",
                default_code="KB-MECH-ERG",
                type="product",
                list_price=115.00,
                standard_price=65.00,
                qty_available=45.0,
                uom_name="Unidades",
                description="Switches táctiles silenciosos, retroiluminación personalizable",
                image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400"
            ),
            ProductProduct(
                name="Consultoría e Instalación IT",
                default_code="SRV-CONSULT-IT",
                type="service",
                list_price=80.00,
                standard_price=45.00,
                qty_available=0.0,
                uom_name="Horas",
                description="Servicio técnico especializado por horas"
            ),
        ]
        db.add_all(products)
        db.commit()

    # 4. Crear una orden de venta de ejemplo ya cargada
    partner_demo = db.query(ResPartner).filter(ResPartner.is_customer == True).first()
    prod_laptop = db.query(ProductProduct).filter(ProductProduct.default_code == "LAP-ULTRA-15").first()
    prod_monitor = db.query(ProductProduct).filter(ProductProduct.default_code == "MON-27-UHD").first()

    if db.query(SaleOrder).count() == 0 and partner_demo and prod_laptop and prod_monitor:
        so = SaleOrder(
            name="SO-1000",
            partner_id=partner_demo.id,
            state="draft",
            invoice_status="no",
            delivery_status="pending",
            amount_untaxed=1590.00,
            amount_tax=333.90,
            amount_total=1923.90,
            note="Presupuesto para renovación de equipo directivo."
        )
        db.add(so)
        db.flush()

        sol1 = SaleOrderLine(
            order_id=so.id,
            product_id=prod_laptop.id,
            name=prod_laptop.name,
            product_uom_qty=1.0,
            price_unit=1250.00,
            tax_percent=21.0,
            price_subtotal=1250.00,
            price_total=1512.50
        )
        sol2 = SaleOrderLine(
            order_id=so.id,
            product_id=prod_monitor.id,
            name=prod_monitor.name,
            product_uom_qty=1.0,
            price_unit=340.00,
            tax_percent=21.0,
            price_subtotal=340.00,
            price_total=411.40
        )
        db.add_all([sol1, sol2])
        db.commit()

    db.close()
    print("Seed data cargada con éxito!")

if __name__ == "__main__":
    run_seed()
