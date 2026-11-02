import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { formatCOP } from '../../utils/format';
import {
  TrendingUp,
  Package,
  Receipt,
  Users,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  PlusCircle
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/dashboard/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Ventas Totales',
      value: formatCOP(metrics.total_sales),
      subtitle: `${metrics.confirmed_orders_count} pedidos confirmados`,
      icon: TrendingUp,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      badgeColor: 'bg-indigo-600',
      app: 'sales',
    },
    {
      title: 'Facturación Pendiente',
      value: formatCOP(metrics.unpaid_invoices_amount),
      subtitle: `${metrics.unpaid_invoices_count} facturas por cobrar`,
      icon: Receipt,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      badgeColor: 'bg-emerald-600',
      app: 'invoicing',
    },
    {
      title: 'Entregas Pendientes',
      value: metrics.pending_deliveries,
      subtitle: 'Albaranes por transferir en almacén',
      icon: Truck,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      badgeColor: 'bg-amber-600',
      app: 'inventory',
    },
    {
      title: 'Catálogo & Contactos',
      value: `${metrics.total_products} Prod. / ${metrics.total_customers} Cli.`,
      subtitle: 'Productos y clientes registrados',
      icon: Package,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      badgeColor: 'bg-blue-600',
      app: 'contacts',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#714B67] to-[#4a3144] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-amber-300">
            ERP Modular v1.0
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">
            Centro de Gestión Empresarial
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-xl">
            Control integral de Ventas, Almacén & Logística, Facturación y Directorio de Clientes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onNewOrder}
            className="flex items-center space-x-1.5 bg-white text-[#714B67] hover:bg-slate-100 font-semibold px-4 py-2 rounded-xl text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-[#714B67]" />
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigateApp(c.app)}
              className={`p-5 rounded-2xl border ${c.color} shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {c.title}
                </span>
                <div className={`p-2.5 rounded-xl ${c.badgeColor} text-white shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{c.value}</h3>
                <p className="text-xs text-slate-600 mt-1">{c.subtitle}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Acceder al módulo</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Launchpad & Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-base text-slate-800">Flujo Comercial</h3>
          </div>
          <p className="text-xs text-slate-500">
            Crea presupuestos para clientes. Al confirmar el pedido, el sistema genera automáticamente el albarán en Almacén y deja lista la factura.
          </p>
          <button
            onClick={() => onNavigateApp('sales')}
            className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
          >
            Ver Pedidos de Venta &rarr;
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-700 font-bold">
            <Truck className="w-5 h-5" />
            <h3 className="text-base text-slate-800">Almacén y Entregas</h3>
          </div>
          <p className="text-xs text-slate-500">
            Revisa los albaranes de salida pendientes. Al pulsar 'Validar Albarán', se descuenta el stock real y se actualiza el estado del pedido.
          </p>
          <button
            onClick={() => onNavigateApp('inventory')}
            className="w-full text-center text-xs font-semibold text-amber-600 hover:text-amber-800 py-2 border border-amber-200 rounded-lg hover:bg-amber-50 transition cursor-pointer"
          >
            Ver Albaranes de Stock &rarr;
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold">
            <Receipt className="w-5 h-5" />
            <h3 className="text-base text-slate-800">Facturación & Pagos</h3>
          </div>
          <p className="text-xs text-slate-500">
            Genera facturas desde pedidos confirmados, publícalas y registra los pagos con cálculo automático del saldo pendiente.
          </p>
          <button
            onClick={() => onNavigateApp('invoicing')}
            className="w-full text-center text-xs font-semibold text-emerald-600 hover:text-emerald-800 py-2 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
          >
            Ver Facturas de Clientes &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
