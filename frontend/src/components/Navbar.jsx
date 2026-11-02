import React, { useState } from 'react';
import api from '../api/client';
import { LayoutGrid, Bell, Building2, MapPin, LogOut, ArrowLeft, Home, Edit3, X, Check } from 'lucide-react';

export default function Navbar({
  activeApp,
  setActiveApp,
  onOpenLauncher,
  activeSubView,
  setActiveSubView,
  currentUser,
  onUpdateUser,
  onLogout
}) {
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [newCity, setNewCity] = useState(currentUser?.city || 'Bucaramanga (Sede Principal)');
  const [savingCity, setSavingCity] = useState(false);

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

  const handleSaveCity = async (cityToSet) => {
    const finalCity = cityToSet || newCity;
    try {
      setSavingCity(true);
      const res = await api.put('/auth/me', { city: finalCity });
      if (onUpdateUser) {
        onUpdateUser(res.data);
      }
      setCityModalOpen(false);
    } catch (err) {
      // Si la API falla o está offline, actualizamos localmente en el frontend
      const updated = { ...currentUser, city: finalCity };
      if (onUpdateUser) {
        onUpdateUser(updated);
      }
      setCityModalOpen(false);
    } finally {
      setSavingCity(false);
    }
  };

  const quickCities = [
    'Bucaramanga (Sede Principal)',
    'El Centro, Barrancabermeja',
    'Barrancabermeja (Zona Industrial)',
    'Floridablanca',
    'Girón',
    'Piedecuesta',
  ];

  return (
    <>
      <header className="bg-[#714B67] text-white flex items-center justify-between px-3 h-12 shadow select-none">
        {/* Left: App Switcher, Back to Home & App Title */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenLauncher}
            title="Menú de Aplicaciones (Waffle)"
            className="p-1.5 rounded hover:bg-white/15 transition-colors flex items-center justify-center text-white cursor-pointer"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {/* Botón Destacado para Regresar a la Pantalla Principal */}
          {activeApp !== 'dashboard' ? (
            <button
              onClick={() => setActiveApp('dashboard')}
              title="Volver a la pantalla principal"
              className="flex items-center space-x-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 shadow-md border border-amber-300"
            >
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
              <span>← INICIO</span>
            </button>
          ) : (
            <button
              onClick={onOpenLauncher}
              className="flex items-center space-x-1 text-xs text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 cursor-pointer"
            >
              <Home className="w-4 h-4 text-amber-300" />
              <span className="font-semibold hidden sm:inline">Inicio</span>
            </button>
          )}

          <button
            onClick={() => setActiveApp('dashboard')}
            title="Ir al inicio"
            className="font-semibold text-base sm:text-lg tracking-tight pr-3 border-r border-white/20 hover:text-amber-200 cursor-pointer transition text-left"
          >
            {appNames[activeApp] || 'ERP'}
          </button>

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

        {/* Right: City Sede, User Card & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Ubicación / Sede (Click para cambiar) */}
          <button
            onClick={() => {
              setNewCity(currentUser?.city || 'Bucaramanga (Sede Principal)');
              setCityModalOpen(true);
            }}
            title="Haz clic para cambiar tu ubicación / sede"
            className="flex items-center space-x-1 bg-black/25 hover:bg-black/40 px-2.5 py-1 rounded-full text-xs text-amber-200 transition-colors border border-amber-300/30 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-semibold">{currentUser?.city || 'Bucaramanga'}</span>
            <Edit3 className="w-3 h-3 text-white/60 ml-1" />
          </button>

          {/* User Card */}
          <div className="flex items-center space-x-2 border-l border-white/20 pl-2 sm:pl-3">
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
                className="ml-1 text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modal para Cambiar Ubicación / Sede */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div className="flex items-center space-x-2 text-[#714B67]">
                <MapPin className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Configurar Sede / Ubicación</h3>
              </div>
              <button
                onClick={() => setCityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Selecciona tu sede actual para que las órdenes, albaranes y facturas registren tu punto de operación:
            </p>

            {/* Opciones Rápidas Santander */}
            <div className="space-y-2 mb-4">
              {quickCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSaveCity(c)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition border flex items-center justify-between cursor-pointer ${
                    currentUser?.city === c
                      ? 'bg-purple-50 border-[#714B67] text-[#714B67]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{c}</span>
                  {currentUser?.city === c && <Check className="w-4 h-4 text-[#714B67]" />}
                </button>
              ))}
            </div>

            {/* O escribir ubicación personalizada */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 mb-1">
                O escribe otra ubicación personalizada:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ej. Bucaramanga (Centro), El Centro (Campo 22)..."
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#714B67]"
                />
                <button
                  type="button"
                  disabled={savingCity}
                  onClick={() => handleSaveCity()}
                  className="bg-[#714B67] hover:bg-[#593950] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {savingCity ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
