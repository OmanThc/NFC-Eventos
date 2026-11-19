import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Edit3, 
  Building2, 
  Receipt, 
  KeyRound, 
  DollarSign, 
  TrendingUp, 
  Store, 
  Wallet, 
  Layers, 
  Save, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  Search, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  PieChart
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs, formatDateTime } from '../utils/formatters';
import { calculateGlobalProviderStats, exportProvidersCSV } from '../utils/providerStats';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    masterSettings, 
    updateMasterSettings, 
    logoutSuperAdmin, 
    companies, 
    allGlobalTransactions, 
    exportGlobalTransactionsCSV, 
    updateCompanyPinByMaster, 
    updateCompanyCajaPinByMaster,
    updateProviderPinByMaster,
    deleteCompany, 
    enterCompanyAsSuperAdmin, 
    resetCurrentCompanyData 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'TEXTS' | 'COMPANIES' | 'TRANSACTIONS' | 'PROVIDERS' | 'SECURITY'>('TEXTS');

  // Form state for Home screen texts
  const [homeTitle, setHomeTitle] = useState(masterSettings.homeTitle);
  const [homeSubtitle, setHomeSubtitle] = useState(masterSettings.homeSubtitle);
  const [homeDesc, setHomeDesc] = useState(masterSettings.homeHeroDescription);
  const [homeBanner, setHomeBanner] = useState(masterSettings.homeBannerText);
  const [allowPublicReg, setAllowPublicReg] = useState(masterSettings.allowPublicCompanyRegistration);
  const [textsSaved, setTextsSaved] = useState(false);

  // Form state for Master PIN
  const [newMasterPin, setNewMasterPin] = useState('');
  const [masterPinSaved, setMasterPinSaved] = useState(false);

  // Search in global transactions
  const [txSearch, setTxSearch] = useState('');
  const [txFilterCompany, setTxFilterCompany] = useState('ALL');

  // Provider stats across all companies
  const [providerFilterCompany, setProviderFilterCompany] = useState('ALL');
  const [providerSearch, setProviderSearch] = useState('');
  const [expandedGlobalProvider, setExpandedGlobalProvider] = useState<string | null>(null);
  const [editingProviderKey, setEditingProviderKey] = useState<string | null>(null);
  const [editingProviderPinVal, setEditingProviderPinVal] = useState<string>('');

  const globalProviderStats = useMemo(() => {
    return calculateGlobalProviderStats(companies);
  }, [companies]);

  const filteredProviderStats = useMemo(() => {
    return globalProviderStats.filter(p => {
      const matchesCompany = providerFilterCompany === 'ALL' || p.companyId === providerFilterCompany;
      const matchesSearch = providerSearch.trim() === '' || 
        p.name.toLowerCase().includes(providerSearch.toLowerCase()) || 
        (p.companyName || '').toLowerCase().includes(providerSearch.toLowerCase());
      return matchesCompany && matchesSearch;
    });
  }, [globalProviderStats, providerFilterCompany, providerSearch]);

  // Calculate Global KPIs across all companies
  const globalRecargadoUSD = allGlobalTransactions
    .filter(t => t.type === 'RECARGA')
    .reduce((sum, t) => sum + t.usd, 0);

  const globalRecargadoBs = allGlobalTransactions
    .filter(t => t.type === 'RECARGA')
    .reduce((sum, t) => sum + t.bs, 0);

  const globalConsumidoUSD = allGlobalTransactions
    .filter(t => t.type === 'CONSUMO')
    .reduce((sum, t) => sum + t.usd, 0);

  const globalSaldoFlotanteUSD = companies.reduce((sum, comp) => {
    return sum + comp.stickers.reduce((stSum, st) => stSum + st.balance, 0);
  }, 0);

  const globalTotalStickers = companies.reduce((sum, comp) => sum + comp.stickers.length, 0);

  const handleSaveTexts = (e: React.FormEvent) => {
    e.preventDefault();
    updateMasterSettings({
      homeTitle,
      homeSubtitle,
      homeHeroDescription: homeDesc,
      homeBannerText: homeBanner,
      allowPublicCompanyRegistration: allowPublicReg,
    });
    setTextsSaved(true);
    setTimeout(() => setTextsSaved(false), 2500);
  };

  const handleSaveMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newMasterPin.trim();
    if (cleaned.length >= 4) {
      updateMasterSettings({ masterPin: cleaned });
      setNewMasterPin('');
      setMasterPinSaved(true);
      setTimeout(() => setMasterPinSaved(false), 2500);
    }
  };

  // Filter global transactions
  const filteredGlobalTx = allGlobalTransactions.filter(tx => {
    const matchesCompany = txFilterCompany === 'ALL' || tx.companyId === txFilterCompany;
    const matchesSearch = txSearch.trim() === '' || 
      tx.owner.toLowerCase().includes(txSearch.toLowerCase()) || 
      (tx.companyName || '').toLowerCase().includes(txSearch.toLowerCase()) || 
      tx.id.toLowerCase().includes(txSearch.toLowerCase()) || 
      tx.detail.toLowerCase().includes(txSearch.toLowerCase());
    return matchesCompany && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Header */}
      <header className="border-b border-amber-500/30 bg-slate-900/90 backdrop-blur-md px-4 py-3 sticky top-0 z-30 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg sm:text-xl text-white tracking-tight">
                  Panel Administrador Supremo
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Master Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría total de la plataforma y modificación de textos de inicio
              </p>
            </div>
          </div>

          <button
            onClick={logoutSuperAdmin}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 border border-slate-700 transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Pantalla de Inicio</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 sm:py-8 flex-1 space-y-6">
        
        {/* Global Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-md">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Recaudación Global Caja (USD)
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatUSD(globalRecargadoUSD)}
            </p>
            <p className="text-[11px] text-emerald-400 font-bold mt-1">
              Todas las {companies.length} empresas
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-md">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Recaudado en Bolívares
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono truncate">
              {formatBs(globalRecargadoBs)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Tasa oficial de cada recarga
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-md">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Consumo Total Proveedores
            </span>
            <p className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">
              {formatUSD(globalConsumidoUSD)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Ventas debitadas con NFC
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-md">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Saldo Flotante Global NFC
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {formatUSD(globalSaldoFlotanteUSD)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              En {globalTotalStickers} stickers activos
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-md">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Total Empresas & Transacciones
            </span>
            <p className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
              {companies.length} emp. / {allGlobalTransactions.length} tx
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Ecosistema completo
            </p>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveSubTab('TEXTS')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'TEXTS'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>1. Modificar Textos de Inicio</span>
          </button>

          <button
            onClick={() => setActiveSubTab('COMPANIES')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'COMPANIES'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. Gestión Total de Empresas ({companies.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('TRANSACTIONS')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'TRANSACTIONS'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>3. Auditoría Global de Movimientos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('PROVIDERS')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'PROVIDERS'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>4. Ventas por Proveedor ($ y Bs)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('SECURITY')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'SECURITY'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>5. Clave Maestra Supremo</span>
          </button>
        </div>

        {/* TAB 1: MODIFICAR TEXTOS DE LA PANTALLA DE INICIO */}
        {activeSubTab === 'TEXTS' && (
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl max-w-3xl space-y-6">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Editor de Textos & Marca de la Pantalla de Inicio</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Como Administrador Supremo, puedes cambiar en vivo los titulares, eslogan y mensajes que ven todos los visitantes al abrir la web app.
              </p>
            </div>

            <form onSubmit={handleSaveTexts} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Título Principal (Hero Heading)
                </label>
                <input
                  type="text"
                  required
                  value={homeTitle}
                  onChange={e => setHomeTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Subtítulo / Tagline Superior
                </label>
                <input
                  type="text"
                  required
                  value={homeSubtitle}
                  onChange={e => setHomeSubtitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Descripción Detallada del Hero
                </label>
                <textarea
                  rows={3}
                  required
                  value={homeDesc}
                  onChange={e => setHomeDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Texto del Banner Superior (Navbar)
                </label>
                <input
                  type="text"
                  required
                  value={homeBanner}
                  onChange={e => setHomeBanner(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 ring-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowPublicReg}
                    onChange={e => setAllowPublicReg(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Permitir botón público de &quot;Registrar Nueva Empresa&quot; en pantalla de inicio</span>
                </label>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Textos de Inicio</span>
                </button>

                {textsSaved && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Textos actualizados en la pantalla de inicio!</span>
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: GESTIÓN TOTAL DE EMPRESAS */}
        {activeSubTab === 'COMPANIES' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Empresas Registradas ({companies.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Accede como Administrador Supremo sin necesidad del PIN de la empresa o reasigna su clave secreta.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {companies.map(comp => {
                const compFloating = comp.stickers.reduce((s, st) => s + st.balance, 0);
                return (
                  <div
                    key={comp.id}
                    className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 rounded-2xl bg-slate-800 border border-slate-700">
                            {comp.logoEmoji}
                          </span>
                          <div>
                            <h4 className="font-black text-white text-base leading-snug">
                              {comp.name}
                            </h4>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ID: {comp.id}
                            </span>
                          </div>
                        </div>

                        {companies.length > 1 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Seguro que deseas eliminar la empresa "${comp.name}" y todos sus datos?`)) {
                                deleteCompany(comp.id);
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                            title="Eliminar empresa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 text-center text-xs mb-3">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">Stickers</span>
                          <span className="font-bold text-white font-mono">{comp.stickers.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">Productos</span>
                          <span className="font-bold text-white font-mono">{comp.products.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">Saldo Flot.</span>
                          <span className="font-bold text-emerald-400 font-mono">{formatUSD(compFloating)}</span>
                        </div>
                      </div>

                      {/* Secret PINs management by Master (Admin, Caja, Proveedores) */}
                      <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>PIN Admin:</span>
                          </span>
                          <span className="font-mono font-black text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 tracking-widest">
                            {comp.adminPin}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            maxLength={8}
                            placeholder="Nuevo PIN Admin..."
                            id={`pin-input-${comp.id}`}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`pin-input-${comp.id}`) as HTMLInputElement;
                              if (el && el.value.trim().length >= 4) {
                                updateCompanyPinByMaster(comp.id, el.value.trim());
                                el.value = '';
                              }
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Asignar
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>PIN Caja:</span>
                          </span>
                          <span className="font-mono font-black text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 tracking-widest">
                            {comp.cajaPin || '1111'}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            maxLength={8}
                            placeholder="Nuevo PIN Caja..."
                            id={`caja-pin-input-${comp.id}`}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`caja-pin-input-${comp.id}`) as HTMLInputElement;
                              if (el && el.value.trim().length >= 4) {
                                updateCompanyCajaPinByMaster(comp.id, el.value.trim());
                                el.value = '';
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Asignar
                          </button>
                        </div>

                        {comp.providers && comp.providers.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                              PINs de Proveedores ({comp.providers.length}):
                            </span>
                            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                              {comp.providers.map(prov => {
                                const rowKey = `${comp.id}:${prov.id}`;
                                const isEditing = editingProviderKey === rowKey;
                                return (
                                  <div key={prov.id} className="bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800 space-y-1">
                                    <div className="flex items-center justify-between gap-1.5 text-[11px]">
                                      <span className="truncate text-slate-300 font-semibold">
                                        {prov.emoji} {prov.brandName}
                                      </span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="font-mono font-bold text-blue-300">{prov.pin}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isEditing) {
                                              setEditingProviderKey(null);
                                            } else {
                                              setEditingProviderKey(rowKey);
                                              setEditingProviderPinVal(prov.pin);
                                            }
                                          }}
                                          className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                                        >
                                          {isEditing ? 'Cerrar' : 'Editar'}
                                        </button>
                                      </div>
                                    </div>
                                    {isEditing && (
                                      <div className="flex gap-1">
                                        <input
                                          type="text"
                                          maxLength={8}
                                          value={editingProviderPinVal}
                                          onChange={e => setEditingProviderPinVal(e.target.value.replace(/\D/g, ''))}
                                          className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] font-mono text-white"
                                        />
                                        <button
                                          type="button"
                                          disabled={editingProviderPinVal.length < 4}
                                          onClick={() => {
                                            updateProviderPinByMaster(comp.id, prov.id, editingProviderPinVal);
                                            setEditingProviderKey(null);
                                          }}
                                          className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] cursor-pointer disabled:opacity-40"
                                        >
                                          Guardar
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Master bypass login */}
                    <button
                      onClick={() => enterCompanyAsSuperAdmin(comp.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Ingresar con Acceso Total (Bypass)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AUDITORÍA GLOBAL DE MOVIMIENTOS */}
        {activeSubTab === 'TRANSACTIONS' && (
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Auditoría General de Todas las Empresas
                </h3>
                <p className="text-xs text-slate-400">
                  {allGlobalTransactions.length} transacciones registradas en toda la plataforma.
                </p>
              </div>

              <button
                onClick={exportGlobalTransactionsCSV}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Consolidado Global (CSV)</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, ID de sticker o detalle..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 ring-amber-500"
                />
              </div>

              <select
                value={txFilterCompany}
                onChange={e => setTxFilterCompany(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 ring-amber-500 cursor-pointer"
              >
                <option value="ALL">🌐 Todas las Empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.logoEmoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredGlobalTx.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-amber-400 border border-slate-700">
                        {tx.companyName || 'Empresa'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          tx.type === 'RECARGA'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {tx.type}
                      </span>
                      <span className="font-bold text-white truncate">{tx.owner}</span>
                      <span className="text-[10px] font-mono text-slate-500">{tx.stickerId}</span>
                    </div>
                    <p className="text-slate-400 truncate">{tx.detail}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {tx.id} • {formatDateTime(tx.timestamp)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-black text-sm sm:text-base font-mono block ${
                        tx.type === 'RECARGA' ? 'text-blue-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'RECARGA' ? '+' : '-'}{formatUSD(tx.usd)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {formatBs(tx.bs)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RENDIMIENTO GLOBAL DE PROVEEDORES Y STANDS ($ USD Y BOLÍVARES) */}
        {activeSubTab === 'PROVIDERS' && (
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Store className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Rendimiento Global de Proveedores & Stands
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Consolidado financiero detallado de cuánto generó cada stand en toda la plataforma, tanto en <strong>Dólares ($ USD)</strong> como en <strong>Bolívares (Bs.)</strong>.
                </p>
              </div>

              <button
                onClick={() => exportProvidersCSV(filteredProviderStats, 'reporte_global_proveedores.csv', true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Liquidación Global (CSV)</span>
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar proveedor o empresa..."
                  value={providerSearch}
                  onChange={e => setProviderSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 ring-amber-500"
                />
              </div>

              <select
                value={providerFilterCompany}
                onChange={e => setProviderFilterCompany(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 ring-amber-500 cursor-pointer"
              >
                <option value="ALL">🌐 Todas las Empresas ({companies.length})</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.logoEmoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Global Providers List */}
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredProviderStats.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Store className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="font-bold text-sm text-slate-400">No se encontraron proveedores</p>
                  <p className="text-xs text-slate-500">Ajusta el filtro de búsqueda para ver resultados.</p>
                </div>
              ) : (
                filteredProviderStats.map(stat => {
                  const isExpanded = expandedGlobalProvider === `${stat.companyId}-${stat.name}`;
                  return (
                    <div
                      key={`${stat.companyId}-${stat.name}`}
                      className="p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 transition-all duration-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-850 border border-slate-700 flex items-center justify-center text-xl shadow-xs">
                            🏪
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-white text-base leading-tight">
                                {stat.name}
                              </h4>
                              {stat.companyName && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  {stat.companyName}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                              {stat.salesCount} ventas procesadas • {stat.percentageOfTotal}% del volumen global
                            </span>
                          </div>
                        </div>

                        {/* Revenue in USD and Bs */}
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Generado:</span>
                            <span className="text-2xl font-black text-emerald-400 font-mono">
                              {formatUSD(stat.totalUSD)}
                            </span>
                          </div>
                          <span className="text-sm font-black text-amber-400 font-mono block">
                            {formatBs(stat.totalBs)}
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(stat.percentageOfTotal, 3)}%` }}
                        />
                      </div>

                      {/* Financial Detail Grid */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block">Comisión Organizador</span>
                          <span className="font-bold text-purple-400 font-mono">{formatUSD(stat.commissionUSD)}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">({formatBs(stat.commissionBs)})</span>
                        </div>

                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold block">Neto Proveedor (USD)</span>
                          <span className="font-black text-emerald-400 font-mono text-sm">{formatUSD(stat.netUSD)}</span>
                        </div>

                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-slate-400 font-bold block">Neto Proveedor (Bolívares)</span>
                          <span className="font-black text-amber-400 font-mono text-xs">{formatBs(stat.netBs)}</span>
                        </div>
                      </div>

                      {/* Items sold toggle if items exist */}
                      {stat.itemsBreakdown.length > 0 && (
                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedGlobalProvider(isExpanded ? null : `${stat.companyId}-${stat.name}`)}
                            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Ocultar Artículos' : `Ver ${stat.itemsBreakdown.length} Artículos Vendidos`}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-left text-xs animate-in fade-in duration-150">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Detalle de ventas por producto:
                              </span>
                              {stat.itemsBreakdown.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-800 last:border-none">
                                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                                    <span>{item.emoji}</span>
                                    <span>{item.qty}x {item.name}</span>
                                  </span>
                                  <div className="text-right font-mono">
                                    <span className="font-bold text-white">{formatUSD(item.revenueUSD)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CLAVE MAESTRA DEL ADMIN SUPREMO */}
        {activeSubTab === 'SECURITY' && (
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl max-w-md space-y-4">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Clave Maestra del Admin Supremo</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Esta clave es el PIN maestro que da acceso a este panel de control superior.
              </p>
            </div>

            <form onSubmit={handleSaveMasterPin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nuevo PIN Maestro (4 a 6 dígitos):
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Ej. 9999"
                  value={newMasterPin}
                  onChange={e => setNewMasterPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg font-black text-amber-400 font-mono tracking-widest focus:outline-none focus:ring-2 ring-amber-500 text-center"
                />
              </div>

              <button
                type="submit"
                disabled={newMasterPin.length < 4}
                className={`w-full py-3.5 rounded-2xl font-black text-sm transition cursor-pointer ${
                  newMasterPin.length >= 4
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Actualizar PIN Maestro
              </button>

              {masterPinSaved && (
                <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-center">
                  ✓ Clave maestra actualizada con éxito.
                </p>
              )}
            </form>
          </div>
        )}

      </main>
    </div>
  );
};
