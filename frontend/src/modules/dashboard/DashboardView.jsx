import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatCOP } from '../../utils/format';
import Badge from '../../components/Badge';
import {
  TrendingUp,
  Package,
  Receipt,
  Users,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  Boxes,
  DollarSign,
  Building2,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';

export default function DashboardView({ onNavigateApp, onNewOrder, onNewContact, onNewProduct }) {
  const [metrics, setMetrics] = useState({
    total_sales: 0,
    pending_orders_count: 0,
    confirmed_orders_count: 0,
    total_products: 0,
    total_customers: 0,
    pending_deliveries: 0,
    unpaid_invoices_amount: 0,
    unpaid_invoices_count: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [stockAlerts, setStockAlerts] = useState({ low: [], out: [], totalValue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, ordersRes, productsRes] = await Promise.allSettled([
        api.get('/dashboard/metrics'),
        api.get('/sales/'),
        api.get('/inventory/products')
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data);
      }

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data)) {
        setRecentOrders(ordersRes.value.data.slice(0, 5));
      }

      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value.data)) {
        const prods = productsRes.value.data;
        const low = prods.filter(p => p.qty_available > 0 && p.qty_available <= 5);
        const out = prods.filter(p => p.qty_available <= 0);
        const totalVal = prods.reduce((sum, p) => sum + (p.qty_available * (p.standard_price || p.list_price * 0.7)), 0);
        setStockAlerts({ low, out, totalValue: totalVal });
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    {
      title: 'Ventas Totales',
      value: formatCOP(metrics.total_sales),
      subtext: `${metrics.confirmed_orders_count} pedidos confirmados`,
      icon: TrendingUp,
      iconBg: 'bg-blue-600 text-white',
      cardBg: 'bg-white',
      border: 'border-slate-200',
      app: 'sales',
      subView: 'orders'
    },
    {
      title: 'Facturación por Cobrar',
      value: formatCOP(metrics.unpaid_invoices_amount),
      subtext: `${metrics.unpaid_invoices_count} facturas pendientes`,
      icon: Receipt,
      iconBg: 'bg-indigo-600 text-white',
      cardBg: 'bg-white',
      border: 'border-slate-200',
      app: 'invoicing',
      subView: 'invoices'
    },
    {
      title: 'Remisiones por Entregar',
      value: metrics.pending_deliveries,
      subtext: metrics.pending_deliveries > 0 ? 'Remisiones en espera de despacho' : 'Todo despachado al día',
      icon: Truck,
      iconBg: metrics.pending_deliveries > 0 ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white',
      cardBg: 'bg-white',
      border: 'border-slate-200',
      app: 'inventory',
      subView: 'pickings'
    },
    {
      title: 'Valor de Inventario',
      value: formatCOP(stockAlerts.totalValue),
      subtext: `${metrics.total_products} productos en catálogo`,
      icon: Boxes,
      iconBg: 'bg-emerald-600 text-white',
      cardBg: 'bg-white',
      border: 'border-slate-200',
      app: 'inventory',
      subView: 'products'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Enterprise Executive Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-700/60 border border-blue-400/30 text-[11px] font-semibold text-blue-200 mb-2">
            <span>Grupo Soluciones Colombia</span>
            <span>•</span>
            <span>Distribución de Lubricantes & Filtros</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Control de Lubricantes, Filtros & Operaciones ERP
          </h1>
          <p className="text-blue-100/80 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
            Gestión integral de tambores, baldes, filtros de aceite, aire y combustible, ventas a flotas de transporte, despachos en El Centro (Barrancabermeja) y facturación en Bucaramanga.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onNewOrder}
            className="flex items-center space-x-1.5 bg-white text-blue-900 hover:bg-blue-50 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-slate-900/10 transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-blue-700" />
            <span>+ Cotizar Lubricantes</span>
          </button>
          <button
            onClick={onNewProduct}
            className="flex items-center space-x-1.5 bg-blue-800/80 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs border border-blue-400/30 transition-all cursor-pointer active:scale-95"
          >
            <Package className="w-4 h-4 text-blue-300" />
            <span>+ Nuevo Filtro / Aceite</span>
          </button>
        </div>
      </div>

      {/* 4 Main Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateApp(kpi.app, kpi.subView)}
              className={`${kpi.cardBg} border ${kpi.border} p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {kpi.title}
                </span>
                <div className={`p-2.5 rounded-xl ${kpi.iconBg} shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{kpi.value}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{kpi.subtext}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                <span>Ver detalles</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Alerts & Quick Status Bar */}
      {(stockAlerts.out.length > 0 || stockAlerts.low.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Alertas de Almacén e Inventario
              </h2>
            </div>
            <button
              onClick={() => onNavigateApp('inventory', 'products')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Gestionar Stock &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Out of Stock */}
            {stockAlerts.out.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-800 block">
                    {stockAlerts.out.length} Producto(s) Agotado(s)
                  </span>
                  <span className="text-[11px] text-rose-600">
                    {stockAlerts.out.map(p => p.name).slice(0, 2).join(', ')}
                    {stockAlerts.out.length > 2 && '...'}
                  </span>
                </div>
                <Badge variant="danger" size="xs">Stock 0</Badge>
              </div>
            )}

            {/* Low Stock */}
            {stockAlerts.low.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-800 block">
                    {stockAlerts.low.length} Producto(s) con Stock Bajo
                  </span>
                  <span className="text-[11px] text-amber-600">
                    Menor a 5 unidades disponibles en almacén
                  </span>
                </div>
                <Badge variant="warning" size="xs">&le; 5 un.</Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid: Recent Orders & Workflow Process */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Ventas & Pedidos Recientes</h2>
                <p className="text-[11px] text-slate-500">Últimos pedidos procesados en el sistema</p>
              </div>
              <button
                onClick={() => onNavigateApp('sales', 'orders')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                    <th className="pb-2">Referencia</th>
                    <th className="pb-2">Cliente</th>
                    <th className="pb-2 text-right">Total (COP)</th>
                    <th className="pb-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No hay pedidos recientes registrados.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => onNavigateApp('sales', 'orders')}
                        className="hover:bg-slate-50 transition cursor-pointer"
                      >
                        <td className="py-2.5 font-bold text-blue-700">{o.name}</td>
                        <td className="py-2.5 text-slate-700 font-medium truncate max-w-[150px]">
                          {o.partner_name || 'Consumidor Final'}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900">
                          {formatCOP(o.amount_total)}
                        </td>
                        <td className="py-2.5 text-center">
                          {o.state === 'sale' ? (
                            <Badge variant="success" size="xs">Confirmado</Badge>
                          ) : (
                            <Badge variant="neutral" size="xs">Borrador</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Operational Workflow Guide (1 column) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Flujos de Operación ERP</span>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => onNavigateApp('sales', 'orders')}
              className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>1. Ventas & Pedidos</span>
                <span className="text-[10px] text-blue-600 font-bold group-hover:underline">Ir &rarr;</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cotice aceites 15W-40, hidráulicos ISO 68 y filtros por unidad para flotas y maquinaria pesada.
              </p>
            </div>

            <div
              onClick={() => onNavigateApp('inventory', 'pickings')}
              className="p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>2. Logística & Almacén</span>
                <span className="text-[10px] text-amber-600 font-bold group-hover:underline">Ir &rarr;</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Revise remisiones de salida en Barrancabermeja y valide entregas para descontar tambores y filtros del stock.
              </p>
            </div>

            <div
              onClick={() => onNavigateApp('invoicing', 'invoices')}
              className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>3. Facturación & Cobros</span>
                <span className="text-[10px] text-emerald-600 font-bold group-hover:underline">Ir &rarr;</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Emita facturas comerciales e ingrese cobros a empresas de transporte y contratistas del sector.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
