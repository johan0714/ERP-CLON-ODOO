import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ControlPanel from '../../components/ControlPanel';
import { formatCOP } from '../../utils/format';
import { getPresentationBadge } from '../inventory/InventoryView';
import {
  Receipt,
  CheckCircle,
  CreditCard,
  ArrowLeft,
  X,
  DollarSign,
  Calendar,
  ShieldCheck,
  Send,
  ExternalLink,
  Copy,
  Check,
  Settings,
  FileCode,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';

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

  // DIAN / Factus Modal State
  const [dianModalOpen, setDianModalOpen] = useState(false);
  const [dianConfig, setDianConfig] = useState({
    provider: 'factus',
    is_sandbox: true,
    client_id: '',
    client_secret: '',
    token: '',
    company_nit: '901.458.921-3',
    company_name: 'Grupo Soluciones Colombia S.A.S.',
  });
  const [testingDian, setTestingDian] = useState(false);
  const [dianTestResult, setDianTestResult] = useState(null);
  const [emittingDian, setEmittingDian] = useState(false);
  const [copiedCufe, setCopiedCufe] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchDianConfig();
  }, []);

  const fetchDianConfig = async () => {
    try {
      const res = await api.get('/invoicing/dian/config');
      if (res.data) setDianConfig(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDianConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/invoicing/dian/config', dianConfig);
      setDianConfig(res.data);
      alert('Configuración de Facturación Electrónica DIAN / Factus guardada correctamente');
    } catch (err) {
      alert('Error al guardar configuración: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleTestDianConnection = async () => {
    try {
      setTestingDian(true);
      setDianTestResult(null);
      const res = await api.post('/invoicing/dian/test-connection');
      setDianTestResult(res.data);
    } catch (err) {
      setDianTestResult({ success: false, message: err.response?.data?.detail || err.message });
    } finally {
      setTestingDian(false);
    }
  };

  const handleEmitDian = async (invId) => {
    try {
      setEmittingDian(true);
      const res = await api.post(`/invoicing/${invId}/emit-dian`);
      const updated = await api.get(`/invoicing/${invId}`);
      setSelectedInvoice(updated.data);
      fetchInvoices();
      alert(`¡Factura electrónica emitida exitosamente a la DIAN!\nConsecutivo: ${res.data.dian_number}\nCUFE: ${res.data.cufe?.substring(0, 32)}...`);
    } catch (err) {
      alert('Error al emitir factura electrónica a la DIAN: ' + (err.response?.data?.detail || err.message));
    } finally {
      setEmittingDian(false);
    }
  };

  const handleCopyCufe = (cufe) => {
    navigator.clipboard.writeText(cufe);
    setCopiedCufe(true);
    setTimeout(() => setCopiedCufe(false), 2000);
  };

  const handleDeleteInvoice = async (invId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta factura? Si proviene de un pedido de venta, su estado de facturación se restablecerá automáticamente.')) {
      return;
    }
    try {
      await api.delete(`/invoicing/${invId}`);
      if (selectedInvoice && selectedInvoice.id === invId) {
        setSelectedInvoice(null);
      }
      fetchInvoices();
      alert('Factura eliminada con éxito');
    } catch (err) {
      alert('Error al eliminar la factura: ' + (err.response?.data?.detail || err.message));
    }
  };

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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDianModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Configurar credenciales de Facturación Electrónica DIAN / Factus"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Configuración DIAN (Factus)</span>
            </button>

            {selectedInvoice && (
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al listado</span>
              </button>
            )}
          </div>
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

                {selectedInvoice.state === 'posted' && !selectedInvoice.dian_stamp && (
                  <button
                    onClick={() => handleEmitDian(selectedInvoice.id)}
                    disabled={emittingDian}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer uppercase tracking-wider flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{emittingDian ? 'Transmitiendo a DIAN...' : 'Emitir Factura a la DIAN'}</span>
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

                <button
                  type="button"
                  onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
                  title="Eliminar esta factura permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Factura</span>
                </button>
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

              {/* Banner / Tarjeta de Certificación DIAN */}
              {selectedInvoice.dian_stamp && (
                <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="font-extrabold text-emerald-950 text-sm">
                        Factura Electrónica Validada y Aceptada por la DIAN
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 font-mono">
                        {selectedInvoice.dian_stamp.dian_number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-mono flex items-center space-x-2">
                      <span className="font-bold text-slate-800">CUFE:</span>
                      <span className="truncate max-w-[280px] sm:max-w-md bg-white/80 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {selectedInvoice.dian_stamp.cufe}
                      </span>
                      <button
                        onClick={() => handleCopyCufe(selectedInvoice.dian_stamp.cufe)}
                        className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                        title="Copiar CUFE completo"
                      >
                        {copiedCufe ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {selectedInvoice.dian_stamp.pdf_url && (
                      <a
                        href={selectedInvoice.dian_stamp.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-emerald-800 text-xs font-bold hover:bg-emerald-100/50 shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver en DIAN</span>
                      </a>
                    )}
                    <a
                      href={`${api.defaults.baseURL}/invoicing/${selectedInvoice.id}/dian-xml`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-2xs"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      <span>XML UBL 2.1</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Cabecera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
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
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Concepto / Producto</th>
                        <th className="py-2.5 px-2 text-center w-28">Presentación</th>
                        <th className="py-2.5 px-3 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                        <th className="py-2.5 px-3 text-right">IVA</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.invoice_lines?.map((il) => (
                        <tr key={il.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{il.name}</td>
                          <td className="py-2.5 px-2 text-center">
                            {(() => {
                              const badge = getPresentationBadge(il.uom_name || il.product?.uom_name);
                              return (
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${badge.color}`}>
                                  <span>{badge.icon}</span>
                                  <span>{il.uom_name || badge.label}</span>
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">{il.quantity}</td>
                          <td className="py-2.5 px-3 text-right">{formatCOP(il.price_unit)}</td>
                          <td className="py-2.5 px-3 text-right">
                            {il.tax_percent === 0 ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                0% Exento
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-600">{il.tax_percent}%</span>
                            )}
                          </td>
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
                      <span>IVA / Impuestos:</span>
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
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                    <table className="w-full min-w-[500px] text-left text-xs">
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
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Origen</th>
                  <th className="py-3 px-4 text-center">Estado DIAN</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Pendiente</th>
                  <th className="py-3 px-4 text-center">Estado Pago</th>
                  <th className="py-3 px-4 text-right">Estado</th>
                  <th className="py-3 px-4 text-center w-14">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400">
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
                      <td className="py-3 px-4 text-center">
                        {inv.dian_stamp?.status === 'accepted' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Aceptada DIAN</span>
                          </span>
                        ) : inv.state === 'posted' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <span>Lista p/ DIAN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                            <span>Borrador</span>
                          </span>
                        )}
                      </td>
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
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Eliminar factura permanentemente"
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

      {/* Modal Registrar Pago */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 border border-slate-100">
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

      {/* MODAL CONFIGURACIÓN FACTURACIÓN ELECTRÓNICA DIAN (FACTUS) */}
      {dianModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Facturación Electrónica DIAN</h3>
                  <p className="text-xs text-slate-500 font-medium">Proveedor de API Mayorista: Factus Colombia</p>
                </div>
              </div>
              <button
                onClick={() => setDianModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDianConfig} className="space-y-4 text-xs">
              {/* Entorno */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  Ambiente de Operación DIAN
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDianConfig({ ...dianConfig, is_sandbox: true })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center cursor-pointer transition ${
                      dianConfig.is_sandbox
                        ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-2 ring-blue-600/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🛠️ Modo Pruebas (Sandbox)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDianConfig({ ...dianConfig, is_sandbox: false })}
                    className={`py-2 px-3 rounded-xl border font-bold text-center cursor-pointer transition ${
                      !dianConfig.is_sandbox
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏛️ Producción Oficial DIAN
                  </button>
                </div>
              </div>

              {/* Razón social & NIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIT Emisor</label>
                  <input
                    type="text"
                    value={dianConfig.company_nit || ''}
                    onChange={(e) => setDianConfig({ ...dianConfig, company_nit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:ring-1 focus:ring-blue-600"
                    placeholder="901.458.921-3"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={dianConfig.company_name || ''}
                    onChange={(e) => setDianConfig({ ...dianConfig, company_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-1 focus:ring-blue-600"
                    placeholder="Grupo Soluciones Colombia"
                  />
                </div>
              </div>

              {/* Credenciales de Factus */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  Credenciales de API (Factus)
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Client ID</label>
                    <input
                      type="text"
                      value={dianConfig.client_id || ''}
                      onChange={(e) => setDianConfig({ ...dianConfig, client_id: e.target.value })}
                      placeholder="Pega aquí el Client ID de Factus"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Client Secret</label>
                    <input
                      type="password"
                      value={dianConfig.client_secret || ''}
                      onChange={(e) => setDianConfig({ ...dianConfig, client_secret: e.target.value })}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Token de Acceso Permanente (Opcional)</label>
                    <textarea
                      rows="2"
                      value={dianConfig.token || ''}
                      onChange={(e) => setDianConfig({ ...dianConfig, token: e.target.value })}
                      placeholder="Bearer Token de Factus (si fue generado manualmente)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] focus:bg-white focus:ring-1 focus:ring-blue-600"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Resultado de prueba */}
              {dianTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium flex items-start space-x-2 ${
                    dianTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{dianTestResult.success ? 'Conexión Exitosa' : 'Aviso de Conexión'}</p>
                    <p className="mt-0.5 text-[11px]">{dianTestResult.message}</p>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestDianConnection}
                  disabled={testingDian}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  {testingDian && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{testingDian ? 'Verificando...' : 'Probar Conexión'}</span>
                </button>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setDianModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer shadow-md shadow-blue-700/20 transition active:scale-95"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
