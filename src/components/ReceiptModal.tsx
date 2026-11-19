import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Radio, 
  QrCode 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs, formatDateTime } from '../utils/formatters';

export const ReceiptModal: React.FC = () => {
  const { receiptModalTx, setReceiptModalTx, settings } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!receiptModalTx) return null;

  const tx = receiptModalTx;
  const isRecharge = tx.type === 'RECARGA';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col">
        
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Comprobante Digital
          </span>
          <button
            onClick={() => setReceiptModalTx(null)}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Ticket Style Paper Container */}
        <div
          ref={printRef}
          className="bg-amber-50/40 rounded-2xl p-5 border border-dashed border-slate-300 font-mono text-slate-800 text-xs space-y-3 relative"
        >
          {/* Header */}
          <div className="text-center border-b border-slate-300/80 pb-3">
            <h4 className="font-black text-sm uppercase tracking-tight text-slate-900">
              {settings.appName}
            </h4>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
              {settings.subtitle}
            </p>
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
              {isRecharge ? '★ TICKET DE RECARGA ★' : '★ TICKET DE CONSUMO ★'}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-[11px] border-b border-slate-300/80 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Transacción:</span>
              <span className="font-bold text-slate-900">{tx.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha/Hora:</span>
              <span className="font-semibold">{formatDateTime(tx.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <span className="font-bold">{tx.owner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sticker NFC:</span>
              <span className="font-bold">{tx.stickerId}</span>
            </div>
            {tx.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-slate-500">Pago Recibido:</span>
                <span className="font-semibold text-slate-900">{tx.paymentMethod}</span>
              </div>
            )}
            {tx.provider && (
              <div className="flex justify-between">
                <span className="text-slate-500">Stand:</span>
                <span className="font-semibold text-slate-900">{tx.provider}</span>
              </div>
            )}
          </div>

          {/* Breakdown Items */}
          <div className="space-y-1.5 py-1 border-b border-slate-300/80 pb-3 text-[11px]">
            {tx.cartSnapshot && tx.cartSnapshot.length > 0 ? (
              tx.cartSnapshot.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.qty}x {item.name}
                  </span>
                  <span className="font-bold">{formatUSD(item.price * item.qty)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between">
                <span>{tx.detail}</span>
                <span className="font-bold">{formatUSD(tx.usd)}</span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Tasa Oficial BCV:</span>
              <span className="font-bold">{formatBs(tx.bcvRate)}</span>
            </div>
            <div className="flex justify-between items-baseline font-bold text-sm pt-1 border-t border-slate-300">
              <span>TOTAL (USD):</span>
              <span className="text-base text-slate-900 font-black">{formatUSD(tx.usd)}</span>
            </div>
            <div className="flex justify-between items-baseline font-bold text-xs text-amber-700">
              <span>TOTAL EN BS:</span>
              <span className="font-black">{formatBs(tx.bs)}</span>
            </div>
          </div>

          {/* Barcode/QR simulation */}
          <div className="pt-3 text-center border-t border-slate-300/80">
            <div className="w-16 h-16 mx-auto bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center">
              <QrCode className="w-14 h-14 text-slate-800" />
            </div>
            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">
              Validador Cashless Criptográfico
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={() => setReceiptModalTx(null)}
            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
