import React, { useState, useEffect, useCallback } from 'react';
import { Lock, X, Delete, Eye, EyeOff, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { soundSynth } from '../utils/audio';

export const ProviderPinModal: React.FC = () => {
  const {
    showProviderPinModal,
    closeProviderPinPrompt,
    pendingProviderId,
    providers,
    unlockProviderWithPin,
    settings,
  } = useApp();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDigits, setShowDigits] = useState<boolean>(false);

  const targetProvider = providers.find(p => p.id === pendingProviderId) || null;

  useEffect(() => {
    if (showProviderPinModal) {
      setEnteredPin('');
      setErrorMessage('');
    }
  }, [showProviderPinModal, pendingProviderId]);

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (!targetProvider) return;
      soundSynth.playClick(settings.enableSound);
      setEnteredPin(prev => {
        if (prev.length >= 8) return prev;
        const nextPin = prev + digit;
        setErrorMessage('');
        const targetLength = targetProvider.pin.length || 4;
        if (nextPin.length === targetLength) {
          setTimeout(() => {
            const success = unlockProviderWithPin(targetProvider.id, nextPin);
            if (!success) {
              setErrorMessage('PIN incorrecto para este proveedor. Inténtalo de nuevo.');
              setEnteredPin('');
            }
          }, 100);
        }
        return nextPin;
      });
    },
    [targetProvider, settings.enableSound, unlockProviderWithPin]
  );

  const handleBackspace = useCallback(() => {
    soundSynth.playClick(settings.enableSound);
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  }, [settings.enableSound]);

  useEffect(() => {
    if (!showProviderPinModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeProviderPinPrompt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProviderPinModal, handleDigitPress, handleBackspace, closeProviderPinPrompt]);

  if (!showProviderPinModal || !targetProvider) return null;

  const targetLength = targetProvider.pin.length || 4;

  const handleManualSubmit = () => {
    if (!enteredPin) return;
    const success = unlockProviderWithPin(targetProvider.id, enteredPin);
    if (!success) {
      setErrorMessage('PIN incorrecto para este proveedor.');
      setEnteredPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        <button
          onClick={closeProviderPinPrompt}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 mx-auto mb-3 flex items-center justify-center border border-emerald-200 shadow-inner text-3xl">
          {targetProvider.emoji || <Store className="w-8 h-8" />}
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Ingreso Proveedor
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Ingresa el PIN numérico secreto de <strong className="text-slate-800">{targetProvider.brandName}</strong> para abrir su stand.
        </p>

        {/* Masked PIN Indicator */}
        <div className="flex items-center justify-center gap-2.5 mb-4">
          {Array.from({ length: targetLength }).map((_, idx) => {
            const hasDigit = idx < enteredPin.length;
            const digitChar = enteredPin[idx];
            return (
              <div
                key={idx}
                className={`w-11 h-13 rounded-2xl border-2 flex items-center justify-center font-black text-xl transition-all ${
                  hasDigit
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 scale-105 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-300'
                }`}
              >
                {hasDigit ? (showDigits ? digitChar : '●') : ''}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-2">
          <button
            type="button"
            onClick={() => setShowDigits(prev => !prev)}
            className="flex items-center gap-1 hover:text-slate-800 font-semibold cursor-pointer"
          >
            {showDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showDigits ? 'Ocultar' : 'Mostrar'}</span>
          </button>

          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>PIN Secreto</span>
          </span>
        </div>

        {errorMessage && (
          <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl mb-4">
            {errorMessage}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigitPress(d)}
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
            onClick={() => handleDigitPress('0')}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-black text-xl text-slate-800 shadow-xs active:scale-95 transition cursor-pointer select-none"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleManualSubmit}
          disabled={enteredPin.length === 0}
          className={`w-full py-3 rounded-2xl font-black text-sm shadow-md transition cursor-pointer ${
            enteredPin.length > 0
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Entrar al Stand
        </button>
      </div>
    </div>
  );
};
