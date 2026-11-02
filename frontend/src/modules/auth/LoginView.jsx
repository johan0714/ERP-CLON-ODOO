import React, { useState } from 'react';
import api from '../../api/client';
import { Building2, ShieldCheck, UserCheck, Lock, Mail, Eye, EyeOff, MapPin, AlertCircle, RefreshCw } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      } else if (err.message && err.message.includes('Network Error')) {
        setError(
          'El servidor en la nube está iniciando (Cold Start de Render). Espera 10-20 segundos y vuelve a pulsar Iniciar Sesión.'
        );
      } else if (err.message) {
        setError(`Error de conexión (${err.message}). Servidor: ${api.defaults.baseURL}`);
      } else {
        setError('Error al iniciar sesión. Verifique sus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-700/25 mb-3.5">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Grupo Soluciones Colombia</h1>
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mt-1">
            Sistema ERP Empresarial
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Acceso unificado Bucaramanga & Barrancabermeja
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-medium flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              {error.includes('Cold Start') && (
                <button
                  type="button"
                  onClick={() => handleLogin(null, email || 'admin@empresa.com', password || 'admin123')}
                  className="mt-2 inline-flex items-center space-x-1 text-xs font-bold text-rose-900 underline hover:no-underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reintentar conexión</span>
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-700/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
          </button>
        </form>

        {/* Quick Profiles for Multi-City Testing */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-3">
            Perfiles Rápidos de Acceso
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Admin Profile */}
            <button
              type="button"
              onClick={() => handleLogin(null, 'admin@empresa.com', 'admin123')}
              className="p-3 border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/40 transition text-left cursor-pointer group"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Administrador</span>
              </div>
              <div className="text-[11px] text-slate-800 font-bold truncate">Pedro Albarracín</div>
              <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate">Bucaramanga</span>
              </div>
            </button>

            {/* Employee Profile */}
            <button
              type="button"
              onClick={() => handleLogin(null, 'empleado@empresa.com', 'empleado123')}
              className="p-3 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/40 transition text-left cursor-pointer group"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 mb-1">
                <UserCheck className="w-4 h-4" />
                <span>Trabajador</span>
              </div>
              <div className="text-[11px] text-slate-800 font-bold truncate">Operaciones & Almacén</div>
              <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">Barrancabermeja</span>
              </div>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              Cloud Server: {api.defaults.baseURL}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
