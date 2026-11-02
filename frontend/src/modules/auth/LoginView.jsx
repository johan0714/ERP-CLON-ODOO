import React, { useState } from 'react';
import api from '../../api/client';
import { Layers, ShieldCheck, UserCheck, Lock, Mail, Globe, MapPin } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e, quickEmail = null, quickPass = null) => {
    if (e) e.preventDefault();
    const loginEmail = quickEmail || email;
    const loginPassword = quickPass || password;

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });

      localStorage.setItem('erp_token', res.data.access_token);
      localStorage.setItem('erp_user', JSON.stringify(res.data.user));
      onLoginSuccess(res.data.user);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(`No se pudo conectar con el backend (${err.message}). Verifica que el servicio esté activo en: ${api.defaults.baseURL}`);
      } else {
        setError('Error al iniciar sesión. Revisa correo y clave.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#714B67]/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#714B67] text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-3">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ERP Cloud Connect</h1>
          <p className="text-xs text-slate-500 mt-1">
            Acceso unificado inter-ciudades para Administradores y Empleados
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#714B67] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#714B67] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#714B67] hover:bg-[#5b3c53] text-white rounded-xl font-bold text-sm shadow-md transition active:scale-98 cursor-pointer"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Quick Profiles for Multi-City Testing */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-3">
            Perfiles Rápidos de Prueba Remota
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Admin Profile */}
            <button
              type="button"
              onClick={() => handleLogin(null, 'admin@empresa.com', 'admin123')}
              className="p-3 border border-slate-200 rounded-xl hover:border-[#714B67] hover:bg-slate-50 transition text-left cursor-pointer group"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#714B67] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Administrador</span>
              </div>
              <div className="text-[11px] text-slate-700 font-semibold truncate">Pedro Albarracín</div>
              <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span>Bucaramanga (Sede Principal)</span>
              </div>
            </button>

            {/* Employee Profile */}
            <button
              type="button"
              onClick={() => handleLogin(null, 'empleado@empresa.com', 'empleado123')}
              className="p-3 border border-slate-200 rounded-xl hover:border-emerald-600 hover:bg-emerald-50/50 transition text-left cursor-pointer group"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 mb-1">
                <UserCheck className="w-4 h-4" />
                <span>Trabajador</span>
              </div>
              <div className="text-[11px] text-slate-700 font-semibold truncate">Operaciones & Almacén</div>
              <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>El Centro, Barrancabermeja</span>
              </div>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              API Backend: {api.defaults.baseURL}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
