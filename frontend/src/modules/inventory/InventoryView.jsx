import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ControlPanel from '../../components/ControlPanel';
import { formatCOP } from '../../utils/format';
import { Package, Truck, CheckCircle2, Clock, Plus, X, AlertTriangle, Pencil, Trash2, Edit3, Save } from 'lucide-react';

export default function InventoryView({ subView = 'products', onHome }) {
  const [currentTab, setCurrentTab] = useState(subView === 'pickings' ? 'pickings' : 'products');
  const [products, setProducts] = useState([]);
  const [pickings, setPickings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('kanban');

  // Modal Product (Create / Edit)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    default_code: '',
    type: 'product',
    list_price: 0,
    standard_price: 0,
    initial_qty: 10,
    uom_name: 'Balde (5 Gal)',
    description: '',
  });

  // Modal Picking Details
  const [selectedPicking, setSelectedPicking] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    setCurrentTab(subView === 'pickings' ? 'pickings' : 'products');
  }, [subView]);

  useEffect(() => {
    if (currentTab === 'products') {
      fetchProducts();
    } else {
      fetchPickings();
    }
  }, [currentTab, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/products', { params: { search: searchTerm || undefined } });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPickings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/pickings');
      setPickings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      default_code: '',
      type: 'product',
      list_price: 0,
      standard_price: 0,
      initial_qty: 10,
      uom_name: 'Balde (5 Gal)',
      description: '',
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      default_code: p.default_code || '',
      type: p.type || 'product',
      list_price: p.list_price || 0,
      standard_price: p.standard_price || 0,
      initial_qty: p.qty_available !== undefined ? p.qty_available : 0,
      uom_name: p.uom_name || 'Balde (5 Gal)',
      description: p.description || '',
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      setSavingProduct(true);
      if (editingProduct) {
        await api.put(`/inventory/products/${editingProduct.id}`, {
          name: productForm.name,
          default_code: productForm.default_code,
          type: productForm.type,
          list_price: productForm.list_price,
          standard_price: productForm.standard_price,
          qty_available: productForm.initial_qty,
          uom_name: productForm.uom_name,
          description: productForm.description,
        });
      } else {
        await api.post('/inventory/products', productForm);
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      alert('Error al guardar el producto: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (p) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar la referencia "${p.name}" (${p.default_code || 'Sin SKU'})?\n\nEsta acción quitará el producto del catálogo y stock activo.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/inventory/products/${p.id}`);
      fetchProducts();
    } catch (err) {
      alert('Error al eliminar producto: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleValidatePicking = async (pickingId) => {
    try {
      setValidating(true);
      await api.post(`/inventory/pickings/${pickingId}/validate`);
      const updated = await api.get(`/inventory/pickings/${pickingId}`);
      setSelectedPicking(updated.data);
      fetchPickings();
    } catch (err) {
      alert('Error al validar la entrega: ' + (err.response?.data?.detail || err.message));
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ControlPanel
        onHome={onHome}
        breadcrumbs={[
          { label: 'Inventario' },
          { label: currentTab === 'products' ? 'Lubricantes, Filtros & Stock' : 'Remisiones de Despacho' }
        ]}
        onNew={currentTab === 'products' ? handleOpenNewProduct : null}
        newButtonLabel="+ Nuevo Producto / Filtro"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        extraButtons={
          <div className="flex items-center space-x-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setCurrentTab('products')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                currentTab === 'products' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lubricantes & Filtros ({products.length})
            </button>
            <button
              onClick={() => setCurrentTab('pickings')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                currentTab === 'pickings' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Remisiones ({pickings.filter(p => p.state !== 'done').length} pend.)
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando catálogo e inventario...</div>
        ) : currentTab === 'products' ? (
          /* VISTA PRODUCTOS */
          viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => {
                const isOutOfStock = p.qty_available <= 0;
                const isLowStock = p.qty_available > 0 && p.qty_available <= 5;
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200/60">
                          <Package className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {p.qty_available} {p.uom_name}
                        </span>
                      </div>

                      <div className="mt-3">
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1" title={p.name}>
                          {p.name}
                        </h4>
                        <span className="text-[11px] font-mono font-semibold text-blue-600 block mt-0.5">
                          {p.default_code || 'Sin Ref. Interna'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {p.description || 'Sin especificaciones registradas'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Venta</span>
                          <span className="font-black text-slate-900 text-sm">{formatCOP(p.list_price)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Coste</span>
                          <span className="text-slate-600 font-semibold">{formatCOP(p.standard_price)}</span>
                        </div>
                      </div>

                      {/* Botones Modificar y Eliminar en Tarjeta */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Modificar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          title="Eliminar del catálogo"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4">Producto / Filtro</th>
                    <th className="py-3 px-4">Presentación</th>
                    <th className="py-3 px-4 text-right">Precio Venta</th>
                    <th className="py-3 px-4 text-right">Coste</th>
                    <th className="py-3 px-4 text-right">Stock Disponible</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700">
                        {p.default_code || '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{p.uom_name || 'Unidad'}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCOP(p.list_price)}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatCOP(p.standard_price)}</td>
                      <td className="py-3 px-4 text-right font-black">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          p.qty_available <= 0
                            ? 'bg-rose-100 text-rose-700'
                            : p.qty_available <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.qty_available} {p.uom_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
                            title="Modificar referencia o stock"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* VISTA REMISIONES / PICKINGS */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-2xs">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Nº Remisión</th>
                  <th className="py-3 px-4">Contacto / Destinatario</th>
                  <th className="py-3 px-4">Documento Origen</th>
                  <th className="py-3 px-4">Fecha Prevista</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pickings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No hay remisiones registradas. Se crearán automáticamente al confirmar pedidos de venta.
                    </td>
                  </tr>
                ) : (
                  pickings.map((pk) => (
                    <tr
                      key={pk.id}
                      onClick={() => setSelectedPicking(pk)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{pk.name}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{pk.partner?.name || 'Cliente sin nombre'}</td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-700">{pk.origin || '-'}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(pk.scheduled_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            pk.state === 'done'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pk.state === 'assigned'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pk.state === 'done' ? 'Hecho / Entregado' : pk.state === 'assigned' ? 'Listo para entrega' : pk.state}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {pk.state !== 'done' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidatePicking(pk.id);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-xl transition shadow-xs cursor-pointer"
                          >
                            Validar Entrega
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Modificar Producto */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? 'Modificar Referencia de Stock' : 'Nuevo Lubricante / Filtro'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingProduct ? `Editando: ${editingProduct.name}` : 'Catálogo de Grupo Soluciones Colombia'}
                </p>
              </div>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nombre del Lubricante o Filtro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Aceite Motor 15W-40 CI-4 o Filtro P552100"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Código / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LUB-15W40 o FLT-P552100"
                    value={productForm.default_code}
                    onChange={(e) => setProductForm({ ...productForm, default_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Tipo de Ítem
                  </label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-medium"
                  >
                    <option value="product">Lubricante / Filtro Físico</option>
                    <option value="service">Servicio Técnico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Costo Adquisición (COP $)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={productForm.standard_price}
                    onChange={(e) => {
                      const cost = parseFloat(e.target.value) || 0;
                      const currentMargin = productForm.margin_percent !== undefined ? productForm.margin_percent : (cost > 0 && productForm.list_price > 0 ? Math.round(((productForm.list_price - cost) / cost) * 100 * 10) / 10 : 0);
                      const newPrice = cost > 0 && currentMargin > 0 ? Math.round(cost * (1 + currentMargin / 100)) : productForm.list_price;
                      setProductForm({ ...productForm, standard_price: cost, list_price: newPrice, margin_percent: currentMargin });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    % Margen Ganancia
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={productForm.margin_percent !== undefined ? productForm.margin_percent : (productForm.standard_price > 0 && productForm.list_price > 0 ? Math.round(((productForm.list_price - productForm.standard_price) / productForm.standard_price) * 100 * 10) / 10 : 0)}
                      onChange={(e) => {
                        const margin = parseFloat(e.target.value) || 0;
                        const cost = parseFloat(productForm.standard_price) || 0;
                        const newPrice = cost > 0 ? Math.round(cost * (1 + margin / 100)) : productForm.list_price;
                        setProductForm({ ...productForm, margin_percent: margin, list_price: newPrice });
                      }}
                      className="w-full px-3 py-2 pr-6 bg-emerald-50/40 border border-emerald-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-xs font-bold text-emerald-800"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Precio Venta (COP $) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={productForm.list_price}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      const cost = parseFloat(productForm.standard_price) || 0;
                      const margin = cost > 0 ? Math.round(((price - cost) / cost) * 100 * 10) / 10 : 0;
                      setProductForm({ ...productForm, list_price: price, margin_percent: margin });
                    }}
                    className="w-full px-3 py-2 bg-blue-50/30 border border-blue-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-black text-blue-900"
                  />
                </div>
              </div>

              {productForm.type === 'product' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-blue-700 mb-1">
                      {editingProduct ? 'Stock Disponible (Ajuste)' : 'Stock Inicial'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={productForm.initial_qty}
                      onChange={(e) => setProductForm({ ...productForm, initial_qty: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-blue-50/50 border border-blue-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 text-xs font-black text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Unidad de Medida
                    </label>
                    <input
                      type="text"
                      placeholder="Tambor (55 Gal), Balde, Unidad"
                      value={productForm.uom_name}
                      onChange={(e) => setProductForm({ ...productForm, uom_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Descripción / Aplicación
                </label>
                <textarea
                  rows={2}
                  placeholder="Especificaciones técnicas, compatibilidad de motores, etc."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer shadow-md shadow-blue-700/20 transition active:scale-95 flex items-center space-x-1.5"
                >
                  {savingProduct ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingProduct ? 'Guardar Cambios' : 'Crear Referencia'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Remisión */}
      {selectedPicking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400">Remisión de Salida / Despacho</span>
                <h3 className="text-xl font-black text-slate-900">{selectedPicking.name}</h3>
              </div>
              <button
                onClick={() => setSelectedPicking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Cliente Destinatario</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedPicking.partner?.name || 'Cliente sin nombre'}</span>
                  <span className="text-xs text-slate-500 block">{selectedPicking.partner?.city || 'Bucaramanga'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Documento de Venta</span>
                  <span className="font-mono text-xs font-bold text-indigo-700">{selectedPicking.origin || 'Directo'}</span>
                  <span className="text-xs text-slate-500 block">
                    Fecha programada: {new Date(selectedPicking.scheduled_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Líneas de Movimiento de Almacén</h4>
                <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Lubricante / Filtro</th>
                        <th className="py-2.5 px-3 text-right">Demanda Inicial</th>
                        <th className="py-2.5 px-3 text-right">Cant. Entregada</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPicking.move_lines.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{m.name}</td>
                          <td className="py-2 px-3 text-right font-bold">{m.product_uom_qty}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">{m.quantity_done}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              m.state === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {m.state === 'done' ? 'Entregado' : 'Por Despachar'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Estado actual: <strong className="uppercase text-slate-800">{selectedPicking.state}</strong>
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPicking(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cerrar
                  </button>
                  {selectedPicking.state !== 'done' && (
                    <button
                      type="button"
                      disabled={validating}
                      onClick={() => handleValidatePicking(selectedPicking.id)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition active:scale-95"
                    >
                      {validating ? 'Validando...' : 'Validar Entrega (Descontar Stock)'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
