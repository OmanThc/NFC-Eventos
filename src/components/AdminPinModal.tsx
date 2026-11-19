import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  X, 
  Delete, 
  ShieldAlert, 
  KeyRound, 
  CheckCircle2, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { soundSynth } from '../utils/audio';

export const AdminPinModal: React.FC = () => {
  const { 
    showPinModal, 
    setShowPinModal, 
    unlockAdminWithPin, 
    currentCompany, 
    settings 
  } = useApp();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDigits, setShowDigits] = useState<boolean>(false);

  useEffect(() => {
    if (showPinModal) {
      setEnteredPin('');
      setErrorMessage('');
    }
  }, [showPinModal]);

  // Support physical keyboard
  useEffect(() => {
    if (!showPinModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPinModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, enteredPin]);

  if (!showPinModal || !currentCompany) return null;

  const handleDigitPress = (digit: string) => {
    soundSynth.playClick(settings.enableSound);
    if (enteredPin.length >= 6) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMessage('');

    // If matches target length (e.g. company's pin length, usually 4), auto-verify
    const targetLength = currentCompany.adminPin.length || 4;
    if (nextPin.length === targetLength) {
      setTimeout(() => {
        const success = unlockAdminWithPin(nextPin);
        if (!success) {
          setErrorMessage('Clave numérica incorrecta. Inténtalo de nuevo.');
          setEnteredPin('');
        }
      }, 100);
    }
  };

  const handleBackspace = () => {
    soundSynth.playClick(settings.enableSound);
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleManualSubmit = () => {
    if (!enteredPin) return;
    const success = unlockAdminWithPin(enteredPin);
    if (!success) {
      setErrorMessage('Clave numérica incorrecta.');
      setEnteredPin('');
    }
  };

  const targetLength = currentCompany.adminPin.length || 4;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={() => setShowPinModal(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 mx-auto mb-3 flex items-center justify-center border border-amber-200 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Acceso Administrador
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Ingresa el PIN numérico de <strong className="text-slate-800">{currentCompany.name}</strong> para desbloquear las métricas y configuración.
        </p>

        {/* Masked PIN Indicator */}
        <div className="flex items-center justify-center gap-3 mb-4">
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
                {hasDigit ? (showDigits ? digitChar : '●') : ''}
              </div>
            );
          })}
        </div>

        {/* Visibility toggle */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-2">
          <button
            type="button"
            onClick={() => setShowDigits(prev => !prev)}
            className="flex items-center gap-1 hover:text-slate-800 font-semibold cursor-pointer"
          >
            {showDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showDigits ? 'Ocultar' : 'Mostrar'}</span>
          </button>
          
          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            🔒 Clave Secreta
          </span>
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl mb-4 animate-shake">
            {errorMessage}
          </p>
        )}

        {/* Virtual Keypad */}
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

        {/* Submit action */}
        <button
          onClick={handleManualSubmit}
          disabled={enteredPin.length === 0}
          className={`w-full py-3 rounded-2xl font-black text-sm shadow-md transition cursor-pointer ${
            enteredPin.length > 0
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Desbloquear Administrador
        </button>

      </div>
    </div>
  );
};
