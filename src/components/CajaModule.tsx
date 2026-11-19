import React, { useState, useEffect, useCallback } from 'react';
import {
  Delete,
  RotateCcw,
  Radio,
  Receipt,
  Banknote,
  Smartphone,
  CreditCard,
  QrCode,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs } from '../utils/formatters';
import { soundSynth } from '../utils/audio';
import { PaymentMethod } from '../types';

export const CajaModule: React.FC = () => {
  const {
    currentCompany,
    isCajaUnlocked,
    unlockCajaWithPin,
    lockCaja,
    settings,
    transactions,
    openNfcModal,
    setReceiptModalTx,
  } = useApp();

  // Caja PIN Lock state
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [showPinDigits, setShowPinDigits] = useState<boolean>(false);

  // Internal cent counter for exact precision (cents: 1000 = $10.00)
  const [cajaCents, setCajaCents] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo USD');

  useEffect(() => {
    if (!isCajaUnlocked) {
      setEnteredPin('');
      setPinError('');
    }
  }, [isCajaUnlocked]);

  const handlePinDigit = useCallback(
    (digit: string) => {
      if (!currentCompany) return;
      soundSynth.playClick(settings.enableSound);
      setEnteredPin(prev => {
        if (prev.length >= 8) return prev;
        const nextPin = prev + digit;
        setPinError('');
        const targetLength = (currentCompany.cajaPin || '1111').length || 4;
        if (nextPin.length === targetLength) {
          setTimeout(() => {
            const ok = unlockCajaWithPin(nextPin);
            if (!ok) {
              setPinError('PIN de Caja incorrecto. Inténtalo de nuevo.');
              setEnteredPin('');
            }
          }, 100);
        }
        return nextPin;
      });
    },
    [currentCompany, settings.enableSound, unlockCajaWithPin]
  );

  const handlePinBackspace = useCallback(() => {
    soundSynth.playClick(settings.enableSound);
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError('');
  }, [settings.enableSound]);

  useEffect(() => {
    if (isCajaUnlocked) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCajaUnlocked, handlePinDigit, handlePinBackspace]);

  if (!isCajaUnlocked && currentCompany) {
    const targetLength = (currentCompany.cajaPin || '1111').length || 4;
    return (
      <section className="flex items-center justify-center py-6 sm:py-10">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-xl border border-slate-200/90 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto mb-3 flex items-center justify-center border border-blue-200 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Terminal de Caja Protegida
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Ingresa el PIN numérico secreto de Caja para <strong className="text-slate-800">{currentCompany.name}</strong>.
          </p>

          <div className="flex items-center justify-center gap-2.5 mb-4">
            {Array.from({ length: targetLength }).map((_, idx) => {
              const hasDigit = idx < enteredPin.length;
              const digitChar = enteredPin[idx];
              return (
                <div
                  key={idx}
                  className={`w-11 h-13 rounded-2xl border-2 flex items-center justify-center font-black text-xl transition-all ${
                    hasDigit
                      ? 'border-blue-600 bg-blue-50 text-blue-800 scale-105 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-300'
                  }`}
                >
                  {hasDigit ? (showPinDigits ? digitChar : '●') : ''}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-2">
            <button
              type="button"
              onClick={() => setShowPinDigits(prev => !prev)}
              className="flex items-center gap-1 hover:text-slate-800 font-semibold cursor-pointer"
            >
              {showPinDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPinDigits ? 'Ocultar' : 'Mostrar'}</span>
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              🔒 PIN Secreto
            </span>
          </div>

          {pinError && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl mb-4">
              {pinError}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                onClick={() => handlePinDigit(d)}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-black text-xl text-slate-800 shadow-xs active:scale-95 transition cursor-pointer select-none"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setEnteredPin('')}
              className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 shadow-xs active:scale-95 transition cursor-pointer select-none"
            >
              Limpiar
            </button>
            <button
              onClick={() => handlePinDigit('0')}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-black text-xl text-slate-800 shadow-xs active:scale-95 transition cursor-pointer select-none"
            >
              0
            </button>
            <button
              onClick={handlePinBackspace}
              className="h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              if (!enteredPin) return;
              const ok = unlockCajaWithPin(enteredPin);
              if (!ok) {
                setPinError('PIN de Caja incorrecto.');
                setEnteredPin('');
              }
            }}
            disabled={enteredPin.length === 0}
            className={`w-full py-3 rounded-2xl font-black text-sm shadow-md transition cursor-pointer ${
              enteredPin.length > 0
                ? 'bg-app-primary hover:bg-app-primary-hover text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Desbloquear Caja
          </button>
        </div>
      </section>
    );
  }

  const usdAmount = Number((cajaCents / 100).toFixed(2));
  const bsAmount = Number((usdAmount * settings.bcvRate).toFixed(2));

  // Keypad logic
  const pressDigit = (digit: string) => {
    soundSynth.playClick(settings.enableSound);
    const currentStr = cajaCents.toString();
    if (currentStr.length >= 8) return;
    const newStr = currentStr === '0' ? digit : currentStr + digit;
    setCajaCents(parseInt(newStr, 10));
  };

  const backspace = () => {
    soundSynth.playClick(settings.enableSound);
    const str = cajaCents.toString();
    if (str.length <= 1) {
      setCajaCents(0);
    } else {
      setCajaCents(parseInt(str.slice(0, -1), 10));
    }
  };

  const clearInput = () => {
    soundSynth.playClick(settings.enableSound);
    setCajaCents(0);
  };

  const addQuickAmount = (dollars: number) => {
    soundSynth.playClick(settings.enableSound);
    setCajaCents(prev => prev + dollars * 100);
  };

  const handleChargeSubmit = () => {
    if (usdAmount <= 0) {
      soundSynth.playError(settings.enableSound);
      return;
    }

    openNfcModal({
      mode: 'RECHARGE',
      amountUSD: usdAmount,
      title: 'Recarga de Saldo NFC',
      subtitle: `Acerca el sticker o pulsera del cliente para cargar ${formatUSD(usdAmount)}.`,
      paymentMethod,
    });
  };

  const recentRecharges = transactions.filter(t => t.type === 'RECARGA');

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: POS Keypad & Cash Register Display */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-7">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>Caja de Recarga NFC</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Ingresa el monto a cobrar al cliente para cargar saldo a su etiqueta NFC.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openNfcModal({
                    mode: 'QUERY',
                    amountUSD: 0,
                    title: 'Consultar Saldo de Pulsera NFC',
                    subtitle: 'Acerca la pulsera o tarjeta del cliente para verificar su saldo actual e historial.',
                  })
                }
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Consultar saldo de cualquier pulsera NFC"
              >
                <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                <span className="hidden sm:inline">Consultar Saldo</span>
              </button>

              <div className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5 font-mono">
                <span>1 USD =</span>
                <span className="font-black">{formatBs(settings.bcvRate)}</span>
              </div>
              <button
                onClick={lockCaja}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                title="Bloquear Caja"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloquear</span>
              </button>
            </div>
          </div>

          {/* Dual Currency Screen (USD -> Bs) */}
          <div className="bg-slate-950 rounded-2xl p-5 text-white mb-5 shadow-inner relative overflow-hidden border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Monto a Recargar (Dólares USD)
              </span>
              {cajaCents > 0 && (
                <button
                  onClick={clearInput}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-0.5 rounded bg-white/10 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">$</span>
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono select-none">
                {usdAmount.toFixed(2)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <span>Total a cobrar en Bolívares (Tasa BCV):</span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {formatBs(bsAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Método de Pago Recibido en Caja:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'Efectivo USD', label: 'Efectivo $', icon: Banknote },
                { id: 'Pago Móvil (Bs)', label: 'Pago Móvil', icon: Smartphone },
                { id: 'Punto de Venta (Bs)', label: 'Punto POS', icon: CreditCard },
                { id: 'Zelle', label: 'Zelle', icon: QrCode },
                { id: 'Binance Pay', label: 'Binance', icon: Radio },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      soundSynth.playClick(settings.enableSound);
                      setPaymentMethod(method.id as PaymentMethod);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[5, 10, 20, 50, 100].map(amt => (
              <button
                key={amt}
                onClick={() => addQuickAmount(amt)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 font-black text-slate-700 text-sm transition active:scale-95 cursor-pointer"
              >
                +${amt}
              </button>
            ))}
          </div>

          {/* Virtual POS Keypad */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                onClick={() => pressDigit(d)}
                className="h-13 sm:h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-2xl font-black text-slate-800 shadow-xs active:scale-95 transition cursor-pointer select-none"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => pressDigit('00')}
              className="h-13 sm:h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xl font-black text-slate-800 shadow-xs active:scale-95 transition cursor-pointer select-none"
            >
              00
            </button>
            <button
              onClick={() => pressDigit('0')}
              className="h-13 sm:h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-2xl font-black text-slate-800 shadow-xs active:scale-95 transition cursor-pointer select-none"
            >
              0
            </button>
            <button
              onClick={backspace}
              title="Borrar dígito"
              className="h-13 sm:h-14 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Main Action Button */}
          <button
            onClick={handleChargeSubmit}
            disabled={usdAmount <= 0}
            className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer ${
              usdAmount > 0
                ? 'bg-app-primary hover:bg-app-primary-hover text-white shadow-blue-500/25 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Radio className="w-6 h-6 animate-pulse" />
            <span>CARGAR {formatUSD(usdAmount)} EN STICKER NFC</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Column: Ledger & Recent Recharges */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-800 text-lg tracking-tight">
                Últimas Recargas en Caja
              </h3>
              <p className="text-xs text-slate-400">Transacciones confirmadas en tiempo real</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {recentRecharges.length} recargas
            </span>
          </div>

          {recentRecharges.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No hay recargas registradas aún</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Ingresa un monto en el teclado numérico y pulsa &quot;Cargar Saldo&quot; para registrar la primera recarga.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[510px] overflow-y-auto pr-1">
              {recentRecharges.map(tx => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-800 text-sm truncate">
                        {tx.owner}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                        {tx.stickerId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {formatBs(tx.bs)} • <span className="font-semibold text-slate-600">{tx.paymentMethod}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {tx.id} • {tx.time}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className="font-black text-emerald-600 text-lg font-mono">
                      +{formatUSD(tx.usd)}
                    </span>
                    <button
                      onClick={() => setReceiptModalTx(tx)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 opacity-90 group-hover:opacity-100 hover:underline cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Ticket</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
