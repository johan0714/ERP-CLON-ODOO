import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ControlPanel from '../../components/ControlPanel';
import { formatCOP } from '../../utils/format';
import { Receipt, CheckCircle, CreditCard, ArrowLeft, X, DollarSign, Calendar } from 'lucide-react';

export default function InvoicingView({ defaultInvoiceId = null, onHome }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'transfer',
    memo: '',
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (defaultInvoiceId) {
      handleSelectInvoice(defaultInvoiceId);
    }
  }, [defaultInvoiceId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoicing/');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInvoice = async (invId) => {
    try {
      const res = await api.get(`/invoicing/${invId}`);
      setSelectedInvoice(res.data);
    } catch (err) {
      alert('Error al cargar la factura');
    }
  };

  const handlePostInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      const res = await api.post(`/invoicing/${selectedInvoice.id}/post`);
      setSelectedInvoice(res.data);
      fetchInvoices();
    } catch (err) {
      alert('Error al publicar la factura: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleOpenPaymentModal = () => {
    if (!selectedInvoice) return;
    setPaymentForm({
      amount: selectedInvoice.amount_residual,
      payment_method: 'transfer',
      memo: `Cobro de ${selectedInvoice.name}`,
    });
    setPaymentModalOpen(true);
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post(`/invoicing/${selectedInvoice.id}/payments`, paymentForm);
      setPaymentModalOpen(false);
      const updated = await api.get(`/invoicing/${selectedInvoice.id}`);
      setSelectedInvoice(updated.data);
      fetchInvoices();
    } catch (err) {
      alert('Error al registrar el pago: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ControlPanel
        onHome={onHome}
        breadcrumbs={
          selectedInvoice
            ? [{ label: 'Facturación', onClick: () => setSelectedInvoice(null) }, { label: selectedInvoice.name }]
            : [{ label: 'Facturación' }, { label: 'Facturas de Cliente' }]
        }
        searchTerm={!selectedInvoice ? searchTerm : undefined}
        onSearchChange={!selectedInvoice ? setSearchTerm : undefined}
        showViewSwitcher={false}
        extraButtons={
          selectedInvoice && (
            <button
              onClick={() => setSelectedInvoice(null)}
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al listado</span>
            </button>
          )
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {selectedInvoice ? (
          /* FORMULARIO FACTURA ESTILO ODOO */
          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
            {/* Action Bar & Stepper */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {selectedInvoice.state === 'draft' && (
                  <button
                    onClick={handlePostInvoice}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    Publicar Factura
                  </button>
                )}

                {selectedInvoice.state === 'posted' && selectedInvoice.payment_state !== 'paid' && (
                  <button
                    onClick={handleOpenPaymentModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider flex items-center space-x-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Registrar Pago</span>
                  </button>
                )}
              </div>

              {/* Status Stepper */}
              <div className="flex items-center text-xs font-bold rounded-lg border border-slate-200 overflow-hidden bg-white">
                <div
                  className={`px-3 py-1.5 ${
                    selectedInvoice.state === 'draft' ? 'bg-blue-700 text-white' : 'text-slate-400 bg-slate-50'
                  }`}
                >
                  Borrador
                </div>
                <div
                  className={`px-3 py-1.5 border-l border-slate-200 ${
                    selectedInvoice.state === 'posted' && selectedInvoice.payment_state !== 'paid'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-400 bg-slate-50'
                  }`}
                >
                  Publicado
                </div>
                <div
                  className={`px-3 py-1.5 border-l border-slate-200 ${
                    selectedInvoice.payment_state === 'paid'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 bg-slate-50'
                  }`}
                >
                  Pagado
                </div>
              </div>
            </div>

            {/* Hoja de Factura */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold text-slate-400">Factura de Cliente</span>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedInvoice.name}</h1>
                </div>

                {/* Ribbon de Pago Pagado */}
                {selectedInvoice.payment_state === 'paid' && (
                  <div className="border-2 border-emerald-500 bg-emerald-50 text-emerald-700 px-4 py-1 rounded-xl font-black text-sm uppercase tracking-widest shadow-xs">
                    ✓ TOTALMENTE PAGADA
                  </div>
                )}
              </div>

              {/* Cabecera */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Cliente</span>
                  <div className="font-bold text-slate-900 text-base">{selectedInvoice.partner?.name}</div>
                  <div className="text-xs text-slate-500">{selectedInvoice.partner?.vat || 'Sin NIF'}</div>
                  <div className="text-xs text-slate-500">{selectedInvoice.partner?.email}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Fechas & Origen</span>
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold">Fecha Factura:</span> {selectedInvoice.invoice_date}
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    <span className="font-semibold">Documento Origen:</span>{' '}
                    <span className="font-bold text-indigo-700">{selectedInvoice.invoice_origin || '-'}</span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    <span className="font-semibold">Estado de Pago:</span>{' '}
                    <span
                      className={`font-bold uppercase ${
                        selectedInvoice.payment_state === 'paid'
                          ? 'text-emerald-700'
                          : selectedInvoice.payment_state === 'partial'
                          ? 'text-amber-700'
                          : 'text-red-600'
                      }`}
                    >
                      {selectedInvoice.payment_state === 'paid'
                        ? 'Pagado'
                        : selectedInvoice.payment_state === 'partial'
                        ? 'Pago Parcial'
                        : 'No Pagado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Líneas de Factura */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Líneas de Factura</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Concepto / Producto</th>
                        <th className="py-2.5 px-3 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 text-right">IVA (%)</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.invoice_lines?.map((il) => (
                        <tr key={il.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{il.name}</td>
                          <td className="py-2.5 px-3 text-right font-bold">{il.quantity}</td>
                          <td className="py-2.5 px-3 text-right">{formatCOP(il.price_unit)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500">{il.tax_percent}%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatCOP(il.price_subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotales y Pendiente */}
                <div className="flex justify-end mt-4">
                  <div className="w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Imponible:</span>
                      <span className="font-semibold">{formatCOP(selectedInvoice.amount_untaxed)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IVA (19%):</span>
                      <span className="font-semibold">{formatCOP(selectedInvoice.amount_tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Factura:</span>
                      <span className="text-blue-700">{formatCOP(selectedInvoice.amount_total)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-red-600 pt-1">
                      <span>Importe Pendiente:</span>
                      <span>{formatCOP(selectedInvoice.amount_residual)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registro de Pagos Realizados */}
              {selectedInvoice.payments?.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Historial de Pagos y Cobros</h4>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                        <tr>
                          <th className="py-2 px-3">Recibo</th>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3">Método</th>
                          <th className="py-2 px-3">Nota</th>
                          <th className="py-2 px-3 text-right">Importe Pagado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{p.name}</td>
                            <td className="py-2 px-3 text-slate-600">{p.payment_date}</td>
                            <td className="py-2 px-3 capitalize text-slate-600">{p.payment_method}</td>
                            <td className="py-2 px-3 text-slate-500">{p.memo || '-'}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              {formatCOP(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VISTA LISTA FACTURAS */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Origen</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Pendiente</th>
                  <th className="py-3 px-4 text-center">Estado Pago</th>
                  <th className="py-3 px-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No hay facturas registradas. Puedes generarlas desde pedidos de venta confirmados.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => handleSelectInvoice(inv.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{inv.name}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{inv.partner?.name}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{inv.invoice_date}</td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-700">{inv.invoice_origin || '-'}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatCOP(inv.amount_total)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">
                        {formatCOP(inv.amount_residual)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            inv.payment_state === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.payment_state === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {inv.payment_state === 'paid'
                            ? 'Pagada'
                            : inv.payment_state === 'partial'
                            ? 'Parcial'
                            : 'No Pagada'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            inv.state === 'posted' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.state === 'posted' ? 'Publicada' : 'Borrador'}
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

      {/* Modal Registrar Pago */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="text-lg font-bold text-slate-800">Registrar Pago</h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Importe a Cobrar (COP $) *</label>
                <input
                  type="number"
                  step="1"
                  max={selectedInvoice?.amount_residual}
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-bold text-lg text-slate-900 focus:ring-1 focus:ring-blue-600"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Máximo pendiente: {formatCOP(selectedInvoice?.amount_residual)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Método de Pago</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-600"
                >
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="cash">Efectivo / Caja</option>
                  <option value="card">Tarjeta de Crédito / TPV</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nota / Referencia</label>
                <input
                  type="text"
                  value={paymentForm.memo}
                  onChange={(e) => setPaymentForm({ ...paymentForm, memo: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
