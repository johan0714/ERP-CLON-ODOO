import React from 'react';
import {
  ShoppingBag,
  Boxes,
  Receipt,
  Users,
  LayoutDashboard,
  X,
  Layers
} from 'lucide-react';

export default function AppLauncher({ isOpen, onClose, onSelectApp }) {
  if (!isOpen) return null;

  const apps = [
    {
      id: 'dashboard',
      name: 'Tablero',
      description: 'Métricas clave y accesos rápidos',
      icon: LayoutDashboard,
      color: 'bg-violet-600',
    },
    {
      id: 'sales',
      name: 'Ventas',
      description: 'Presupuestos, pedidos y clientes',
      icon: ShoppingBag,
      color: 'bg-indigo-600',
    },
    {
      id: 'inventory',
      name: 'Inventario',
      description: 'Stock, productos y remisiones',
      icon: Boxes,
      color: 'bg-amber-600',
    },
    {
      id: 'invoicing',
      name: 'Facturación',
      description: 'Facturas de cliente y pagos',
      icon: Receipt,
      color: 'bg-emerald-600',
    },
    {
      id: 'contacts',
      name: 'Contactos',
      description: 'Directorio de clientes y proveedores',
      icon: Users,
      color: 'bg-blue-600',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Aplicaciones ERP</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => {
                  onSelectApp(app.id);
                  onClose();
                }}
                className="group flex flex-col items-center p-4 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all text-center cursor-pointer hover:shadow-md"
              >
                <div
                  className={`w-14 h-14 ${app.color} text-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-1 transition-transform mb-3`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <span className="font-semibold text-slate-800 text-sm mb-1">{app.name}</span>
                <span className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                  {app.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
