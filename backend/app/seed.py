from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.auth import hash_password
from backend.app.models.models import (
    IrSequence, ResPartner, ProductProduct, SaleOrder, SaleOrderLine, StockPicking, StockMove, ResUser
)

def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 0. Usuarios Santander (Bucaramanga y El Centro, Barrancabermeja)
    all_users = db.query(ResUser).all()
    for u in all_users:
        if u.role == "admin" or u.email == "admin@empresa.com" or "pedro" in u.name.lower() or "albarracin" in u.name.lower() or "jeisson" in u.name.lower():
            u.name = "Pedro Ramón Albarracín"
            u.email = "admin@empresa.com"
            u.role = "admin"
            u.city = "Bucaramanga (Sede Principal)"
            u.avatar_color = "bg-blue-700"
        elif u.role == "employee" or u.email == "empleado@empresa.com":
            u.name = "Santiago Galvis"
            u.email = "empleado@empresa.com"
            u.role = "employee"
            u.city = "El Centro, Barrancabermeja"
            u.avatar_color = "bg-emerald-600"
    db.commit()

    admin_u = db.query(ResUser).filter(ResUser.email == "admin@empresa.com").first()
    if not admin_u:
        admin_u = ResUser(
            name="Pedro Ramón Albarracín",
            email="admin@empresa.com",
            hashed_password=hash_password("admin123"),
            role="admin",
            city="Bucaramanga (Sede Principal)",
            avatar_color="bg-blue-700"
        )
        db.add(admin_u)

    emp_u = db.query(ResUser).filter(ResUser.email == "empleado@empresa.com").first()
    if not emp_u:
        emp_u = ResUser(
            name="Santiago Galvis",
            email="empleado@empresa.com",
            hashed_password=hash_password("empleado123"),
            role="employee",
            city="El Centro, Barrancabermeja",
            avatar_color="bg-emerald-600"
        )
        db.add(emp_u)
    db.commit()

    # 1. Configurar Secuencias
    sequences = [
        {"code": "sale.order", "name": "Ventas", "prefix": "SO-", "padding": 4, "next_number": 1001},
        {"code": "stock.picking.out", "name": "Remisiones de Entrega", "prefix": "REM/OUT/", "padding": 4, "next_number": 101},
        {"code": "stock.picking.in", "name": "Remisiones de Entrada", "prefix": "REM/IN/", "padding": 4, "next_number": 101},
        {"code": "account.move.out", "name": "Facturas Cliente", "prefix": "INV-2026-", "padding": 4, "next_number": 501},
        {"code": "account.payment", "name": "Pagos", "prefix": "PAY-", "padding": 4, "next_number": 201},
    ]

    for s_data in sequences:
        existing = db.query(IrSequence).filter(IrSequence.code == s_data["code"]).first()
        if not existing:
            db.add(IrSequence(**s_data))
    db.commit()

    # 2. Clientes y Proveedores del Sector Lubricantes, Transporte y Petróleo
    lub_partners = [
        {
            "name": "Transportes & Volquetas Santander S.A.S.",
            "is_company": True,
            "email": "mantenimiento@transportessantander.co",
            "phone": "+57 607 645 8890",
            "vat": "900.567.890-1",
            "street": "Carrera 15 # 22-45, Vía Palenque",
            "city": "Bucaramanga (Sede Principal)",
            "country": "Colombia",
            "is_customer": True,
            "is_supplier": False,
            "comment": "Flota de 35 mulas y volquetas de carga pesada. Consumo mensual de 15W-40 y filtros."
        },
        {
            "name": "Consorcio Petrolero & Maquinaria El Centro",
            "is_company": True,
            "email": "compras@consorcioelcentro.com",
            "phone": "+57 607 622 3400",
            "vat": "901.345.678-4",
            "street": "Vía Principal Corregimiento El Centro Km 12",
            "city": "El Centro, Barrancabermeja",
            "country": "Colombia",
            "is_customer": True,
            "is_supplier": False,
            "comment": "Equipos de perforación, generadores y retroexcavadoras. Requiere ISO 68 y 15W-40."
        },
        {
            "name": "Distribuidora Mayorista de Lubricantes & Grasas del Oriente",
            "is_company": True,
            "email": "ventas@distrilubricantes.com.co",
            "phone": "+57 607 671 2200",
            "vat": "890.987.654-3",
            "street": "Zona Industrial Chimitá Bodega 14",
            "city": "Bucaramanga (Sede Principal)",
            "country": "Colombia",
            "is_customer": False,
            "is_supplier": True,
            "comment": "Proveedor principal de tambores, baldes y cajas de aceite mineral y sintético."
        },
        {
            "name": "Importadora Nacional de Filtración Industrial S.A.S.",
            "is_company": True,
            "email": "pedidos@filtrosnacionales.com",
            "phone": "+57 607 633 4567",
            "vat": "860.112.233-9",
            "street": "Autopista Bucaramanga - Girón Km 4",
            "city": "Bucaramanga (Sede Principal)",
            "country": "Colombia",
            "is_customer": False,
            "is_supplier": True,
            "comment": "Distribuidor mayorista de filtros de aceite, aire, trampa de agua y combustible Donaldson y Fleetguard."
        }
    ]

    for p_info in lub_partners:
        p_exist = db.query(ResPartner).filter(ResPartner.vat == p_info["vat"]).first()
        if not p_exist:
            db.add(ResPartner(**p_info))
    db.commit()

    # 3. Catálogo Especializado de Lubricantes y Filtros (Pesos Colombianos - COP)
    lub_products = [
        {
            "default_code": "LUB-15W40-TAMB",
            "name": "Aceite Motor 15W-40 CI-4/SL (Tambor 55 Galones)",
            "type": "product",
            "list_price": 3850000.0,
            "standard_price": 2850000.0,
            "qty_available": 18.0,
            "uom_name": "Tambor (55 Gal)",
            "description": "Lubricante multigrado mineral de alto rendimiento para motores diésel de carga pesada y flotas.",
        },
        {
            "default_code": "LUB-15W40-BALD",
            "name": "Aceite Motor 15W-40 CI-4/SL (Balde 5 Galones)",
            "type": "product",
            "list_price": 360000.0,
            "standard_price": 265000.0,
            "qty_available": 45.0,
            "uom_name": "Balde (5 Gal)",
            "description": "Presentación estándar para cambio de aceite en camiones, volquetas y maquinaria pesada.",
        },
        {
            "default_code": "LUB-HIDR-ISO68",
            "name": "Aceite Hidráulico ISO 68 Antidesgaste (Tambor 55 Galones)",
            "type": "product",
            "list_price": 3250000.0,
            "standard_price": 2400000.0,
            "qty_available": 12.0,
            "uom_name": "Tambor (55 Gal)",
            "description": "Fluido hidráulico de alta estabilidad térmica para retroexcavadoras, grúas y sistemas industriales en El Centro.",
        },
        {
            "default_code": "LUB-TRANS-85W140",
            "name": "Aceite de Transmisión & Diferencial 85W-140 GL-5 (Balde 5 Gal)",
            "type": "product",
            "list_price": 395000.0,
            "standard_price": 290000.0,
            "qty_available": 24.0,
            "uom_name": "Balde (5 Gal)",
            "description": "Aceite para engranajes hipoidales sometidos a cargas de impacto y extrema presión.",
        },
        {
            "default_code": "FLT-OIL-P552100",
            "name": "Filtro de Aceite Lubricante Heavy Duty P552100",
            "type": "product",
            "list_price": 95000.0,
            "standard_price": 62000.0,
            "qty_available": 60.0,
            "uom_name": "Unidades",
            "description": "Filtro blindado tipo spin-on para motores Cummins ISX, Caterpillar C15 y Detroit Diésel.",
        },
        {
            "default_code": "FLT-SEP-FS19732",
            "name": "Filtro Separador Combustible y Trampa de Agua FS19732",
            "type": "product",
            "list_price": 125000.0,
            "standard_price": 84000.0,
            "qty_available": 35.0,
            "uom_name": "Unidades",
            "description": "Elemento filtrante de combustible con vaso colector de agua y drenaje manual para ACPM colombiano.",
        },
        {
            "default_code": "FLT-AIR-P777868",
            "name": "Filtro de Aire Primario Radial Seal P777868",
            "type": "product",
            "list_price": 198000.0,
            "standard_price": 138000.0,
            "qty_available": 4.0, # Stock bajo para activar alertas visuales
            "uom_name": "Unidades",
            "description": "Cartucho de aire para trabajo pesado en ambientes con alta concentración de polvo y trocha.",
        },
        {
            "default_code": "GRS-EP2-LITIO",
            "name": "Grasa Azul Extrema Presión EP-2 Complejo de Litio (Balde 35 lb)",
            "type": "product",
            "list_price": 420000.0,
            "standard_price": 305000.0,
            "qty_available": 0.0, # Agotado para activar alerta roja
            "uom_name": "Balde (35 lb)",
            "description": "Grasa con polímeros adhesivos de máxima resistencia al lavado por agua para chasis y quinta rueda.",
        },
        {
            "default_code": "LUB-15W40-GARR",
            "name": "Aceite Motor 15W-40 CI-4/SL (Garrafa 1 Galón)",
            "type": "product",
            "list_price": 78000.0,
            "standard_price": 54000.0,
            "qty_available": 50.0,
            "uom_name": "Garrafa (1 Gal)",
            "description": "Garrafa individual de galón para reposición y vehículos livianos diésel.",
        },
        {
            "default_code": "LUB-5W30-CAJA12",
            "name": "Aceite 100% Sintético 5W-30 Dexos1 (Caja x 12 Cuartos)",
            "type": "product",
            "list_price": 420000.0,
            "standard_price": 295000.0,
            "qty_available": 16.0,
            "uom_name": "Caja (12 Cuartos)",
            "description": "Caja máster de 12 botellas de 946 ml para camionetas y flotas modernas a gasolina/diésel ligero.",
        },
        {
            "default_code": "FLT-PH8A-CAJA24",
            "name": "Filtro de Aceite Universal Spin-On (Caja x 24 Unidades)",
            "type": "product",
            "list_price": 520000.0,
            "standard_price": 360000.0,
            "qty_available": 8.0,
            "uom_name": "Caja (24 Und)",
            "description": "Empaque mayorista de filtros para distribución rápida a talleres y servitecas.",
        },
        {
            "default_code": "SRV-LUB-FLOTA",
            "name": "Servicio de Mantenimiento Preventivo & Engrase de Flota",
            "type": "service",
            "list_price": 180000.0,
            "standard_price": 75000.0,
            "qty_available": 0.0,
            "uom_name": "Servicio",
            "description": "Mano de obra técnica especializada en lubricación, cambio de filtros y revisión de fluidos en taller o campo.",
        }
    ]

    # Actualizar o agregar productos del sector Lubricantes y Filtros
    # También actualizar productos genéricos previos (Laptop, Monitor, etc.) si existen
    for p_data in lub_products:
        prod = db.query(ProductProduct).filter(ProductProduct.default_code == p_data["default_code"]).first()
        if not prod:
            db.add(ProductProduct(**p_data))
        else:
            prod.name = p_data["name"]
            prod.list_price = p_data["list_price"]
            prod.standard_price = p_data["standard_price"]
            prod.uom_name = p_data["uom_name"]
            prod.description = p_data["description"]

    # Reemplazar los productos informáticos iniciales para unificar el catálogo a Lubricantes y Filtros
    old_laptop = db.query(ProductProduct).filter(ProductProduct.default_code == "LAP-ULTRA-15").first()
    if old_laptop:
        old_laptop.default_code = "LUB-15W40-TAMB"
        old_laptop.name = "Aceite Motor 15W-40 CI-4/SL (Tambor 55 Galones)"
        old_laptop.list_price = 3850000.0
        old_laptop.standard_price = 2850000.0
        old_laptop.uom_name = "Tambor (55 Gal)"
        old_laptop.description = "Lubricante multigrado mineral de alto rendimiento para flotas pesadas."

    old_monitor = db.query(ProductProduct).filter(ProductProduct.default_code == "MON-27-UHD").first()
    if old_monitor:
        old_monitor.default_code = "FLT-OIL-P552100"
        old_monitor.name = "Filtro de Aceite Lubricante Heavy Duty P552100"
        old_monitor.list_price = 95000.0
        old_monitor.standard_price = 62000.0
        old_monitor.uom_name = "Unidades"
        old_monitor.description = "Filtro blindado tipo spin-on para motores diésel de servicio pesado."

    old_kb = db.query(ProductProduct).filter(ProductProduct.default_code == "KB-MECH-ERG").first()
    if old_kb:
        old_kb.default_code = "FLT-SEP-FS19732"
        old_kb.name = "Filtro Separador Combustible y Trampa de Agua FS19732"
        old_kb.list_price = 125000.0
        old_kb.standard_price = 84000.0
        old_kb.uom_name = "Unidades"
        old_kb.description = "Elemento separador de agua/combustible para maquinaria y camiones."

    old_srv = db.query(ProductProduct).filter(ProductProduct.default_code == "SRV-CONSULT-IT").first()
    if old_srv:
        old_srv.default_code = "SRV-LUB-FLOTA"
        old_srv.name = "Servicio de Mantenimiento Preventivo & Engrase de Flota"
        old_srv.list_price = 180000.0
        old_srv.standard_price = 75000.0
        old_srv.uom_name = "Servicio"
        old_srv.description = "Mano de obra técnica en cambio de aceites y filtros."

    db.commit()

    # Actualizar cualquier pedido de venta existente para que refleje lubricantes
    for so in db.query(SaleOrder).all():
        if "tecnológico" in (so.note or "") or "Laptop" in (so.note or "") or so.note == "Presupuesto para renovación de equipo tecnológico corporativo. Precios en COP (IVA 19%).":
            so.note = "Cotización de suministro de lubricantes y filtros para mantenimiento de flota. Entrega en Bucaramanga / El Centro, Barrancabermeja."

    for line in db.query(SaleOrderLine).all():
        if "Laptop" in line.name:
            line.name = "Aceite Motor 15W-40 CI-4/SL (Tambor 55 Galones)"
        elif "Monitor" in line.name:
            line.name = "Filtro de Aceite Lubricante Heavy Duty P552100"
        elif "Teclado" in line.name:
            line.name = "Filtro Separador Combustible y Trampa de Agua FS19732"

    # 7. Configuración DIAN / Factus
    from backend.app.models.models import DianConfig
    dian_conf = db.query(DianConfig).first()
    if not dian_conf:
        dian_conf = DianConfig(
            provider="factus",
            is_sandbox=True,
            company_nit="901.458.921-3",
            company_name="Grupo Soluciones Colombia S.A.S."
        )
        db.add(dian_conf)

    db.commit()
    db.close()
    print("Seed data colombiana especializada en Lubricantes y Filtros cargada con éxito!")

if __name__ == "__main__":
    run_seed()
