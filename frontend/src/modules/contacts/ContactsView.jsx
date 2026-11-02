import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import ControlPanel from '../../components/ControlPanel';
import { Mail, Phone, MapPin, Building, User, Check, X } from 'lucide-react';

export default function ContactsView({ subView = 'all', onHome }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    is_company: false,
    email: '',
    phone: '',
    vat: '',
    street: '',
    city: '',
    country: 'Colombia',
    is_customer: true,
    is_supplier: false,
    comment: '',
  });

  useEffect(() => {
    fetchContacts();
  }, [searchTerm, subView]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      let params = {};
      if (searchTerm) params.search = searchTerm;
      if (subView === 'customers') params.is_customer = true;
      if (subView === 'suppliers') params.is_supplier = true;

      const res = await api.get('/contacts/', { params });
      setContacts(res.data);
    } catch (err) {
      console.error('Error fetching contacts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      is_company: false,
      email: '',
      phone: '',
      vat: '',
      street: '',
      city: '',
      country: 'Colombia',
      is_customer: subView !== 'suppliers',
      is_supplier: subView === 'suppliers',
      comment: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingContact(c);
    setFormData({
      name: c.name,
      is_company: c.is_company,
      email: c.email || '',
      phone: c.phone || '',
      vat: c.vat || '',
      street: c.street || '',
      city: c.city || '',
      country: c.country || 'España',
      is_customer: c.is_customer,
      is_supplier: c.is_supplier,
      comment: c.comment || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, formData);
      } else {
        await api.post('/contacts/', formData);
      }
      setModalOpen(false);
      fetchContacts();
    } catch (err) {
      alert('Error al guardar el contacto');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ControlPanel
        onHome={onHome}
        breadcrumbs={[
          { label: 'Contactos' },
          { label: subView === 'customers' ? 'Clientes' : subView === 'suppliers' ? 'Proveedores' : 'Todos' }
        ]}
        onNew={handleOpenNew}
        newButtonLabel="Nuevo Contacto"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 overflow-auto p-5">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando contactos...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No se encontraron contactos. Haz clic en "Nuevo Contacto" para registrar uno.
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {contacts.map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenEdit(c)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {c.is_company ? <Building className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-[#714B67] transition-colors line-clamp-1">
                          {c.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {c.is_company ? 'Empresa' : 'Particular'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {c.email && (
                      <div className="flex items-center space-x-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {(c.city || c.street) && (
                      <div className="flex items-center space-x-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{[c.street, c.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  {c.is_customer && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                      Cliente
                    </span>
                  )}
                  {c.is_supplier && (
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                      Proveedor
                    </span>
                  )}
                  {c.vat && (
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {c.vat}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Ciudad</th>
                  <th className="py-3 px-4">NIF/CIF</th>
                  <th className="py-3 px-4">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleOpenEdit(c)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.phone || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{c.email || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{c.city || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{c.vat || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {c.is_customer && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                            Cliente
                          </span>
                        )}
                        {c.is_supplier && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                            Proveedor
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Contacto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_company}
                    onChange={(e) => setFormData({ ...formData, is_company: e.target.checked })}
                    className="rounded text-[#714B67] focus:ring-[#714B67]"
                  />
                  <span className="text-xs font-semibold text-slate-700">Es Empresa</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_customer}
                    onChange={(e) => setFormData({ ...formData, is_customer: e.target.checked })}
                    className="rounded text-[#714B67] focus:ring-[#714B67]"
                  />
                  <span className="text-xs font-semibold text-slate-700">Cliente</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_supplier}
                    onChange={(e) => setFormData({ ...formData, is_supplier: e.target.checked })}
                    className="rounded text-[#714B67] focus:ring-[#714B67]"
                  />
                  <span className="text-xs font-semibold text-slate-700">Proveedor</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuciones del Norte S.A."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+34 600..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NIF / CIF / Tax ID</label>
                  <input
                    type="text"
                    placeholder="B12345678"
                    value={formData.vat}
                    onChange={(e) => setFormData({ ...formData, vat: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Madrid"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección (Calle, Número)</label>
                <input
                  type="text"
                  placeholder="Calle Principal 123"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#714B67] hover:bg-[#5b3c53] text-white font-medium cursor-pointer shadow-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
