from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.auth import hash_password
from backend.app.models.models import (
    IrSequence, ResPartner, ProductProduct, SaleOrder, SaleOrderLine, StockPicking, StockMove, ResUser
)

def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 0. Usuarios Santander (Bucaramanga y El Centro, Barrancabermeja)
    if db.query(ResUser).count() == 0:
        admin_user = ResUser(
            name="Pedro Albarracín (Admin)",
            email="admin@empresa.com",
            hashed_password=hash_password("admin123"),
            role="admin",
            city="Bucaramanga (Sede Principal)",
            avatar_color="bg-[#714B67]"
        )
        emp_user = ResUser(
            name="Operaciones & Logística",
            email="empleado@empresa.com",
            hashed_password=hash_password("empleado123"),
            role="employee",
            city="El Centro, Barrancabermeja",
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

    # 2. Contactos / Clientes / Proveedores (Santander: Bucaramanga y Barrancabermeja)
    if db.query(ResPartner).count() == 0:
        partners = [
            ResPartner(
                name="Servicios Industriales & Logísticos del Magdalena Medio S.A.S.",
                is_company=True,
                email="gerencia@servicioselcentro.com",
                phone="+57 607 622 8900",
                vat="901.458.789-2",
                street="Vía Principal Km 8, Sector Campo 22",
                city="El Centro, Barrancabermeja",
                country="Colombia",
                is_customer=True,
                is_supplier=False,
                comment="Cliente industrial en El Centro, Barrancabermeja"
            ),
            ResPartner(
                name="Distribuidora Comercial del Oriente S.A.S.",
                is_company=True,
                email="ventas@distrioriente.com.co",
                phone="+57 607 645 1234",
                vat="890.123.456-7",
                street="Carrera 27 # 36-14, Cabecera",
                city="Bucaramanga",
                country="Colombia",
                is_customer=False,
                is_supplier=True,
                comment="Proveedor mayorista en Bucaramanga"
            ),
            ResPartner(
                name="Contratista & Consultor Técnico",
                is_company=False,
                email="contratista@santander.co",
                phone="+57 315 987 6543",
                vat="1.098.345.678",
                street="Calle 50 # 18-25",
                city="Barrancabermeja",
                country="Colombia",
                is_customer=True,
                is_supplier=False,
                comment="Operaciones de campo"
            ),
        ]
        db.add_all(partners)
        db.commit()

    # 3. Productos y Servicios en Pesos Colombianos (COP)
    if db.query(ProductProduct).count() == 0:
        products = [
            ProductProduct(
                name="Laptop Ultrabook Pro 15\"",
                default_code="LAP-ULTRA-15",
                type="product",
                list_price=4500000.0,
                standard_price=3200000.0,
                qty_available=15.0,
                uom_name="Unidades",
                description="Portátil empresarial Intel i7, 32GB RAM, 1TB SSD NVMe",
                image_url="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"
            ),
            ProductProduct(
                name="Monitor Curvo 27\" UltraHD",
                default_code="MON-27-UHD",
                type="product",
                list_price=1250000.0,
                standard_price=850000.0,
                qty_available=28.0,
                uom_name="Unidades",
                description="Panel IPS 144Hz, HDR400, conexiones HDMI 2.1 y DisplayPort",
                image_url="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400"
            ),
            ProductProduct(
                name="Teclado Mecánico Ergonómico",
                default_code="KB-MECH-ERG",
                type="product",
                list_price=350000.0,
                standard_price=180000.0,
                qty_available=45.0,
                uom_name="Unidades",
                description="Switches táctiles silenciosos, retroiluminación RGB",
                image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400"
            ),
            ProductProduct(
                name="Consultoría e Instalación IT (Hora)",
                default_code="SRV-CONSULT-IT",
                type="service",
                list_price=150000.0,
                standard_price=80000.0,
                qty_available=0.0,
                uom_name="Horas",
                description="Servicio técnico especializado por horas"
            ),
        ]
        db.add_all(products)
        db.commit()

    # 4. Crear una orden de venta de ejemplo ya cargada en COP
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
            amount_untaxed=5750000.0,
            amount_tax=1092500.0,
            amount_total=6842500.0,
            note="Presupuesto para renovación de equipo tecnológico corporativo. Precios en COP (IVA 19%)."
        )
        db.add(so)
        db.flush()

        sol1 = SaleOrderLine(
            order_id=so.id,
            product_id=prod_laptop.id,
            name=prod_laptop.name,
            product_uom_qty=1.0,
            price_unit=4500000.0,
            tax_percent=19.0,
            price_subtotal=4500000.0,
            price_total=5355000.0
        )
        sol2 = SaleOrderLine(
            order_id=so.id,
            product_id=prod_monitor.id,
            name=prod_monitor.name,
            product_uom_qty=1.0,
            price_unit=1250000.0,
            tax_percent=19.0,
            price_subtotal=1250000.0,
            price_total=1487500.0
        )
        db.add_all([sol1, sol2])
        db.commit()

    db.close()
    print("Seed data colombiana (COP) cargada con éxito!")

if __name__ == "__main__":
    run_seed()
