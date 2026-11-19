import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  X, 
  Smartphone, 
  CreditCard, 
  AlertCircle, 
  Sparkles, 
  UserPlus, 
  Check 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs } from '../utils/formatters';
import { soundSynth } from '../utils/audio';

export const NfcModal: React.FC = () => {
  const { 
    isNfcModalOpen, 
    closeNfcModal, 
    nfcModalConfig, 
    stickers, 
    processNfcTap, 
    settings, 
    addSticker 
  } = useApp();

  const [isWebNfcListening, setIsWebNfcListening] = useState<boolean>(false);
  const [hardwareScanStatus, setHardwareScanStatus] = useState<string>('');
  const [newOwnerName, setNewOwnerName] = useState<string>('');
  const [showAddQuickSticker, setShowAddQuickSticker] = useState<boolean>(false);

  // Attempt Web NFC scan on supported mobile browsers (Chrome on Android)
  useEffect(() => {
    if (!isNfcModalOpen) {
      setIsWebNfcListening(false);
      setHardwareScanStatus('');
      setShowAddQuickSticker(false);
      return;
    }

    let abortController: AbortController | null = null;

    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        abortController = new AbortController();
        // @ts-expect-error NDEFReader is standard in Chrome Android Web NFC
        const ndef = new window.NDEFReader();
        ndef.scan({ signal: abortController.signal })
          .then(() => {
            setIsWebNfcListening(true);
            setHardwareScanStatus('Antena NFC del teléfono activa. Acerca el sticker físico.');
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ndef.onreading = (event: any) => {
              const serial = event.serialNumber || 'NFC-HW-01';
              soundSynth.playNfcPing(settings.enableSound);
              
              // Find matching sticker or use first
              const match = stickers.find(s => s.id === serial) || stickers[0];
              if (match) {
                processNfcTap(match.id);
              }
            };
          })
          .catch(() => {
            setIsWebNfcListening(false);
            setHardwareScanStatus('Modo simulador interactivo disponible.');
          });
      } catch {
        setIsWebNfcListening(false);
      }
    }

    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [isNfcModalOpen, stickers, processNfcTap, settings.enableSound]);

  if (!isNfcModalOpen || !nfcModalConfig) return null;

  const isRecharge = nfcModalConfig.mode === 'RECHARGE';
  const amountUSD = nfcModalConfig.amountUSD;
  const amountBs = amountUSD * settings.bcvRate;

  const handleCreateAndSelect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerName.trim()) return;
    const newSticker = addSticker(newOwnerName.trim(), 0);
    setNewOwnerName('');
    setShowAddQuickSticker(false);
    // Tap the newly created sticker
    processNfcTap(newSticker.id);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={closeNfcModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${
            isRecharge
              ? 'bg-blue-100 text-blue-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{isRecharge ? 'Caja NFC • Recarga de Saldo' : 'Proveedor NFC • Cobro de Consumo'}</span>
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {nfcModalConfig.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          {nfcModalConfig.subtitle}
        </p>

        {/* Radar concentric wave animation */}
        <div className="relative w-28 h-28 mx-auto mb-5 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full nfc-ring ${
              isRecharge ? 'bg-blue-500/20' : 'bg-emerald-500/20'
            }`}
          />
          <div
            className={`absolute inset-0 rounded-full nfc-ring-delay ${
              isRecharge ? 'bg-blue-500/20' : 'bg-emerald-500/20'
            }`}
          />
          <div
            className={`relative w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg transition-transform transform active:scale-95 ${
              isRecharge ? 'bg-app-primary' : 'bg-app-secondary'
            }`}
          >
            <Radio className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        {/* Operation Amount Display */}
        <div className="bg-slate-950 rounded-2xl p-3.5 mb-5 text-white border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
            Monto de la Operación
          </span>
          <div className="flex items-baseline justify-center gap-2 mt-0.5">
            <span
              className={`text-3xl font-black font-mono ${
                isRecharge ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isRecharge ? '+' : '-'}{formatUSD(amountUSD)}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono block mt-0.5">
            ≈ {formatBs(amountBs)} (BCV: {formatBs(settings.bcvRate)})
          </span>
        </div>

        {/* Web NFC Hardware Status banner if supported */}
        {isWebNfcListening && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-2.5 rounded-xl mb-4 flex items-center gap-2 text-left">
            <Smartphone className="w-4 h-4 shrink-0 text-emerald-600 animate-bounce" />
            <span>{hardwareScanStatus}</span>
          </div>
        )}

        {/* Interactive Sticker Simulator selection */}
        <div className="text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Toca un sticker para simular lectura:</span>
            </span>
            <button
              onClick={() => setShowAddQuickSticker(prev => !prev)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo</span>
            </button>
          </div>

          {showAddQuickSticker && (
            <form onSubmit={handleCreateAndSelect} className="mb-3 p-3 bg-slate-100 rounded-2xl flex gap-2">
              <input
                type="text"
                placeholder="Nombre del nuevo cliente..."
                value={newOwnerName}
                onChange={e => setNewOwnerName(e.target.value)}
                autoFocus
                className="flex-1 bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Crear y Usar
              </button>
            </form>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {stickers.map(st => {
              const hasEnoughBalance = isRecharge || st.balance >= amountUSD;
              return (
                <button
                  key={st.id}
                  onClick={() => processNfcTap(st.id)}
                  className={`w-full p-2.5 rounded-2xl border transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer text-left ${
                    hasEnoughBalance
                      ? 'border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/60'
                      : 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${st.color} text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0`}
                    >
                      NFC
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 text-xs group-hover:text-blue-700 truncate">
                        {st.owner}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {st.id} • {st.tagType}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Saldo Actual
                    </span>
                    <span
                      className={`font-black text-xs sm:text-sm font-mono ${
                        st.balance >= amountUSD ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatUSD(st.balance)}
                    </span>
                    {!isRecharge && st.balance < amountUSD && (
                      <span className="text-[9px] text-rose-500 font-bold block">
                        Faltan {formatUSD(amountUSD - st.balance)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
