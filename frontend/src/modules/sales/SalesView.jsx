import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ControlPanel from '../../components/ControlPanel';
import { formatCOP } from '../../utils/format';
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

  const handleStartNew = () => {
    setSelectedOrder(null);
    setIsCreating(true);
    setNewOrderData({
      partner_id: partners.length > 0 ? partners[0].id : '',
      note: 'Condiciones de pago: 30 días. Despacho y entrega de lubricantes/filtros en sede Bucaramanga o El Centro, Barrancabermeja.',
      lines: [
        {
          product_id: products.length > 0 ? products[0].id : '',
          name: products.length > 0 ? products[0].name : '',
          product_uom_qty: 1,
          price_unit: products.length > 0 ? products[0].list_price : 0,
          tax_percent: 19,
        },
      ],
    });
  };

  const handleAddLine = () => {
    const defaultProd = products[0];
    setNewOrderData({
      ...newOrderData,
      lines: [
        ...newOrderData.lines,
        {
          product_id: defaultProd ? defaultProd.id : '',
          name: defaultProd ? defaultProd.name : '',
          product_uom_qty: 1,
          price_unit: defaultProd ? defaultProd.list_price : 0,
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
    const updated = [...newOrderData.lines];
    updated[idx].product_id = prod.id;
    updated[idx].name = prod.name;
    updated[idx].price_unit = prod.list_price;
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  const handleLineQtyChange = (idx, qty) => {
    const updated = [...newOrderData.lines];
    updated[idx].product_uom_qty = parseFloat(qty) || 0;
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  const handleLinePriceChange = (idx, price) => {
    const updated = [...newOrderData.lines];
    updated[idx].price_unit = parseFloat(price) || 0;
    setNewOrderData({ ...newOrderData, lines: updated });
  };

  const calculateNewOrderTotals = () => {
    let untaxed = 0;
    let tax = 0;
    newOrderData.lines.forEach((l) => {
      const sub = (l.product_uom_qty || 0) * (l.price_unit || 0);
      untaxed += sub;
      tax += sub * ((l.tax_percent || 21) / 100);
    });
    return {
      untaxed: round(untaxed),
      tax: round(tax),
      total: round(untaxed + tax),
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

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Producto</th>
                        <th className="py-2.5 px-3 w-24 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 w-28 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 w-20 text-right">IVA (%)</th>
                        <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newOrderData.lines.map((line, idx) => {
                        const lineSub = (line.product_uom_qty || 0) * (line.price_unit || 0);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3">
                              <select
                                value={line.product_id}
                                onChange={(e) => handleLineProductChange(idx, e.target.value)}
                                className="w-full py-1 px-2 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-600"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({formatCOP(p.list_price)})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={line.product_uom_qty}
                                onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                                className="w-full text-right py-1 px-2 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                step="1"
                                value={line.price_unit}
                                onChange={(e) => handleLinePriceChange(idx, e.target.value)}
                                className="w-full text-right py-1 px-2 border border-slate-300 rounded text-xs"
                              />
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-slate-600">
                              {line.tax_percent}%
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {formatCOP(lineSub)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {newOrderData.lines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLine(idx)}
                                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
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

                {/* Totales */}
                <div className="flex justify-end mt-4">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Imponible:</span>
                      <span className="font-semibold">{formatCOP(calculateNewOrderTotals().untaxed)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IVA (19%):</span>
                      <span className="font-semibold">{formatCOP(calculateNewOrderTotals().tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total:</span>
                      <span className="text-blue-700">{formatCOP(calculateNewOrderTotals().total)}</span>
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
                    <div>{selectedOrder.pickings_count} Albarán(es)</div>
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
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
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
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Producto / Concepto</th>
                        <th className="py-2.5 px-3 text-right">Cant. Pedida</th>
                        <th className="py-2.5 px-3 text-right">Cant. Entregada</th>
                        <th className="py-2.5 px-3 text-right">Cant. Facturada</th>
                        <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.order_lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{l.name}</td>
                          <td className="py-2.5 px-3 text-right font-bold">{l.product_uom_qty}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-amber-700">{l.qty_delivered}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{l.qty_invoiced}</td>
                          <td className="py-2.5 px-3 text-right">{formatCOP(l.price_unit)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCOP(l.price_subtotal)}
                          </td>
                        </tr>
                      ))}
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
                      <span>IVA (19%):</span>
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
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado Entrega</th>
                  <th className="py-3 px-4 text-center">Estado Factura</th>
                  <th className="py-3 px-4 text-right">Estado Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
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
