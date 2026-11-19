import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Receipt, 
  ArrowRight, 
  Wallet, 
  CircleDollarSign,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs } from '../utils/formatters';

export const ResultModal: React.FC = () => {
  const { 
    resultModal, 
    closeResultModal, 
    setReceiptModalTx, 
    setActiveTab 
  } = useApp();

  if (!resultModal.isOpen) return null;

  const { isSuccess, title, message, details, transaction } = resultModal;

  const handleGoToCaja = () => {
    closeResultModal();
    setActiveTab('caja');
  };

  const handleViewReceipt = () => {
    closeResultModal();
    if (transaction) {
      setReceiptModalTx(transaction);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
      <div
        className={`bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center border-t-8 relative overflow-hidden ${
          isSuccess ? 'border-emerald-500' : 'border-rose-500'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={closeResultModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Circle */}
        <div
          className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-inner ${
            isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-9 h-9" />
          ) : (
            <XCircle className="w-9 h-9" />
          )}
        </div>

        {/* Title and Message */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-600 mt-1 mb-4">
          {message}
        </p>

        {/* Breakdown Card */}
        {details && (
          <div className="bg-slate-50 rounded-2xl p-3.5 mb-5 text-xs space-y-2 border border-slate-200/90 text-left">
            {details.owner && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Cliente:</span>
                <span className="font-bold text-slate-800">
                  {details.owner} ({details.stickerId})
                </span>
              </div>
            )}

            {details.amountUSD !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">
                  {isSuccess ? 'Monto Procesado:' : 'Total de la Compra:'}
                </span>
                <span
                  className={`font-mono font-black ${
                    isSuccess ? 'text-blue-600' : 'text-slate-900'
                  }`}
                >
                  {formatUSD(details.amountUSD)}
                </span>
              </div>
            )}

            {details.amountBs !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">En Bolívares (BCV):</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatBs(details.amountBs)}
                </span>
              </div>
            )}

            {details.prevBalance !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Saldo Anterior:</span>
                <span className="font-mono font-semibold text-slate-700">
                  {formatUSD(details.prevBalance)}
                </span>
              </div>
            )}

            {details.missingUSD !== undefined && (
              <div className="flex justify-between items-center text-rose-600 font-bold pt-1.5 border-t border-rose-100">
                <span>Faltante para pagar:</span>
                <span className="font-mono font-black text-sm">
                  {formatUSD(details.missingUSD)}
                </span>
              </div>
            )}

            {details.newBalance !== undefined && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-black">Nuevo Saldo NFC:</span>
                <span className="font-mono font-black text-emerald-600 text-sm">
                  {formatUSD(details.newBalance)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {isSuccess && transaction && (
            <button
              onClick={handleViewReceipt}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Ver Comprobante Digital</span>
            </button>
          )}

          {!isSuccess && (
            <button
              onClick={handleGoToCaja}
              className="w-full py-3 px-4 rounded-xl bg-app-primary hover:bg-app-primary-hover text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
            >
              <CircleDollarSign className="w-4 h-4" />
              <span>Ir a Caja a Recargar este Sticker</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={closeResultModal}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95"
          >
            {isSuccess ? 'Continuar' : 'Cerrar'}
          </button>
        </div>

      </div>
    </div>
  );
};
