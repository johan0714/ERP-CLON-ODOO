import React from 'react';
import { Search, Plus, List, LayoutGrid, ChevronRight, Home, ArrowLeft } from 'lucide-react';

export default function ControlPanel({
  breadcrumbs = [],
  onNew,
  newButtonLabel = "Nuevo",
  searchTerm = "",
  onSearchChange,
  viewMode = "list",
  onViewModeChange,
  showViewSwitcher = true,
  extraButtons = null,
  onHome = null,
}) {
  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shadow-xs select-none">
      {/* Left: Home Return, Breadcrumbs & Primary Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {onHome && (
          <button
            onClick={onHome}
            title="Volver al Tablero Principal"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inicio</span>
          </button>
        )}

        {onNew && (
          <button
            onClick={onNew}
            className="flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-700/20 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{newButtonLabel}</span>
          </button>
        )}

        {extraButtons}

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1.5 text-xs text-slate-500">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                {crumb.onClick && !isLast ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-blue-700 hover:underline font-semibold text-slate-600 cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={isLast ? 'font-bold text-slate-900' : 'font-medium'}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Search bar & View switchers */}
      <div className="flex items-center space-x-2.5">
        {onSearchChange && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en este módulo..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 w-36 sm:w-60 transition"
            />
          </div>
        )}

        {showViewSwitcher && onViewModeChange && (
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              onClick={() => onViewModeChange('list')}
              title="Vista Lista"
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                viewMode === 'list' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              title="Vista Tarjetas"
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                viewMode === 'kanban' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
