import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  X, 
  Delete, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { soundSynth } from '../utils/audio';

export const SuperAdminModal: React.FC = () => {
  const { 
    showSuperAdminModal, 
    setShowSuperAdminModal, 
    loginSuperAdmin 
  } = useApp();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDigits, setShowDigits] = useState<boolean>(false);

  useEffect(() => {
    if (showSuperAdminModal) {
      setEnteredPin('');
      setErrorMessage('');
    }
  }, [showSuperAdminModal]);

  // Support physical keyboard
  useEffect(() => {
    if (!showSuperAdminModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuperAdminModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuperAdminModal, enteredPin]);

  if (!showSuperAdminModal) return null;

  const handleDigitPress = (digit: string) => {
    soundSynth.playClick(true);
    if (enteredPin.length >= 6) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMessage('');

    // When 4 digits are entered, test PIN
    if (nextPin.length === 4) {
      setTimeout(() => {
        const success = loginSuperAdmin(nextPin);
        if (!success) {
          setErrorMessage('Clave maestra incorrecta. Acceso restringido.');
          setEnteredPin('');
        }
      }, 100);
    }
  };

  const handleBackspace = () => {
    soundSynth.playClick(true);
    setEnteredPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleManualSubmit = () => {
    if (!enteredPin) return;
    const success = loginSuperAdmin(enteredPin);
    if (!success) {
      setErrorMessage('Clave maestra incorrecta.');
      setEnteredPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-amber-500/30 text-center relative text-white">
        
        {/* Close Button */}
        <button
          onClick={() => setShowSuperAdminModal(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 mx-auto mb-3 flex items-center justify-center border border-amber-500/30 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
          Control Maestro
        </div>

        <h3 className="text-xl font-black text-white tracking-tight">
          Acceso Administrador Supremo
        </h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Ingresa la clave maestra para auditar todas las empresas, ver transacciones globales y editar los textos de inicio.
        </p>

        {/* Masked PIN Indicator (4 Digits) */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map(idx => {
            const hasDigit = idx < enteredPin.length;
            const digitChar = enteredPin[idx];
            return (
              <div
                key={idx}
                className={`w-11 h-13 rounded-2xl border-2 flex items-center justify-center font-black text-xl transition-all ${
                  hasDigit
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 scale-105 shadow-md shadow-amber-500/10'
                    : 'border-slate-700 bg-slate-800/80 text-slate-500'
                }`}
              >
                {hasDigit ? (showDigits ? digitChar : '●') : ''}
              </div>
            );
          })}
        </div>

        {/* Visibility Toggle (NO PIN DISPLAYED) */}
        <div className="flex items-center justify-end text-xs text-slate-400 mb-4 px-2">
          <button
            type="button"
            onClick={() => setShowDigits(prev => !prev)}
            className="flex items-center gap-1 hover:text-white font-semibold cursor-pointer"
          >
            {showDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showDigits ? 'Ocultar' : 'Mostrar'}</span>
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl mb-4 animate-shake">
            {errorMessage}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigitPress(d)}
              className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 font-black text-xl text-white shadow-xs active:scale-95 transition cursor-pointer select-none"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setEnteredPin('')}
            className="h-12 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-xs font-bold text-slate-400 shadow-xs active:scale-95 transition cursor-pointer select-none"
          >
            Limpiar
          </button>
          <button
            onClick={() => handleDigitPress('0')}
            className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 font-black text-xl text-white shadow-xs active:scale-95 transition cursor-pointer select-none"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleManualSubmit}
          disabled={enteredPin.length === 0}
          className={`w-full py-3 rounded-2xl font-black text-sm shadow-md transition cursor-pointer ${
            enteredPin.length > 0
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Acceder al Panel Maestro
        </button>

      </div>
    </div>
  );
};
