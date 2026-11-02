import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  Users,
  Truck,
  Building2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function Sidebar({
  activeApp,
  activeSubView,
  onSelectApp,
  collapsed,
  setCollapsed,
  currentUser,
  onOpenCityModal
}) {
  const menuGroups = [
    {
      title: 'PRINCIPAL',
      items: [
        {
          id: 'dashboard',
          subView: 'main',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: null
        }
      ]
    },
    {
      title: 'OPERACIONES & VENTAS',
      items: [
        {
          id: 'sales',
          subView: 'orders',
          label: 'Ventas & Cotizaciones',
          icon: ShoppingCart,
          badge: null
        },
        {
          id: 'inventory',
          subView: 'pickings',
          label: 'Albaranes & Despachos',
          icon: Truck,
          badge: null
        },
        {
          id: 'inventory',
          subView: 'products',
          label: 'Lubricantes & Filtros',
          icon: Boxes,
          badge: null
        }
      ]
    },
    {
      title: 'FINANZAS',
      items: [
        {
          id: 'invoicing',
          subView: 'invoices',
          label: 'Facturación & Cobros',
          icon: Receipt,
          badge: null
        }
      ]
    },
    {
      title: 'TERCEROS',
      items: [
        {
          id: 'contacts',
          subView: 'customers',
          label: 'Clientes',
          icon: Users,
          badge: null
        },
        {
          id: 'contacts',
          subView: 'suppliers',
          label: 'Proveedores',
          icon: Building2,
          badge: null
        },
        {
          id: 'contacts',
          subView: 'all',
          label: 'Directorio General',
          icon: FileText,
          badge: null
        }
      ]
    }
  ];

  const isItemActive = (appId, subView) => {
    if (appId !== activeApp) return false;
    if (appId === 'dashboard') return true;
    if (subView) return activeSubView === subView;
    return true;
  };

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800 select-none z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div
          onClick={() => onSelectApp('dashboard', 'main')}
          className="flex items-center space-x-3 cursor-pointer overflow-hidden group"
          title="Grupo Soluciones Colombia"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white tracking-tight leading-tight truncate">
                Grupo Soluciones
              </span>
              <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider truncate">
                Lubricantes & Filtros
              </span>
            </div>
          )}
        </div>

        {/* Toggle Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {group.title}
              </p>
            )}
            {group.items.map((item, iIdx) => {
              const active = isItemActive(item.id, item.subView);
              const Icon = item.icon;
              return (
                <button
                  key={iIdx}
                  onClick={() => onSelectApp(item.id, item.subView)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer group ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sede & System Info Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <button
          onClick={onOpenCityModal}
          className={`w-full p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 transition cursor-pointer text-left flex items-center ${
            collapsed ? 'justify-center' : 'space-x-2.5'
          }`}
          title="Cambiar Sede Activa (Bucaramanga / Barrancabermeja)"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sede Activa
              </span>
              <span className="block text-xs font-semibold text-slate-200 truncate">
                {currentUser?.city || 'Bucaramanga'}
              </span>
            </div>
          )}
        </button>

        {!collapsed && (
          <div className="mt-2.5 px-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Versión 2.5 • Cloud</span>
            <span className="flex items-center space-x-1 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Online</span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
