import React, { useState } from 'react';
import api from '../api/client';
import {
  Menu,
  Home,
  ArrowLeft,
  Search,
  Bell,
  MapPin,
  ChevronDown,
  LogOut,
  Building2,
  Check,
  X,
  Shield,
  UserCheck
} from 'lucide-react';

export default function Header({
  activeApp,
  activeSubView,
  onNavigateHome,
  onToggleSidebar,
  currentUser,
  onUpdateUser,
  onLogout
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [savingCity, setSavingCity] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const appNames = {
    dashboard: 'Tablero Principal',
    sales: 'Ventas & Cotizaciones',
    inventory: 'Almacén & Inventario',
    invoicing: 'Facturación & Cobros',
    contacts: 'Directorio de Contactos'
  };

  const subViewNames = {
    main: 'Resumen Ejecutivo',
    orders: 'Pedidos de Venta',
    pickings: 'Albaranes de Despacho',
    products: 'Catálogo de Lubricantes & Filtros',
    invoices: 'Facturas de Cliente',
    customers: 'Clientes',
    suppliers: 'Proveedores',
    all: 'Todos los Contactos'
  };

  const handleSaveCity = async (selectedCity) => {
    try {
      setSavingCity(true);
      const res = await api.put('/auth/me/city', { city: selectedCity });
      if (res.data && res.data.user) {
        onUpdateUser(res.data.user);
      } else {
        onUpdateUser({ ...currentUser, city: selectedCity });
      }
      setCityModalOpen(false);
    } catch (err) {
      console.error('Error updating city', err);
      // Fallback local update
      onUpdateUser({ ...currentUser, city: selectedCity });
      setCityModalOpen(false);
    } finally {
      setSavingCity(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between select-none z-20 shrink-0">
        {/* Left: Hamburger & Navigation Breadcrumbs */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer md:hidden"
            title="Abrir Menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Persistent Return to Home Button */}
          {activeApp !== 'dashboard' && (
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="Volver al Tablero Principal"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </button>
          )}

          {/* Breadcrumb Path */}
          <div className="hidden lg:flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-400">Grupo Soluciones</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-800">{appNames[activeApp] || 'ERP'}</span>
            {activeSubView && activeApp !== 'dashboard' && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 font-medium">{subViewNames[activeSubView] || activeSubView}</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Global Quick Search Input */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar aceites, filtros, pedidos, clientes o facturas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden xl:flex items-center space-x-0.5 text-[10px] text-slate-400 font-mono bg-slate-200/60 px-1.5 py-0.5 rounded">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right: Sede selector, Colombia currency badge, Notifications & User profile */}
        <div className="flex items-center space-x-2.5">
          {/* Active Sede Pill */}
          <button
            onClick={() => setCityModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 transition cursor-pointer text-left"
            title="Haga clic para cambiar de sede (Bucaramanga o Barrancabermeja)"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-slate-700 block truncate max-w-[70px] xs:max-w-[110px] sm:max-w-[160px]">
                {currentUser?.city || 'Bucaramanga'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Currency indicator */}
          <div className="hidden sm:flex items-center px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
            COP ($) • IVA 19%
          </div>

          {/* Notifications Bell */}
          <button
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative cursor-pointer"
            title="Centro de Notificaciones"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <span className="font-bold text-slate-800 block truncate max-w-[120px]">
                  {currentUser?.name || 'Usuario'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium capitalize">
                  {currentUser?.role === 'admin' ? 'Administrador' : 'Empleado'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-bold text-slate-800 truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                  <div className="mt-1.5 flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {currentUser?.role === 'admin' ? 'Administrador' : 'Operaciones'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Activo
                    </span>
                  </div>
                </div>

                <div className="px-2 py-1.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setCityModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Cambiar Sede Activa</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigateHome();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-slate-500" />
                    <span>Ir al Tablero Principal</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1.5 px-2">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sede Selection Modal */}
      {cityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cambiar Sede de Operación</h3>
                  <p className="text-[11px] text-slate-500">Grupo Soluciones Colombia</p>
                </div>
              </div>
              <button
                onClick={() => setCityModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seleccione la ubicación de trabajo para el registro de ventas, compras, despachos de almacén y facturas:
            </p>

            <div className="space-y-2.5">
              {/* Bucaramanga */}
              <button
                type="button"
                onClick={() => handleSaveCity('Bucaramanga (Sede Principal)')}
                disabled={savingCity}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  currentUser?.city?.includes('Bucaramanga')
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Bucaramanga (Sede Principal)</h4>
                    <p className="text-[11px] text-slate-500">Administración General, Gerencia y Finanzas</p>
                  </div>
                </div>
                {currentUser?.city?.includes('Bucaramanga') && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>

              {/* Barrancabermeja */}
              <button
                type="button"
                onClick={() => handleSaveCity('El Centro, Barrancabermeja')}
                disabled={savingCity}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                  currentUser?.city?.includes('Barrancabermeja')
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">El Centro, Barrancabermeja</h4>
                    <p className="text-[11px] text-slate-500">Operaciones, Almacén Central & Logística</p>
                  </div>
                </div>
                {currentUser?.city?.includes('Barrancabermeja') && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
