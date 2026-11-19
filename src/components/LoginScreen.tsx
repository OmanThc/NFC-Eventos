import React, { useState } from 'react';
import {
  Building2,
  Radio,
  Plus,
  ArrowRight,
  ShieldAlert,
  Store,
  DollarSign,
  Lock,
  Sparkles,
  X,
  Cloud,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs } from '../utils/formatters';

const LOGO_EMOJIS = ['🍔', '🍺', '🏖️', '🎪', '🍕', '☕', '🍩', '🎟️', '🍣', '🥩', '🍹'];

export const LoginScreen: React.FC = () => {
  const {
    firebaseUser,
    isCloudSynced,
    isCloudLoading,
    authError,
    signInWithGoogle,
    signOutGoogle,
    companies,
    loginCompany,
    registerCompany,
    masterSettings,
    setShowSuperAdminModal,
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newAdminPin, setNewAdminPin] = useState<string>('');
  const [newCajaPin, setNewCajaPin] = useState<string>('');
  const [newEmoji, setNewEmoji] = useState<string>('🎪');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newBcv, setNewBcv] = useState<string>('52.40');

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const bcvVal = parseFloat(newBcv) || 52.4;
    registerCompany(
      newName.trim(),
      newAdminPin.trim() || '1234',
      newCajaPin.trim() || '1111',
      newEmoji,
      newDesc.trim(),
      bcvVal
    );
    setShowCreateModal(false);
    setNewName('');
    setNewAdminPin('');
    setNewCajaPin('');
    setNewDesc('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Banner text */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-white flex items-center gap-2">
                <span>PaySticker NFC</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Multi-Empresa
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {masterSettings.homeBannerText}
              </p>
            </div>
          </div>

          {/* Right actions: Firebase Google Auth + Register Company + Super Admin Access */}
          <div className="flex flex-wrap items-center gap-2">
            {isCloudSynced && firebaseUser ? (
              <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-emerald-300 hidden md:inline max-w-[160px] truncate">
                  {firebaseUser.email}
                </span>
                <span className="font-bold text-emerald-300 md:hidden">Firebase</span>
                <button
                  onClick={signOutGoogle}
                  className="text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  title="Desconectar cuenta Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-blue-500/30 transition active:scale-95 cursor-pointer"
              >
                <Cloud className="w-4 h-4 text-blue-400" />
                <span>Conectar Firebase</span>
              </button>
            )}

            {masterSettings.allowPublicCompanyRegistration && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Nueva Empresa</span>
              </button>
            )}

            {/* Admin Supremo Trigger */}
            <button
              onClick={() => setShowSuperAdminModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              title="Panel de Control Maestro del Administrador Supremo"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Supremo</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content: Hero & Company Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 sm:py-12 flex-1">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{masterSettings.homeSubtitle}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {masterSettings.homeTitle}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
            {masterSettings.homeHeroDescription}
          </p>

          {authError && (
            <p className="mt-4 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 px-4 py-2 rounded-xl inline-block">
              {authError}
            </p>
          )}
        </div>

        {isCloudLoading && (
          <div className="flex items-center justify-center gap-2 text-xs text-blue-300 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sincronizando empresas con Firebase Firestore...</span>
          </div>
        )}

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {companies.map(company => {
            const totalBalance = company.stickers.reduce((s, st) => s + st.balance, 0);
            return (
              <div
                key={company.id}
                className="bg-slate-900/90 hover:bg-slate-850 rounded-3xl p-6 border border-slate-800 hover:border-blue-500/50 shadow-xl transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent Top Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 opacity-80"
                  style={{ backgroundColor: company.settings.primaryColor }}
                />

                <div>
                  {/* Header info (NO PIN DISPLAYED AT ALL) */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-13 h-13 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition">
                        {company.logoEmoji || '🏢'}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white group-hover:text-blue-400 transition leading-snug">
                          {company.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Tasa BCV: <strong className="text-emerald-400 font-mono">{formatBs(company.settings.bcvRate)}</strong>
                        </span>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 shrink-0 flex items-center gap-1"
                      title="Acceso protegido"
                    >
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>Protegido</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-5">
                    {company.description || 'Ambiente cashless con control de caja y stands.'}
                  </p>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 mb-6 text-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Stickers
                      </span>
                      <span className="text-sm font-black text-white font-mono">
                        {company.stickers.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Productos
                      </span>
                      <span className="text-sm font-black text-white font-mono">
                        {company.products.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Flotante
                      </span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {formatUSD(totalBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Login button */}
                <button
                  onClick={() => loginCompany(company.id)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition active:scale-[0.99] cursor-pointer"
                >
                  <span>Entrar a esta Empresa</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
              </div>
            );
          })}

          {/* New Company Dashed Card */}
          {masterSettings.allowPublicCompanyRegistration && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-3xl p-8 border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/30 hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center text-center cursor-pointer group min-h-[280px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-blue-600 text-slate-300 group-hover:text-white flex items-center justify-center mb-4 transition shadow-inner">
                <Plus className="w-7 h-7" />
              </div>
              <h3 className="font-black text-base text-white group-hover:text-blue-400 transition">
                Registrar Nueva Empresa
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                Crea un ambiente cashless independiente con sus propios PINs de Caja, Proveedores y Administrador.
              </p>
            </button>
          )}
        </div>

        {/* Benefits bar */}
        <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-slate-300 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Caja con PIN Independiente</h4>
              <p className="text-slate-400 mt-0.5">
                Calculadora BCV y recarga de stickers NTAG215 protegida con clave numérica de Caja.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Stands por Marca con PIN</h4>
              <p className="text-slate-400 mt-0.5">
                Registra cada marca con sus productos y PIN privado para cobrar mediante lectura NFC.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Supervisión Admin Supremo</h4>
              <p className="text-slate-400 mt-0.5">
                Acceso centralizado en Firebase para auditar todas las ventas y personalizar la plataforma.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        PaySticker NFC Multi-Tenant • Firebase Firestore Cloud • Supervisión Administrador Supremo.
      </footer>

      {/* Modal: Create Company */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-800 text-left relative text-white my-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Registrar Nueva Empresa
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Crea una nueva organización con su propio ecosistema cashless y claves privadas.
            </p>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre de la Empresa o Evento *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  placeholder="Ej. Feria Gourmet Los Palos Grandes"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN Admin *</span>
                  </label>
                  <input
                    type="password"
                    minLength={4}
                    maxLength={8}
                    required
                    placeholder="••••"
                    value={newAdminPin}
                    onChange={e => setNewAdminPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-white font-mono tracking-widest focus:outline-none focus:ring-2 ring-blue-500 text-center"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    4 a 8 dígitos
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PIN Caja *</span>
                  </label>
                  <input
                    type="password"
                    minLength={4}
                    maxLength={8}
                    required
                    placeholder="••••"
                    value={newCajaPin}
                    onChange={e => setNewCajaPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-white font-mono tracking-widest focus:outline-none focus:ring-2 ring-blue-500 text-center"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    4 a 8 dígitos
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tasa Oficial BCV ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="52.40"
                  value={newBcv}
                  onChange={e => setNewBcv(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-black text-emerald-400 font-mono focus:outline-none focus:ring-2 ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Logo / Emoji Representativo
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800 rounded-xl border border-slate-700">
                  {LOGO_EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewEmoji(em)}
                      className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition cursor-pointer ${
                        newEmoji === em ? 'bg-blue-600 scale-110 shadow-sm' : 'hover:bg-slate-700'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Detalles sobre el evento o negocio..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  Crear Empresa e Iniciar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
