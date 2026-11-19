import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Store, 
  Wallet, 
  Percent, 
  Palette, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  Search, 
  Receipt, 
  RotateCcw,
  Sparkles,
  Sliders,
  Lock,
  KeyRound,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  PieChart,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs, formatDateTime } from '../utils/formatters';
import { soundSynth } from '../utils/audio';
import { calculateCompanyProviderStats, exportProvidersCSV } from '../utils/providerStats';

export const AdminModule: React.FC = () => {
  const { 
    currentCompany,
    updateAdminPin,
    updateCajaPin,
    providers,
    updateProviderPin,
    deleteProviderBrand,
    setIsNewProviderModalOpen,
    lockAdmin,
    settings, 
    updateSettings, 
    resetTheme, 
    setPresetTheme, 
    stickers, 
    products, 
    updateProduct, 
    deleteProduct, 
    transactions, 
    setIsProductModalOpen, 
    setReceiptModalTx, 
    resetCurrentCompanyData, 
    exportDataJSON, 
    exportTransactionsCSV 
  } = useApp();

  const [bcvInput, setBcvInput] = useState<string>(settings.bcvRate.toString());
  const [bcvSavedMessage, setBcvSavedMessage] = useState<boolean>(false);
  const [newAdminPinInput, setNewAdminPinInput] = useState<string>('');
  const [pinSavedMessage, setPinSavedMessage] = useState<boolean>(false);
  const [newCajaPinInput, setNewCajaPinInput] = useState<string>('');
  const [cajaPinSavedMessage, setCajaPinSavedMessage] = useState<boolean>(false);
  const [providerPinDrafts, setProviderPinDrafts] = useState<Record<string, string>>({});
  const [txFilter, setTxFilter] = useState<'ALL' | 'RECARGA' | 'CONSUMO'>('ALL');
  const [txSearch, setTxSearch] = useState<string>('');
  const [prodSearch, setProdSearch] = useState<string>('');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Provider financial breakdown ($ USD and Bolívares)
  const providerStats = useMemo(() => {
    return calculateCompanyProviderStats(
      products,
      transactions,
      settings.eventCommissionRate,
      settings.bcvRate
    );
  }, [products, transactions, settings.eventCommissionRate, settings.bcvRate]);

  // Financial calculations
  const totalRecargadoUSD = useMemo(() => {
    return transactions
      .filter(t => t.type === 'RECARGA')
      .reduce((sum, t) => sum + t.usd, 0);
  }, [transactions]);

  const totalRecargadoBs = useMemo(() => {
    return transactions
      .filter(t => t.type === 'RECARGA')
      .reduce((sum, t) => sum + t.bs, 0);
  }, [transactions]);

  const totalConsumidoUSD = useMemo(() => {
    return transactions
      .filter(t => t.type === 'CONSUMO')
      .reduce((sum, t) => sum + t.usd, 0);
  }, [transactions]);

  const saldoFlotanteUSD = useMemo(() => {
    return stickers.reduce((sum, s) => sum + s.balance, 0);
  }, [stickers]);

  const comisionOrganizadorUSD = useMemo(() => {
    return totalConsumidoUSD * (settings.eventCommissionRate / 100);
  }, [totalConsumidoUSD, settings.eventCommissionRate]);

  // Update BCV handler
  const handleUpdateBcv = () => {
    const val = parseFloat(bcvInput);
    if (!isNaN(val) && val > 0) {
      updateSettings({ bcvRate: Number(val.toFixed(2)) });
      soundSynth.playSuccess(settings.enableSound);
      setBcvSavedMessage(true);
      setTimeout(() => setBcvSavedMessage(false), 2500);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = txFilter === 'ALL' || t.type === txFilter;
      const matchesSearch = txSearch.trim() === '' || 
        t.owner.toLowerCase().includes(txSearch.toLowerCase()) || 
        t.stickerId.toLowerCase().includes(txSearch.toLowerCase()) || 
        t.id.toLowerCase().includes(txSearch.toLowerCase()) || 
        t.detail.toLowerCase().includes(txSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, txFilter, txSearch]);

  // Filter products in table
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      return prodSearch.trim() === '' ||
        p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.provider.toLowerCase().includes(prodSearch.toLowerCase());
    });
  }, [products, prodSearch]);

  return (
    <section className="space-y-6">
      
      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Recaudado USD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Recaudado en Caja
            </span>
            <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {formatUSD(totalRecargadoUSD)}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">
            Ingresos brutos recargados
          </p>
        </div>

        {/* Recaudado Bs */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Recaudado en Bolívares
            </span>
            <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 font-mono tracking-tight truncate">
            {formatBs(totalRecargadoBs)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Calculado a tasa de cobro
          </p>
        </div>

        {/* Consumo en Proveedores */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Ventas Proveedores
            </span>
            <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono tracking-tight">
            {formatUSD(totalConsumidoUSD)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Consumos debitados en NFC
          </p>
        </div>

        {/* Saldo Flotante en NFC */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Saldo Flotante NFC
            </span>
            <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
            {formatUSD(saldoFlotanteUSD)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            En {stickers.length} stickers de clientes
          </p>
        </div>

        {/* Comisión del Evento */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Comisión ({settings.eventCommissionRate}%)
            </span>
            <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 font-mono tracking-tight">
            {formatUSD(comisionOrganizadorUSD)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Fee organizador de evento
          </p>
        </div>

      </div>

      {/* Main Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tasa BCV + White-Label Theme Customizer + Data Backups */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Tasa Oficial BCV Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-slate-800 text-lg tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Tasa Oficial BCV</span>
              </h3>
              <span className="text-xs font-bold text-slate-400 font-mono">USD / VES</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ajusta el valor oficial del dólar en Bolívares. Se actualizarán instantáneamente todas las cajas y referencias.
            </p>

            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 font-mono">
                  Bs.
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={bcvInput}
                  onChange={e => setBcvInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 font-black text-slate-900 text-xl focus:outline-none focus:ring-2 ring-app-primary font-mono"
                />
              </div>
              <button
                onClick={handleUpdateBcv}
                className="px-5 py-3 rounded-xl bg-app-primary hover:bg-app-primary-hover text-white font-black text-sm shadow-md transition active:scale-95 cursor-pointer"
              >
                Actualizar
              </button>
            </div>

            {bcvSavedMessage && (
              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl mb-3">
                ✓ Tasa BCV actualizada a {formatBs(parseFloat(bcvInput))}
              </p>
            )}

            {/* Quick preset rates */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Rápido:</span>
              {[50.00, 52.40, 55.00, 58.00].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    setBcvInput(val.toFixed(2));
                    updateSettings({ bcvRate: val });
                    soundSynth.playClick(settings.enableSound);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition"
                >
                  Bs. {val.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* White-Label Appearance Customizer */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 text-lg tracking-tight flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <span>Personalizar Marca & Colores</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Modifica los textos, paleta de colores y aspecto de la web app en tiempo real.
                </p>
              </div>
              <button
                onClick={resetTheme}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar</span>
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nombre del Evento / Aplicación
                </label>
                <input
                  type="text"
                  value={settings.appName}
                  onChange={e => updateSettings({ appName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 ring-app-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Subtítulo / Eslogan
                </label>
                <input
                  type="text"
                  value={settings.subtitle}
                  onChange={e => updateSettings({ subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 ring-app-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 truncate">
                    Color Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={e => updateSettings({ primaryColor: e.target.value, primaryHoverColor: e.target.value })}
                      className="w-full h-10 rounded-xl cursor-pointer border border-slate-200 p-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 truncate">
                    Color Cobro
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={e => updateSettings({ secondaryColor: e.target.value })}
                      className="w-full h-10 rounded-xl cursor-pointer border border-slate-200 p-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 truncate">
                    Fondo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.bgColor}
                      onChange={e => updateSettings({ bgColor: e.target.value })}
                      className="w-full h-10 rounded-xl cursor-pointer border border-slate-200 p-1"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Palettes */}
              <div className="pt-2">
                <span className="block text-xs font-bold text-slate-500 mb-2">
                  Paletas de Tema Rápidas:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPresetTheme('#2563eb', '#10b981', '#f8fafc')}
                    className="p-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Azul Fintech</span>
                    <span className="flex gap-1">
                      <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    </span>
                  </button>

                  <button
                    onClick={() => setPresetTheme('#7c3aed', '#ec4899', '#faf5ff')}
                    className="p-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Festival Neon</span>
                    <span className="flex gap-1">
                      <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                      <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                    </span>
                  </button>

                  <button
                    onClick={() => setPresetTheme('#0f172a', '#f59e0b', '#f8fafc')}
                    className="p-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 flex items-center justify-between cursor-pointer"
                  >
                    <span>Dark / Oro</span>
                    <span className="flex gap-1">
                      <span className="w-3 h-3 rounded-full bg-slate-900"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    </span>
                  </button>

                  <button
                    onClick={() => setPresetTheme('#059669', '#0284c7', '#ecfdf5')}
                    className="p-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>Esmeralda</span>
                    <span className="flex gap-1">
                      <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                      <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin PIN Security Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 text-lg tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span>Seguridad & Clave de Administrador</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Protege el acceso a este panel con una clave numérica privada.
                </p>
              </div>
              <button
                onClick={lockAdmin}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                title="Bloquear Administrador ahora"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear Ahora</span>
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Estado de Clave de Acceso:</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>•••• (PIN Activo y Protegido)</span>
                </span>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const cleaned = newAdminPinInput.trim();
                if (cleaned.length >= 4) {
                  updateAdminPin(cleaned);
                  setNewAdminPinInput('');
                  setPinSavedMessage(true);
                  setTimeout(() => setPinSavedMessage(false), 2500);
                }
              }}
              className="space-y-2.5 pt-1"
            >
              <label className="block text-xs font-bold text-slate-600">
                Cambiar Clave Numérica (PIN de 4 dígitos):
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Nuevo PIN (ej. 5566)"
                  value={newAdminPinInput}
                  onChange={e => setNewAdminPinInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 font-black tracking-widest text-sm focus:outline-none focus:ring-2 ring-app-primary bg-white"
                />
                <button
                  type="submit"
                  disabled={newAdminPinInput.length < 4}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    newAdminPinInput.length >= 4
                      ? 'bg-app-primary hover:bg-app-primary-hover text-white shadow-sm'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Cambiar PIN
                </button>
              </div>

              {pinSavedMessage && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                  ✓ Clave numérica de administrador actualizada exitosamente.
                </p>
              )}
            </form>

            {/* Caja PIN Management (masked) */}
            <form
              onSubmit={e => {
                e.preventDefault();
                const cleaned = newCajaPinInput.trim();
                if (cleaned.length >= 4) {
                  updateCajaPin(cleaned);
                  setNewCajaPinInput('');
                  setCajaPinSavedMessage(true);
                  setTimeout(() => setCajaPinSavedMessage(false), 2500);
                }
              }}
              className="space-y-2.5 pt-3 border-t border-slate-100"
            >
              <label className="block text-xs font-bold text-slate-600">
                Cambiar PIN Secreto de Caja (4 a 8 dígitos):
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={8}
                  placeholder="Nuevo PIN Caja"
                  value={newCajaPinInput}
                  onChange={e => setNewCajaPinInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 font-black tracking-widest text-sm focus:outline-none focus:ring-2 ring-app-primary bg-white"
                />
                <button
                  type="submit"
                  disabled={newCajaPinInput.length < 4}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    newCajaPinInput.length >= 4
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Cambiar PIN Caja
                </button>
              </div>

              {cajaPinSavedMessage && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                  ✓ Clave numérica de Caja actualizada exitosamente.
                </p>
              )}
            </form>
          </div>

          {/* Registered Provider Brands & Masked PINs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-800 text-base tracking-tight flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Marcas de Proveedores & PINs</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Administra los stands registrados y actualiza sus claves privadas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProviderModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {providers.map(prov => {
                const draft = providerPinDrafts[prov.id] || '';
                return (
                  <div
                    key={prov.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{prov.emoji || '🏪'}</span>
                        <div>
                          <p className="font-black text-xs text-slate-900">{prov.brandName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            PIN: •••• (Secreto)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el proveedor "${prov.brandName}" y sus productos?`)) {
                            deleteProviderBrand(prov.id);
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="password"
                        maxLength={8}
                        placeholder="Nuevo PIN (4+ dígitos)"
                        value={draft}
                        onChange={e =>
                          setProviderPinDrafts(prev => ({
                            ...prev,
                            [prov.id]: e.target.value.replace(/\D/g, ''),
                          }))
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                      />
                      <button
                        type="button"
                        disabled={draft.length < 4}
                        onClick={() => {
                          updateProviderPin(prov.id, draft);
                          setProviderPinDrafts(prev => ({ ...prev, [prov.id]: '' }));
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                          draft.length >= 4
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Actualizar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backup, Exports & Reset Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="font-black text-slate-800 text-base tracking-tight flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-700" />
              <span>Reportes & Copias de Seguridad</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={exportTransactionsCSV}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-800 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={exportDataJSON}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-800 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Backup JSON</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  if (window.confirm(`¿Seguro que deseas restablecer los datos de "${currentCompany?.name}" al estado demo?`)) {
                    resetCurrentCompanyData();
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Datos de esta Empresa</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Complete Product Catalog Management & Audit Log */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Detailed Provider / Stand Sales Report in USD and Bolívares */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Store className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-slate-800 text-lg tracking-tight">
                    Ventas por Proveedor / Stand
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Desglose exacto de ingresos generados por cada stand tanto en <strong>Dólares ($)</strong> como en <strong>Bolívares (Bs.)</strong>.
                </p>
              </div>

              <button
                onClick={() => exportProvidersCSV(providerStats, `liquidacion_${currentCompany?.slug || 'proveedores'}.csv`)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar Liquidación CSV</span>
              </button>
            </div>

            {/* Providers Summary Cards */}
            <div className="space-y-3">
              {providerStats.map(stat => {
                const isExpanded = expandedProvider === stat.name;
                return (
                  <div
                    key={stat.name}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition-all duration-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-xs">
                          🏪
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-base leading-tight">
                            {stat.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                            {stat.salesCount} consumos procesados • {stat.percentageOfTotal}% del evento
                          </span>
                        </div>
                      </div>

                      {/* Revenue USD & Bs */}
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-[11px] text-slate-400 font-bold uppercase">Total:</span>
                          <span className="text-xl font-black text-indigo-600 font-mono">
                            {formatUSD(stat.totalUSD)}
                          </span>
                        </div>
                        <span className="text-xs font-black text-amber-600 font-mono block">
                          {formatBs(stat.totalBs)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Event Share */}
                    <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(stat.percentageOfTotal, 3)}%` }}
                      />
                    </div>

                    {/* Fee & Net Breakdown */}
                    <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-bold block">Comisión Organizador ({settings.eventCommissionRate}%)</span>
                        <span className="font-bold text-purple-700 font-mono">{formatUSD(stat.commissionUSD)}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">({formatBs(stat.commissionBs)})</span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-bold block">Neto Stand (USD)</span>
                        <span className="font-black text-emerald-700 font-mono text-sm">{formatUSD(stat.netUSD)}</span>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200/60 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-400 font-bold block">Neto Stand (Bolívares)</span>
                        <span className="font-black text-amber-600 font-mono text-xs">{formatBs(stat.netBs)}</span>
                      </div>
                    </div>

                    {/* Items sold toggle if items exist */}
                    {stat.itemsBreakdown.length > 0 && (
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedProvider(isExpanded ? null : stat.name)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Ocultar Artículos Vendidos' : `Ver ${stat.itemsBreakdown.length} Artículos Vendidos`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-left text-xs animate-in fade-in duration-150">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Desglose por producto:
                            </span>
                            {stat.itemsBreakdown.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none">
                                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                  <span>{item.emoji}</span>
                                  <span>{item.qty}x {item.name}</span>
                                </span>
                                <div className="text-right font-mono">
                                  <span className="font-bold text-slate-900">{formatUSD(item.revenueUSD)}</span>
                                  <span className="text-[10px] text-slate-400 block font-normal">
                                    ≈ {formatBs(item.revenueUSD * settings.bcvRate)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Manager Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-800 text-lg tracking-tight">
                  Gestión de Productos y Precios
                </h3>
                <p className="text-xs text-slate-500">
                  Edita nombres y precios en USD en vivo o añade nuevos artículos.
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-app-primary hover:bg-app-primary-hover text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Producto</span>
              </button>
            </div>

            {/* Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar catálogo..."
                value={prodSearch}
                onChange={e => setProdSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 ring-app-primary"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-xs">
                  <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-400">
                    <th className="py-2.5 px-2">Icono</th>
                    <th className="py-2.5 px-2">Producto</th>
                    <th className="py-2.5 px-2">Proveedor</th>
                    <th className="py-2.5 px-2">Precio ($)</th>
                    <th className="py-2.5 px-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProducts.map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2 px-2 text-xl">{prod.emoji}</td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={prod.name}
                          onChange={e => updateProduct(prod.id, { name: e.target.value })}
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs sm:text-sm"
                        />
                      </td>
                      <td className="py-2 px-2 text-xs text-slate-500 font-semibold whitespace-nowrap">
                        {prod.provider}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.10"
                            min="0.10"
                            value={prod.price}
                            onChange={e => updateProduct(prod.id, { price: parseFloat(e.target.value) || 0.1 })}
                            className="w-20 bg-slate-100 focus:bg-white border border-slate-200 rounded-lg px-2 py-1 font-black text-slate-900 text-xs sm:text-sm font-mono"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          onClick={() => deleteProduct(prod.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Log / General Movements */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-slate-800 text-base tracking-tight">
                  Historial y Auditoría de Movimientos
                </h4>
                <p className="text-xs text-slate-500">
                  Registro ordenado por fecha de todas las recargas y consumos NFC.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'RECARGA', 'CONSUMO'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTxFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      txFilter === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'ALL' ? 'Todas' : tab === 'RECARGA' ? 'Recargas' : 'Consumos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search in log */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, ID de sticker o detalle..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 ring-app-primary"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredTransactions.map(tx => (
                <div
                  key={tx.id}
                  onClick={() => setReceiptModalTx(tx)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                          tx.type === 'RECARGA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                        {tx.owner}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {tx.stickerId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{tx.detail}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {tx.id} • {formatDateTime(tx.timestamp)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-black text-sm sm:text-base font-mono block ${
                        tx.type === 'RECARGA' ? 'text-blue-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'RECARGA' ? '+' : '-'}{formatUSD(tx.usd)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {formatBs(tx.bs)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
