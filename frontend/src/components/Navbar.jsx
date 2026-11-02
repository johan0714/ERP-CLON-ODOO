import React from 'react';
import { LayoutGrid, Bell, Building2, MapPin, LogOut, ArrowLeft, Home } from 'lucide-react';

export default function Navbar({
  activeApp,
  setActiveApp,
  onOpenLauncher,
  activeSubView,
  setActiveSubView,
  currentUser,
  onLogout
}) {
  const getSubMenus = () => {
    switch (activeApp) {
      case 'sales':
        return [
          { id: 'orders', label: 'Pedidos y Presupuestos' },
          { id: 'customers', label: 'Clientes' },
          { id: 'products', label: 'Productos' },
        ];
      case 'inventory':
        return [
          { id: 'pickings', label: 'Albaranes de Entrega' },
          { id: 'products', label: 'Stock de Productos' },
        ];
      case 'invoicing':
        return [
          { id: 'invoices', label: 'Facturas de Cliente' },
        ];
      case 'contacts':
        return [
          { id: 'all', label: 'Todos los Contactos' },
          { id: 'customers', label: 'Clientes' },
          { id: 'suppliers', label: 'Proveedores' },
        ];
      default:
        return [];
    }
  };

  const appNames = {
    dashboard: 'Tablero Principal',
    sales: 'Ventas',
    inventory: 'Inventario',
    invoicing: 'Facturación',
    contacts: 'Contactos',
  };

  const subMenus = getSubMenus();

  return (
    <header className="bg-[#714B67] text-white flex items-center justify-between px-3 h-12 shadow select-none">
      {/* Left: App Switcher, App Title & Back to Home */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenLauncher}
          title="Menú de Aplicaciones"
          className="p-1.5 rounded hover:bg-white/15 transition-colors flex items-center justify-center text-white cursor-pointer"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        {/* Botón para regresar al Tablero Principal desde cualquier módulo */}
        {activeApp !== 'dashboard' && (
          <button
            onClick={() => setActiveApp('dashboard')}
            title="Volver a la pantalla principal"
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all text-white cursor-pointer active:scale-95 shadow-2xs border border-white/25"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Inicio</span>
          </button>
        )}

        <span className="font-semibold text-lg tracking-tight pr-3 border-r border-white/20">
          {appNames[activeApp] || 'ERP'}
        </span>

        {/* Submenu links */}
        <nav className="hidden md:flex items-center space-x-1">
          {subMenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => setActiveSubView(menu.id)}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors cursor-pointer ${
                activeSubView === menu.id
                  ? 'bg-white/20 text-white shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {menu.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Company, Multi-City Sede, User & Logout */}
      <div className="flex items-center space-x-3">
        {/* City Sede Tag */}
        {currentUser?.city && (
          <div className="hidden lg:flex items-center space-x-1 bg-black/20 px-2.5 py-0.5 rounded-full text-xs text-amber-200">
            <MapPin className="w-3 h-3" />
            <span>{currentUser.city}</span>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center space-x-2 border-l border-white/20 pl-3">
          <div
            className={`w-7 h-7 rounded-full ${
              currentUser?.avatar_color || 'bg-indigo-600'
            } text-white font-bold flex items-center justify-center text-xs shadow-xs`}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold leading-tight text-white">
              {currentUser?.name || 'Usuario'}
            </span>
            <span className="text-[10px] text-white/70 flex items-center space-x-1 uppercase tracking-wider font-bold">
              {currentUser?.role === 'admin' ? 'Administrador' : 'Empleado'}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="ml-2 text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
