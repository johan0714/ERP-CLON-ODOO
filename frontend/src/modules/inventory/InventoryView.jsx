import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ControlPanel from '../../components/ControlPanel';
import { formatCOP } from '../../utils/format';
import { Package, Truck, CheckCircle2, Clock, Plus, X, AlertTriangle } from 'lucide-react';

export default function InventoryView({ subView = 'products', onHome }) {
  const [currentTab, setCurrentTab] = useState(subView === 'pickings' ? 'pickings' : 'products');
  const [products, setProducts] = useState([]);
  const [pickings, setPickings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('kanban');

  // Modal Product
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    default_code: '',
    type: 'product',
    list_price: 0,
    standard_price: 0,
    initial_qty: 10,
    uom_name: 'Unidades',
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

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/products', productForm);
      setProductModalOpen(false);
      setProductForm({
        name: '',
        default_code: '',
        type: 'product',
        list_price: 0,
        standard_price: 0,
        initial_qty: 10,
        uom_name: 'Unidades',
        description: '',
      });
      fetchProducts();
    } catch (err) {
      alert('Error al crear el producto');
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
          { label: currentTab === 'products' ? 'Productos y Stock' : 'Albaranes de Entrega' }
        ]}
        onNew={currentTab === 'products' ? () => setProductModalOpen(true) : null}
        newButtonLabel="Nuevo Producto"
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
              Productos
            </button>
            <button
              onClick={() => setCurrentTab('pickings')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                currentTab === 'pickings' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Albaranes ({pickings.filter(p => p.state !== 'done').length} pend.)
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando inventario...</div>
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
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200/50">
                          <Package className="w-6 h-6" />
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.qty_available} {p.uom_name}
                        </span>
                      </div>

                      <div className="mt-3">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {p.default_code || 'Sin Ref. Interna'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {p.description || 'Sin descripción adicional'}
                        </p>
                      </div>
                    </div>

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
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4 text-right">Precio Venta</th>
                    <th className="py-3 px-4 text-right">Coste</th>
                    <th className="py-3 px-4 text-right">Stock Disponible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{p.default_code || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-3 px-4 text-xs text-slate-500 capitalize">{p.type === 'product' ? 'Almacenable' : 'Servicio'}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCOP(p.list_price)}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatCOP(p.standard_price)}</td>
                      <td className="py-3 px-4 text-right font-black">
                        <span className={p.qty_available <= 0 ? 'text-red-600' : 'text-emerald-700'}>
                          {p.qty_available} {p.uom_name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* VISTA ALBARANES / PICKINGS */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Albarán</th>
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
                      No hay albaranes registrados. Se crearán automáticamente al confirmar pedidos de venta.
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded transition shadow-xs cursor-pointer"
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

      {/* Modal Crear Producto */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="text-lg font-bold text-slate-800">Nuevo Producto / Servicio</h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Servidor Blade 2U"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Referencia Interna (SKU)</label>
                  <input
                    type="text"
                    placeholder="SRV-2U"
                    value={productForm.default_code}
                    onChange={(e) => setProductForm({ ...productForm, default_code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Producto</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    <option value="product">Almacenable</option>
                    <option value="service">Servicio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Venta (COP $)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={productForm.list_price}
                    onChange={(e) => setProductForm({ ...productForm, list_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Coste (COP $)</label>
                  <input
                    type="number"
                    step="1"
                    value={productForm.standard_price}
                    onChange={(e) => setProductForm({ ...productForm, standard_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {productForm.type === 'product' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      value={productForm.initial_qty}
                      onChange={(e) => setProductForm({ ...productForm, initial_qty: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unidad de Medida</label>
                    <input
                      type="text"
                      value={productForm.uom_name}
                      onChange={(e) => setProductForm({ ...productForm, uom_name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-medium cursor-pointer shadow-xs"
                >
                  Crear Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Albarán */}
      {selectedPicking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400">Albarán de Salida</span>
                <h3 className="text-xl font-black text-slate-900">{selectedPicking.name}</h3>
              </div>
              <button
                onClick={() => setSelectedPicking(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Status */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
              <div className="text-xs">
                <span className="font-semibold text-slate-500">Documento Origen:</span>{' '}
                <span className="font-bold text-indigo-700">{selectedPicking.origin}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    selectedPicking.state === 'done'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedPicking.state === 'done' ? '✓ Transferido / Hecho' : 'Listo para Despacho'}
                </span>
              </div>
            </div>

            {/* Items a transferir */}
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Líneas de Operación</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-5">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-right">Demanda</th>
                    <th className="py-2.5 px-3 text-right">Realizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPicking.move_lines?.map((ml) => (
                    <tr key={ml.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{ml.name}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{ml.product_uom_qty}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {selectedPicking.state === 'done' ? ml.product_uom_qty : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => setSelectedPicking(null)}
                className="px-4 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium text-sm cursor-pointer"
              >
                Cerrar
              </button>

              {selectedPicking.state !== 'done' && (
                <button
                  disabled={validating}
                  onClick={() => handleValidatePicking(selectedPicking.id)}
                  className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer transition active:scale-95"
                >
                  {validating ? 'Validando...' : 'VALIDAR Y DESCONTAR STOCK'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
