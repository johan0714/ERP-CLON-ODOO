import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ControlPanel from '../../components/ControlPanel';
import { formatCOP } from '../../utils/format';
import { getPresentationBadge, COMMERCIAL_PRESENTATIONS } from '../inventory/InventoryView';
import {
  FileText,
  Truck,
  Receipt,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function SalesView({ onOpenDelivery, onOpenInvoice, onHome }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);

  // Active Order (Form View)
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // New Order Form state
  const [newOrderData, setNewOrderData] = useState({
    partner_id: '',
    note: '',
    lines: [
      { product_id: '', name: '', product_uom_qty: 1, price_unit: 0, tax_percent: 19 },
    ],
  });

  useEffect(() => {
    fetchOrders();
    fetchMetadata();
  }, [searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales/', { params: { search: searchTerm || undefined } });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [pRes, prodRes] = await Promise.all([
        api.get('/contacts/', { params: { is_customer: true } }),
        api.get('/inventory/products'),
      ]);
      setPartners(pRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectOrder = async (orderId) => {
    try {
      const res = await api.get(`/sales/${orderId}`);
      setSelectedOrder(res.data);
      setIsCreating(false);
    } catch (err) {
      alert('Error al cargar pedido');
    }
  };

  const calculateMargin = (cost, price) => {
    if (!cost || cost <= 0) return 0;
    return Math.round(((price - cost) / cost) * 100 * 10) / 10;
  };

  const handleStartNew = () => {
    setSelectedOrder(null);
    setIsCreating(true);
    const defaultProd = products[0];
    const cost = defaultProd ? (defaultProd.standard_price || 0) : 0;
    const price = defaultProd ? (defaultProd.list_price || 0) : 0;
    const margin = calculateMargin(cost, price);

    setNewOrderData({
      partner_id: partners.length > 0 ? partners[0].id : '',
      note: 'Condiciones de pago: 30 días. Despacho y entrega de lubricantes/filtros en sede Bucaramanga o El Centro, Barrancabermeja.',
      lines: [
        {
          product_id: defaultProd ? defaultProd.id : '',
          name: defaultProd ? defaultProd.name : '',
          uom_name: defaultProd?.uom_name || 'Balde (5 Gal)',
          cost_price: cost,
          margin_percent: margin,
          product_uom_qty: 1,
          price_unit: price,
          tax_percent: 19,
        },
      ],
    });
  };

  const handleAddLine = () => {
    const defaultProd = products[0];
    const cost = defaultProd ? (defaultProd.standard_price || 0) : 0;
    const price = defaultProd ? (defaultProd.list_price || 0) : 0;
    const margin = calculateMargin(cost, price);

    setNewOrderData({
      ...newOrderData,
      lines: [
        ...newOrderData.lines,
        {
          product_id: defaultProd ? defaultProd.id : '',
          name: defaultProd ? defaultProd.name : '',
          uom_name: defaultProd?.uom_name || 'Balde (5 Gal)',
          cost_price: cost,
          margin_percent: margin,
          product_uom_qty: 1,
          price_unit: price,
          tax_percent: 19,
        },
      ],
    });
  };

  const handleRemoveLine = (idx) => {
    const updated = [...newOrderData.lines];
    updated.splice(idx, 1);
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  const handleLineProductChange = (idx, prodId) => {
    const prod = products.find((p) => p.id === parseInt(prodId));
    if (!prod) return;
    const cost = prod.standard_price || 0;
    const price = prod.list_price || 0;
    const margin = calculateMargin(cost, price);

    const updated = [...newOrderData.lines];
    updated[idx].product_id = prod.id;
    updated[idx].name = prod.name;
    updated[idx].uom_name = prod.uom_name || 'Balde (5 Gal)';
    updated[idx].cost_price = cost;
    updated[idx].margin_percent = margin;
    updated[idx].price_unit = price;
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  const handleLineUomChange = (idx, uom) => {
    const updated = [...newOrderData.lines];
    updated[idx].uom_name = uom;
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  const handleLineQtyChange = (idx, qty) => {
    const updated = [...newOrderData.lines];
    updated[idx].product_uom_qty = parseFloat(qty) || 0;
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  // Modificar Costo de Adquisición
  const handleLineCostChange = (idx, costVal) => {
    const cost = parseFloat(costVal) || 0;
    const updated = [...newOrderData.lines];
    updated[idx].cost_price = cost;
    const margin = parseFloat(updated[idx].margin_percent) || 0;
    if (cost > 0 && margin !== 0) {
      updated[idx].price_unit = Math.round(cost * (1 + margin / 100));
    } else if (cost > 0 && updated[idx].price_unit > 0) {
      updated[idx].margin_percent = calculateMargin(cost, updated[idx].price_unit);
    }
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  // Opción 1: Fijar precio dado por Porcentaje de Ganancia sobre el Costo de Adquisición
  const handleLineMarginChange = (idx, marginVal) => {
    const margin = parseFloat(marginVal) || 0;
    const updated = [...newOrderData.lines];
    updated[idx].margin_percent = margin;
    const cost = parseFloat(updated[idx].cost_price) || 0;
    if (cost > 0) {
      updated[idx].price_unit = Math.round(cost * (1 + margin / 100));
    }
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  // Opción 2: Fijar precio a conveniencia escrito a mano
  const handleLinePriceChange = (idx, priceVal) => {
    const price = parseFloat(priceVal) || 0;
    const updated = [...newOrderData.lines];
    updated[idx].price_unit = price;
    const cost = parseFloat(updated[idx].cost_price) || 0;
    if (cost > 0) {
      updated[idx].margin_percent = calculateMargin(cost, price);
    }
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  const handleLineTaxChange = (idx, tax) => {
    const updated = [...newOrderData.lines];
    updated[idx].tax_percent = parseFloat(tax);
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  const calculateNewOrderTotals = () => {
    let untaxed = 0;
    let tax = 0;
    let totalCost = 0;
    newOrderData.lines.forEach((l) => {
      const qty = parseFloat(l.product_uom_qty) || 0;
      const price = parseFloat(l.price_unit) || 0;
      const cost = parseFloat(l.cost_price) || 0;
      const sub = qty * price;
      untaxed += sub;
      totalCost += qty * cost;
      const rate = l.tax_percent !== undefined && l.tax_percent !== null ? parseFloat(l.tax_percent) : 19;
      tax += sub * (rate / 100);
    });
    const profit = untaxed - totalCost;
    const profitMargin = totalCost > 0 ? Math.round((profit / totalCost) * 100 * 10) / 10 : 0;
    return {
      untaxed: round(untaxed),
      tax: round(tax),
      total: round(untaxed + tax),
      totalCost: round(totalCost),
      profit: round(profit),
      profitMargin,
    };
  };

  const round = (val) => Math.round(val * 100) / 100;

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!newOrderData.partner_id) {
      alert('Debes seleccionar un cliente');
      return;
    }
    if (newOrderData.lines.length === 0) {
      alert('Debes agregar al menos una línea de pedido');
      return;
    }

    try {
      const res = await api.post('/sales/', {
        partner_id: parseInt(newOrderData.partner_id),
        note: newOrderData.note,
        lines: newOrderData.lines.map((l) => ({
          product_id: parseInt(l.product_id),
          name: l.name,
          uom_name: l.uom_name || 'Balde (5 Gal)',
          product_uom_qty: l.product_uom_qty,
          price_unit: l.price_unit,
          tax_percent: l.tax_percent,
        })),
      });
      setIsCreating(false);
      setSelectedOrder(res.data);
      fetchOrders();
    } catch (err) {
      alert('Error al guardar presupuesto: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.post(`/sales/${selectedOrder.id}/confirm`);
      setSelectedOrder(res.data);
      fetchOrders();
    } catch (err) {
      alert('Error al confirmar pedido: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.post(`/sales/${selectedOrder.id}/create-invoice`);
      alert(`¡Factura ${res.data.invoice_name} generada con éxito!`);
      const updated = await api.get(`/sales/${selectedOrder.id}`);
      setSelectedOrder(updated.data);
      fetchOrders();
    } catch (err) {
      alert('Error al crear factura: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este pedido permanentemente? Esta acción limpiará también las remisiones y facturas asociadas a él.')) {
      return;
    }
    try {
      await api.delete(`/sales/${orderId}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
      fetchOrders();
      alert('Pedido de venta eliminado con éxito');
    } catch (err) {
      alert('Error al eliminar el pedido: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Control Panel */}
      <ControlPanel
        onHome={onHome}
        breadcrumbs={
          selectedOrder
            ? [{ label: 'Ventas', onClick: () => setSelectedOrder(null) }, { label: selectedOrder.name }]
            : isCreating
            ? [{ label: 'Ventas', onClick: () => setIsCreating(false) }, { label: 'Nuevo Presupuesto' }]
            : [{ label: 'Ventas' }, { label: 'Presupuestos y Pedidos' }]
        }
        onNew={!selectedOrder && !isCreating ? handleStartNew : null}
        newButtonLabel="Nuevo Pedido"
        searchTerm={!selectedOrder && !isCreating ? searchTerm : undefined}
        onSearchChange={!selectedOrder && !isCreating ? setSearchTerm : undefined}
        showViewSwitcher={!selectedOrder && !isCreating}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        extraButtons={
          (selectedOrder || isCreating) && (
            <button
              onClick={() => {
                setSelectedOrder(null);
                setIsCreating(false);
              }}
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la lista</span>
            </button>
          )
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isCreating ? (
          /* FORMULARIO NUEVO PRESUPUESTO */
          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-md p-6">
            <div className="flex items-center justify-between pb-4 border-b mb-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nuevo Documento</span>
                <h2 className="text-2xl font-black text-slate-900">Borrador de Presupuesto</h2>
              </div>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-6">
              {/* Cabecera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Cliente *</label>
                  <select
                    required
                    value={newOrderData.partner_id}
                    onChange={(e) => setNewOrderData({ ...newOrderData, partner_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">-- Seleccionar Cliente --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.vat ? `(${p.vat})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Notas / Condiciones</label>
                  <input
                    type="text"
                    value={newOrderData.note}
                    onChange={(e) => setNewOrderData({ ...newOrderData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Líneas de Pedido */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase text-slate-700">Líneas del Pedido</h3>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center space-x-1 text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Producto</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full min-w-[840px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3 min-w-[200px]">Producto / Referencia</th>
                        <th className="py-2.5 px-2 w-44 text-left" title="Presentación del producto (Balde, Tambor, Garrafa, Caja, etc.)">
                          Presentación
                        </th>
                        <th className="py-2.5 px-2 w-20 text-right">Cant.</th>
                        <th className="py-2.5 px-2 w-28 text-right" title="Costo de compra o adquisición">
                          Costo Adq.
                        </th>
                        <th className="py-2.5 px-2 w-28 text-right" title="Opción 1: Porcentaje de ganancia sobre el costo">
                          % Ganancia
                        </th>
                        <th className="py-2.5 px-2 w-32 text-right" title="Opción 2: Precio de venta unitario (a conveniencia / escrito a mano)">
                          Precio Venta
                        </th>
                        <th className="py-2.5 px-2 w-28 text-right">IVA</th>
                        <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newOrderData.lines.map((line, idx) => {
                        const lineSub = (line.product_uom_qty || 0) * (line.price_unit || 0);
                        const marginVal = line.margin_percent !== undefined ? line.margin_percent : 0;
                        const isMarginPositive = marginVal >= 0;
                        const selectedProd = products.find((p) => p.id === parseInt(line.product_id));
                        const currentUom = line.uom_name || selectedProd?.uom_name || 'Balde (5 Gal)';
                        const badge = getPresentationBadge(currentUom);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            {/* Producto */}
                            <td className="py-2 px-3">
                              <select
                                value={line.product_id}
                                onChange={(e) => handleLineProductChange(idx, e.target.value)}
                                className="w-full py-1.5 px-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-600 font-medium"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Cuadro para elegir Presentación al lado del nombre */}
                            <td className="py-2 px-2">
                              <select
                                value={currentUom}
                                onChange={(e) => handleLineUomChange(idx, e.target.value)}
                                className="w-full py-1.5 px-2 border border-blue-400 bg-blue-50/40 hover:bg-white rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-600 transition cursor-pointer"
                                title="Elegir si es Balde, Tambor, Garrafa, Caja, etc."
                              >
                                {COMMERCIAL_PRESENTATIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                                {selectedProd?.uom_name && !COMMERCIAL_PRESENTATIONS.some((o) => o.value === selectedProd.uom_name) && (
                                  <option value={selectedProd.uom_name}>
                                    {selectedProd.uom_name}
                                  </option>
                                )}
                              </select>
                            </td>

                            {/* Cantidad */}
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={line.product_uom_qty}
                                onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                                className="w-full text-right py-1.5 px-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-600"
                              />
                            </td>

                            {/* Costo de Adquisición */}
                            <td className="py-2 px-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                                <input
                                  type="number"
                                  step="1"
                                  value={line.cost_price || 0}
                                  onChange={(e) => handleLineCostChange(idx, e.target.value)}
                                  className="w-full text-right py-1.5 pr-2 pl-4 border border-slate-300 rounded-lg text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-blue-600"
                                  title="Costo de adquisición base"
                                />
                              </div>
                            </td>

                            {/* Opción 1: Porcentaje de Ganancia sobre Costo */}
                            <td className="py-2 px-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={line.margin_percent !== undefined ? line.margin_percent : 0}
                                  onChange={(e) => handleLineMarginChange(idx, e.target.value)}
                                  className={`w-full text-right py-1.5 pr-5 pl-2 border rounded-lg text-xs font-bold focus:ring-1 focus:ring-blue-600 ${
                                    isMarginPositive
                                      ? 'border-emerald-300 bg-emerald-50/40 text-emerald-800'
                                      : 'border-rose-300 bg-rose-50/40 text-rose-800'
                                  }`}
                                  title="Porcentaje de ganancia sobre costo (calcula el precio automáticamente)"
                                />
                                <span className="absolute right-2 top-1.5 text-xs font-bold text-slate-400 pointer-events-none">
                                  %
                                </span>
                              </div>
                            </td>

                            {/* Opción 2: Precio de Venta a Conveniencia (Escrito a mano) */}
                            <td className="py-2 px-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-blue-600 text-xs font-bold">$</span>
                                <input
                                  type="number"
                                  step="1"
                                  value={line.price_unit}
                                  onChange={(e) => handleLinePriceChange(idx, e.target.value)}
                                  className="w-full text-right py-1.5 pr-2 pl-4 border border-blue-300 rounded-lg text-xs font-black text-blue-900 bg-blue-50/30 focus:bg-white focus:ring-2 focus:ring-blue-600"
                                  title="Precio de venta unitario escrito a mano a conveniencia"
                                />
                              </div>
                            </td>

                            {/* Selector de IVA */}
                            <td className="py-2 px-2">
                              <select
                                value={line.tax_percent !== undefined ? line.tax_percent : 19}
                                onChange={(e) => handleLineTaxChange(idx, e.target.value)}
                                className="w-full py-1.5 px-1.5 border border-slate-300 rounded-lg text-xs bg-white text-right font-medium focus:ring-1 focus:ring-blue-600 cursor-pointer"
                              >
                                <option value="19">19% (General)</option>
                                <option value="5">5% (Reducido)</option>
                                <option value="0">0% (Exento)</option>
                              </select>
                            </td>

                            {/* Subtotal */}
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {formatCOP(lineSub)}
                            </td>

                            {/* Eliminar línea */}
                            <td className="py-2 px-2 text-center">
                              {newOrderData.lines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(idx)}
                                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                                  title="Quitar línea"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Resumen de Rentabilidad y Totales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 text-xs flex flex-col justify-center space-y-1.5">
                    <div className="font-bold text-slate-700 flex items-center justify-between">
                      <span className="text-slate-500 uppercase text-[10px] tracking-wider">Margen Estimado de Operación</span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                        {calculateNewOrderTotals().profitMargin >= 0 ? `+${calculateNewOrderTotals().profitMargin}% Margen Promedio` : `${calculateNewOrderTotals().profitMargin}%`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Costo de Adquisición Total:</span>
                      <span className="font-semibold">{formatCOP(calculateNewOrderTotals().totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Ganancia Bruta Estimada:</span>
                      <span>+{formatCOP(calculateNewOrderTotals().profit)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-72 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Base Imponible:</span>
                        <span className="font-semibold">{formatCOP(calculateNewOrderTotals().untaxed)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>IVA / Impuestos:</span>
                        <span className="font-semibold">{formatCOP(calculateNewOrderTotals().tax)}</span>
                      </div>
                      <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                        <span>Total Presupuesto:</span>
                        <span className="text-blue-700">{formatCOP(calculateNewOrderTotals().total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md cursor-pointer transition active:scale-95"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        ) : selectedOrder ? (
          /* VISTA FORMULARIO ESTILO ODOO CON SMART BUTTONS Y PIPELINE */
          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
            {/* Odoo Action Bar & Status Stepper */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              {/* Acciones de Flujo */}
              <div className="flex items-center space-x-2">
                {selectedOrder.state === 'draft' && (
                  <button
                    onClick={handleConfirmOrder}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    Confirmar Pedido
                  </button>
                )}

                {selectedOrder.state === 'sale' && selectedOrder.invoice_status === 'to_invoice' && (
                  <button
                    onClick={handleCreateInvoice}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    Crear Factura
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
                  title="Eliminar este pedido permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Pedido</span>
                </button>
              </div>

              {/* Status Stepper (Borrador -> Pedido de Venta -> Bloqueado) */}
              <div className="flex items-center text-xs font-bold rounded-lg border border-slate-200 overflow-hidden bg-white">
                <div
                  className={`px-3 py-1.5 ${
                    selectedOrder.state === 'draft'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-400 bg-slate-50'
                  }`}
                >
                  Presupuesto
                </div>
                <div
                  className={`px-3 py-1.5 border-l border-slate-200 ${
                    selectedOrder.state === 'sale'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-400 bg-slate-50'
                  }`}
                >
                  Pedido de Venta
                </div>
              </div>
            </div>

            {/* Smart Buttons Bar */}
            <div className="px-6 py-3 border-b border-slate-100 flex justify-end gap-2 bg-white">
              {selectedOrder.pickings_count > 0 && (
                <button
                  onClick={() => onOpenDelivery && onOpenDelivery(selectedOrder.name)}
                  className="flex items-center space-x-2 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-amber-600" />
                  <div className="text-left">
                    <div className="text-[10px] text-slate-400 uppercase">Entrega</div>
                    <div>{selectedOrder.pickings_count} Remisión(es)</div>
                  </div>
                </button>
              )}

              {selectedOrder.invoices_count > 0 && (
                <button
                  onClick={() => onOpenInvoice && onOpenInvoice(selectedOrder.id)}
                  className="flex items-center space-x-2 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <div className="text-left">
                    <div className="text-[10px] text-slate-400 uppercase">Facturación</div>
                    <div>{selectedOrder.invoices_count} Factura(s)</div>
                  </div>
                </button>
              )}
            </div>

            {/* Hoja de Pedido */}
            <div className="p-6 space-y-6">
              <div>
                <span className="text-xs uppercase font-extrabold text-slate-400">
                  {selectedOrder.state === 'draft' ? 'Presupuesto' : 'Pedido de Venta'}
                </span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedOrder.name}</h1>
              </div>

              {/* Datos Cliente y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cliente</span>
                  <div className="font-bold text-slate-900 text-base">{selectedOrder.partner?.name}</div>
                  <div className="text-xs text-slate-500">{selectedOrder.partner?.vat || 'Sin NIF'}</div>
                  <div className="text-xs text-slate-500">{selectedOrder.partner?.email}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Detalles de Entrega</span>
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold">Fecha:</span>{' '}
                    {new Date(selectedOrder.date_order).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    <span className="font-semibold">Estado Entrega:</span>{' '}
                    <span className="font-bold capitalize text-amber-700">{selectedOrder.delivery_status}</span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    <span className="font-semibold">Estado Facturación:</span>{' '}
                    <span className="font-bold capitalize text-emerald-700">
                      {selectedOrder.invoice_status === 'to_invoice'
                        ? 'Para Facturar'
                        : selectedOrder.invoice_status === 'invoiced'
                        ? 'Totalmente Facturado'
                        : 'Nada que facturar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabla de Líneas */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Líneas de Pedido</h4>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[580px] text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Producto / Concepto</th>
                        <th className="py-2.5 px-2 text-center w-28">Presentación</th>
                        <th className="py-2.5 px-3 text-right">Cant. Pedida</th>
                        <th className="py-2.5 px-3 text-right">Cant. Entregada</th>
                        <th className="py-2.5 px-3 text-right">Cant. Facturada</th>
                        <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 text-right">IVA</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.order_lines.map((l) => {
                        const badge = getPresentationBadge(l.uom_name || l.product?.uom_name);
                        return (
                          <tr key={l.id}>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{l.name}</td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${badge.color}`}>
                                <span>{badge.icon}</span>
                                <span>{l.uom_name || badge.label}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold">{l.product_uom_qty}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-amber-700">{l.qty_delivered}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{l.qty_invoiced}</td>
                            <td className="py-2.5 px-3 text-right">{formatCOP(l.price_unit)}</td>
                            <td className="py-2.5 px-3 text-right">
                              {l.tax_percent === 0 ? (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  0% Exento
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-600">{l.tax_percent}%</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {formatCOP(l.price_subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Subtotales */}
                <div className="flex justify-end mt-4">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Imponible:</span>
                      <span className="font-semibold">{formatCOP(selectedOrder.amount_untaxed)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IVA / Impuestos:</span>
                      <span className="font-semibold">{formatCOP(selectedOrder.amount_tax)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total:</span>
                      <span className="text-blue-700">{formatCOP(selectedOrder.amount_total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VISTA LISTA DE PEDIDOS */
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado Entrega</th>
                  <th className="py-3 px-4 text-center">Estado Factura</th>
                  <th className="py-3 px-4 text-right">Estado Pedido</th>
                  <th className="py-3 px-4 text-center w-14">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No hay pedidos registrados. Haz clic en "Nuevo Pedido" para crear un presupuesto.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => handleSelectOrder(o.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{o.name}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{o.partner?.name || 'Cliente'}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(o.date_order).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatCOP(o.amount_total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            o.delivery_status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.delivery_status === 'delivered' ? 'Entregado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            o.invoice_status === 'invoiced'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.invoice_status === 'to_invoice'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {o.invoice_status === 'invoiced'
                            ? 'Facturado'
                            : o.invoice_status === 'to_invoice'
                            ? 'Por Facturar'
                            : 'No'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            o.state === 'sale'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {o.state === 'sale' ? 'Pedido Venta' : 'Presupuesto'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Eliminar pedido permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
