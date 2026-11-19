import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Plus, 
  Trash2, 
  Radio, 
  Sparkles, 
  Info,
  DollarSign,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs } from '../utils/formatters';
import { soundSynth } from '../utils/audio';

const GRADIENT_PRESETS = [
  { id: 'blue', label: 'Azul', class: 'from-blue-600 to-indigo-700' },
  { id: 'emerald', label: 'Verde', class: 'from-emerald-600 to-teal-700' },
  { id: 'purple', label: 'Morado', class: 'from-purple-600 to-pink-600' },
  { id: 'amber', label: 'Oro', class: 'from-amber-600 to-orange-700' },
  { id: 'dark', label: 'Dark', class: 'from-slate-700 to-slate-900' },
  { id: 'rose', label: 'Rosa', class: 'from-rose-600 to-red-800' },
];

export const StickersDrawer: React.FC = () => {
  const { 
    isStickersDrawerOpen, 
    toggleStickersDrawer, 
    stickers, 
    addSticker, 
    deleteSticker, 
    settings, 
    openNfcModal, 
    setActiveTab 
  } = useApp();

  const [newOwner, setNewOwner] = useState<string>('');
  const [initialBalance, setInitialBalance] = useState<string>('0');
  const [selectedColor, setSelectedColor] = useState<string>(GRADIENT_PRESETS[0].class);

  if (!isStickersDrawerOpen) return null;

  const handleCreateSticker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner.trim()) return;
    const balance = parseFloat(initialBalance) || 0;
    addSticker(newOwner.trim(), balance, selectedColor);
    setNewOwner('');
    setInitialBalance('0');
  };

  const handleQuickRechargeFromDrawer = (stickerId: string, owner: string) => {
    toggleStickersDrawer();
    setActiveTab('caja');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Billeteras / Stickers NFC</span>
              </h3>
              <p className="text-xs text-slate-500">
                Simulador de clientes con tarjetas y pulseras NTAG215
              </p>
            </div>
            <button
              onClick={toggleStickersDrawer}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stickers List */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Etiquetas Activas ({stickers.length})</span>
              <span>Tasa: {formatBs(settings.bcvRate)}</span>
            </div>

            {stickers.map(st => (
              <div
                key={st.id}
                className={`p-4 rounded-2xl bg-gradient-to-r ${st.color} text-white shadow-md relative overflow-hidden group`}
              >
                {/* Chip graphic decoration */}
                <div className="absolute right-3 top-3 opacity-20 pointer-events-none">
                  <Radio className="w-16 h-16 text-white" />
                </div>

                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 block">
                      {st.id} • {st.tagType}
                    </span>
                    <h4 className="font-black text-base text-white tracking-tight mt-0.5">
                      {st.owner}
                    </h4>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase text-white/80 block font-bold">
                      Saldo
                    </span>
                    <span className="text-2xl font-black font-mono text-white block">
                      {formatUSD(st.balance)}
                    </span>
                    <span className="text-[11px] text-white/80 font-mono block">
                      ≈ {formatBs(st.balance * settings.bcvRate)}
                    </span>
                  </div>
                </div>

                {/* Bottom row actions */}
                <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs relative z-10">
                  <button
                    onClick={() => handleQuickRechargeFromDrawer(st.id, st.owner)}
                    className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Recargar en Caja</span>
                  </button>

                  {stickers.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar sticker ${st.id} de ${st.owner}?`)) {
                          deleteSticker(st.id);
                        }
                      }}
                      className="text-white/60 hover:text-white p-1 rounded transition cursor-pointer"
                      title="Eliminar sticker"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Register New Sticker Form */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Registrar Nuevo Cliente / Sticker</span>
            </h4>

            <form onSubmit={handleCreateSticker} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Valentina Mendoza"
                  value={newOwner}
                  onChange={e => setNewOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 ring-app-primary bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Saldo Inicial ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={initialBalance}
                    onChange={e => setInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 ring-app-primary bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Diseño de Tarjeta
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {GRADIENT_PRESETS.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedColor(g.class)}
                        className={`w-6 h-6 rounded-full bg-gradient-to-r ${g.class} cursor-pointer transition ${
                          selectedColor === g.class ? 'ring-2 ring-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={g.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Crear Tarjeta NFC</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
          <div className="flex items-start gap-1.5">
            <Smartphone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              En dispositivos móviles Android con Google Chrome, esta aplicación activa directamente la antena de hardware mediante la API estándar <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">NDEFReader</code>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
