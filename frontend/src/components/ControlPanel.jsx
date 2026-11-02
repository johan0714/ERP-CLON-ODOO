import React from 'react';
import { Search, Plus, List, LayoutGrid, ChevronRight } from 'lucide-react';

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
}) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      {/* Left: Breadcrumbs & Primary Actions */}
      <div className="flex items-center space-x-3">
        {onNew && (
          <button
            onClick={onNew}
            className="flex items-center space-x-1.5 bg-[#714B67] hover:bg-[#5b3c53] text-white px-3 py-1.5 rounded text-sm font-medium transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{newButtonLabel}</span>
          </button>
        )}

        {extraButtons}

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-1 text-sm text-slate-600">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                {crumb.onClick && !isLast ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-[#714B67] hover:underline font-medium cursor-pointer"
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
      <div className="flex items-center space-x-2">
        {onSearchChange && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67] w-48 sm:w-64 bg-slate-50/50"
            />
          </div>
        )}

        {showViewSwitcher && onViewModeChange && (
          <div className="flex items-center border border-slate-300 rounded overflow-hidden">
            <button
              onClick={() => onViewModeChange('list')}
              title="Vista Lista"
              className={`p-1.5 cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-500 hover:bg-slate-100'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              title="Vista Kanban"
              className={`p-1.5 cursor-pointer ${
                viewMode === 'kanban' ? 'bg-slate-200 text-slate-800' : 'bg-white text-slate-500 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
