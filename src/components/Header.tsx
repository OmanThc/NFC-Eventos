import React from 'react';
import {
  CircleDollarSign,
  Store,
  Sliders,
  Volume2,
  VolumeX,
  CreditCard,
  TrendingUp,
  Sparkles,
  LogOut,
  Lock,
  Unlock,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs } from '../utils/formatters';

export const Header: React.FC = () => {
  const {
    isCloudSynced,
    currentCompany,
    logoutCompany,
    settings,
    updateSettings,
    activeTab,
    requestNavigateTab,
    isCajaUnlocked,
    activeProvider,
    isAdminUnlocked,
    lockAdmin,
    stickers,
    toggleStickersDrawer,
  } = useApp();

  return (
    <header className="bg-app-primary text-white shadow-md sticky top-0 z-30 transition-colors duration-300">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity & Company Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/25 text-2xl">
            {currentCompany?.logoEmoji || '🏢'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                <span>{currentCompany?.name || settings.appName}</span>
              </h1>
              <span
                className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isCloudSynced
                    ? 'bg-emerald-500/25 text-emerald-100 border-emerald-400/40'
                    : 'bg-black/25 text-white/80 border-white/15'
                }`}
                title={isCloudSynced ? 'Sincronizado con Firebase Firestore' : 'Modo local (sin sesión Google)'}
              >
                {isCloudSynced ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                <span>{isCloudSynced ? 'Firebase Sync' : 'Local'}</span>
              </span>
            </div>
            <p className="text-[11px] text-white/80 font-medium">
              {settings.subtitle}
            </p>
          </div>
        </div>

        {/* Action Controls, BCV Live Badge & Switch Company */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Tasa BCV Badge */}
          <div className="bg-black/25 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/20 shadow-xs backdrop-blur-xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300 hidden sm:block" />
            <span className="text-[10px] uppercase tracking-wider text-white/80 font-bold">
              BCV:
            </span>
            <span className="font-extrabold text-xs sm:text-sm text-emerald-300 font-mono">
              {formatBs(settings.bcvRate)}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => updateSettings({ enableSound: !settings.enableSound })}
            title={settings.enableSound ? 'Silenciar Sonidos POS' : 'Activar Sonidos POS'}
            className="w-8 h-8 rounded-xl bg-black/20 hover:bg-black/30 border border-white/20 flex items-center justify-center text-white/90 hover:text-white transition active:scale-95 cursor-pointer"
          >
            {settings.enableSound ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-rose-300" />
            )}
          </button>

          {/* Stickers NFC Drawer Trigger */}
          <button
            onClick={toggleStickersDrawer}
            className="bg-white text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition active:scale-95 hover:shadow-lg cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <CreditCard className="w-3.5 h-3.5 text-slate-700" />
            <span>NFC ({stickers.length})</span>
          </button>

          {/* Logout / Switch Company button */}
          <button
            onClick={logoutCompany}
            title="Cerrar sesión y volver al selector de empresas"
            className="px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-rose-600 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cambiar Empresa</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation (3 PIN-Protected Modules) */}
      <nav className="bg-black/20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 grid grid-cols-3 gap-1.5 py-1.5">
          {/* Tab 1: Caja */}
          <button
            onClick={() => requestNavigateTab('caja')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'caja'
                ? 'bg-white text-slate-900 shadow-md scale-[1.01]'
                : 'text-white/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <CircleDollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'caja' ? 'text-blue-600' : ''}`} />
            <span className="tracking-tight">1. CAJA</span>
            {isCajaUnlocked ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold flex items-center">
                <Unlock className="w-2.5 h-2.5" />
              </span>
            ) : (
              <span className="text-[10px] bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded-full font-bold flex items-center">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </button>

          {/* Tab 2: Proveedores */}
          <button
            onClick={() => requestNavigateTab('proveedores')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'proveedores'
                ? 'bg-white text-slate-900 shadow-md scale-[1.01]'
                : 'text-white/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Store className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'proveedores' ? 'text-emerald-600' : ''}`} />
            <span className="tracking-tight">2. PROVEEDORES</span>
            {activeProvider ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold flex items-center">
                <Unlock className="w-2.5 h-2.5" />
              </span>
            ) : (
              <span className="text-[10px] bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded-full font-bold flex items-center">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </button>

          {/* Tab 3: Admin */}
          <button
            onClick={() => requestNavigateTab('admin')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-md scale-[1.01]'
                : 'text-white/85 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sliders className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'admin' ? 'text-purple-600' : ''}`} />
            <span className="tracking-tight">3. ADMIN</span>
            {isAdminUnlocked ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold flex items-center">
                <Unlock className="w-2.5 h-2.5" />
              </span>
            ) : (
              <span className="text-[10px] bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded-full font-bold flex items-center">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Quick Sticker Ticker Bar */}
      <div className="bg-slate-950/90 text-slate-200 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              EMPRESA: {currentCompany?.name.toUpperCase()}
            </span>
            <span className="text-slate-400 hidden md:inline">
              Caja, Proveedores y Admin protegidos con PIN independiente
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAdminUnlocked && activeTab === 'admin' && (
              <button
                onClick={lockAdmin}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 cursor-pointer"
                title="Bloquear Administrador para proteger la terminal"
              >
                <Lock className="w-3 h-3" />
                <span>Bloquear Admin</span>
              </button>
            )}

            <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
              {stickers.map(s => (
                <button
                  key={s.id}
                  onClick={toggleStickersDrawer}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] whitespace-nowrap cursor-pointer transition"
                  title={`Ver sticker de ${s.owner} (${formatBs(s.balance * settings.bcvRate)})`}
                >
                  <span className="font-bold text-slate-300">{s.owner.split(' ')[0]}:</span>
                  <span className={`font-mono font-black ${s.balance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatUSD(s.balance)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
