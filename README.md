# ERP Modular (Clon de Odoo) 🚀

Sistema de Gestión Empresarial (ERP) modular inspirado en la experiencia de usuario y arquitectura de **Odoo**, desarrollado con un backend moderno en **Python (FastAPI + SQLAlchemy)** y un frontend reactivo en **React (Vite + Tailwind CSS + Lucide Icons)**.

---

## 🌟 Módulos Implementados

1. **Tablero / Dashboard (KPIs en tiempo real)**
   - Ventas totales acumuladas.
   - Facturas pendientes de cobro y saldo residual.
   - Albaranes de entrega pendientes en almacén.
   - Accesos directos y lanzador rápido de documentos.

2. **Ventas y Presupuestos (Sales & Quotations)**
   - Máquina de estados: `Presupuesto (Borrador)` &rarr; `Pedido de Venta (Confirmado)`.
   - Selector interactivo de clientes y líneas de pedido dinámicas con cálculo de base imponible, IVA (21%) y total.
   - **Trazabilidad Cruzada (Smart Buttons)**:
     - Al pulsar **Confirmar Pedido**, se genera automáticamente el **Albarán de Salida** en Almacén.
     - Botón inteligente **[ X Entregas ]** para saltar directamente al albarán.
     - Botón **Crear Factura** habilitado al confirmar, con botón inteligente **[ X Facturas ]**.

3. **Inventario y Almacén (Warehouse & Stock)**
   - Catálogo de productos almacenables y servicios con control de SKU, código de barras, precio de venta y coste.
   - Indicadores visuales de nivel de stock (Verde / Ámbar / Rojo).
   - Gestión de **Albaranes de Salida (Stock Pickings)** con botón **"Validar Entrega"**:
     - Al validar la entrega, se descuentan físicamente las unidades del inventario del producto y se marca la orden de venta como entregada.

4. **Facturación y Pagos (Invoicing & Accounting)**
   - Facturas de cliente generadas automáticamente desde pedidos de venta o manuales.
   - Máquina de estados: `Borrador` &rarr; `Publicada` &rarr; `Pagada`.
   - Control de saldo residual (`amount_residual`).
   - Modal de **Registro de Pagos** (Transferencia, Tarjeta, Efectivo) con soporte para cobros parciales y totales.

5. **Directorio de Contactos (Partners / CRM)**
   - Clientes, proveedores y empresas/particulares.
   - Vista Kanban con tarjetas y Vista Lista/Tabla.
   - Modal para crear y editar contactos con NIF/CIF, teléfono, correo y dirección fiscal.

---

## 🏗️ Arquitectura Técnica

```text
ERP-ODOO/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── database.py        # Motor SQLAlchemy y sesiones
│   │   ├── models/
│   │   │   └── models.py          # Modelos relacionales estilo Odoo (res.partner, sale.order, stock.picking, account.move)
│   │   ├── schemas/
│   │   │   └── schemas.py         # Validación con Pydantic v2
│   │   ├── modules/
│   │   │   ├── contacts/router.py # API de contactos
│   │   │   ├── inventory/router.py# API de productos y stock pickings
│   │   │   ├── sales/router.py    # API de ventas y presupuestos
│   │   │   ├── invoicing/router.py# API de facturas y pagos
│   │   │   └── dashboard/router.py# API de métricas agregadas
│   │   ├── main.py                # FastAPI entrypoint y CORS
│   │   └── seed.py                # Población de datos demo y secuencias
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # Cliente Axios centralizado
│   │   ├── components/            # Navbar estilo Odoo, Waffle AppLauncher, ControlPanel
│   │   ├── modules/               # Vistas de Ventas, Inventario, Facturas y Contactos
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── run_dev.bat                    # Lanzador rápido para Windows
├── run_dev.ps1                    # Lanzador PowerShell
└── erp_odoo.db                    # Base de datos SQLite inicializada
```

---

## 🚀 Cómo Iniciar el Proyecto

### Opción 1: Ejecución Rápida con 1 Clic
Simplemente haz doble clic sobre el archivo:
- **`run_dev.bat`** (o ejecuta `.\run_dev.ps1` en PowerShell).

Esto abrirá automáticamente:
1. El backend FastAPI en `http://localhost:8000` (con documentación Swagger en `http://localhost:8000/docs`).
2. El frontend React en `http://localhost:5173`.

---

### Opción 2: Ejecución Manual en Terminales Separadas

#### 1. Backend (Terminal 1)
```powershell
# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# (Opcional si deseas recargar datos de prueba)
python -m backend.app.seed

# Iniciar servidor Uvicorn
python -m uvicorn backend.app.main:app --reload --port 8000
```

#### 2. Frontend (Terminal 2)
```powershell
cd frontend
npm run dev
```

Abre tu navegador en: **`http://localhost:5173`**

---

## 🔄 Flujo Completo Demostrativo de Odoo

1. Entra a **Ventas** &rarr; Pulsa **"Nuevo Pedido"**.
2. Selecciona un cliente, añade una línea con un producto (ej. *Laptop Ultrabook Pro* o *Monitor Curvo*).
3. Pulsa **"Guardar Presupuesto"**.
4. Pulsa **"Confirmar Pedido"**:
   - El presupuesto pasa a estado **Pedido de Venta**.
   - Aparece en la cabecera el Smart Button **[ 1 Albarán(es) ]** y se habilita el botón **"Crear Factura"**.
5. Haz clic en el botón de entrega o dirígete a **Inventario &rarr; Albaranes de Entrega**:
   - Observa el albarán generado.
   - Pulsa **"Validar Entrega"** para descontar el stock del producto automáticamente.
6. Vuelve al pedido y pulsa **"Crear Factura"**:
   - Se creará la factura en borrador vinculada.
7. Dirígete a **Facturación**:
   - Pulsa **"Publicar Factura"**.
   - Pulsa **"Registrar Pago"** (puedes pagar el total o un importe parcial).
   - ¡Verás cómo el saldo pendiente se calcula al instante y se estampa el sello de **PAGADA**!
"# ERP-CLON-ODOO" 
