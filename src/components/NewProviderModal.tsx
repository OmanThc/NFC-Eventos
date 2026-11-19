import React, { useState } from 'react';
import { X, Plus, Trash2, Store, Lock, Eye, EyeOff, Package } from 'lucide-react';
import { useApp, NewProviderProductDraft } from '../context/AppContext';
import { formatBs } from '../utils/formatters';

const BRAND_EMOJIS = ['🍔', '🍕', '🌭', '🌮', '🍣', '🥩', '🥤', '🍺', '🍹', '☕', '🍩', '🍦', '🧁', '🍿', '🏪'];
const PRODUCT_EMOJIS = ['🍔', '🍟', '🌭', '🍕', '🌮', '🥩', '🥤', '🍺', '🍹', '☕', '🍩', '🍦', '💧', '🍿', '📦'];

export const NewProviderModal: React.FC = () => {
  const {
    isNewProviderModalOpen,
    setIsNewProviderModalOpen,
    addProviderWithProducts,
    settings,
  } = useApp();

  const [brandName, setBrandName] = useState('');
  const [brandEmoji, setBrandEmoji] = useState('🍔');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [draftProducts, setDraftProducts] = useState<NewProviderProductDraft[]>([
    { name: '', price: 5.0, emoji: '🍔', category: 'Comida' },
  ]);

  if (!isNewProviderModalOpen) return null;

  const handleAddRow = () => {
    setDraftProducts(prev => [
      ...prev,
      { name: '', price: 3.0, emoji: '📦', category: 'General' },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (draftProducts.length <= 1) return;
    setDraftProducts(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (
    index: number,
    field: keyof NewProviderProductDraft,
    value: string | number
  ) => {
    setDraftProducts(prev =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanBrand = brandName.trim();
    const cleanPin = pin.replace(/\D/g, '');
    const validProducts = draftProducts.filter(
      p => p.name.trim().length > 0 && Number(p.price) > 0
    );

    if (!cleanBrand) {
      setErrorMsg('Ingresa el nombre de la marca del proveedor.');
      return;
    }
    if (cleanPin.length < 4 || cleanPin.length > 8) {
      setErrorMsg('El PIN secreto del proveedor debe tener entre 4 y 8 dígitos numéricos.');
      return;
    }
    if (validProducts.length === 0) {
      setErrorMsg('Agrega al menos 1 producto con nombre y precio válido para esta marca.');
      return;
    }

    addProviderWithProducts(cleanBrand, brandEmoji, cleanPin, validProducts);

    // Reset form
    setBrandName('');
    setBrandEmoji('🍔');
    setPin('');
    setShowPin(false);
    setDraftProducts([{ name: '', price: 5.0, emoji: '🍔', category: 'Comida' }]);
    setIsNewProviderModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Registrar Nuevo Proveedor
              </h3>
              <p className="text-xs text-slate-500">
                Define la marca, su PIN numérico secreto y los productos que venderá en su stand.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNewProviderModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Brand Name + Secret PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Marca del Proveedor *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="Ej. Arepas El Pana"
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 ring-app-primary"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>PIN Secreto de Acceso *</span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  required
                  minLength={4}
                  maxLength={8}
                  placeholder="4-6 dígitos"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm font-black text-slate-900 font-mono tracking-widest bg-white focus:outline-none focus:ring-2 ring-app-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Clave privada para que esta marca entre a su stand
              </span>
            </div>

            {/* Brand Emoji Picker */}
            <div className="sm:col-span-12">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ícono / Logo de la Marca
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BRAND_EMOJIS.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setBrandEmoji(em)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition cursor-pointer ${
                      brandEmoji === em
                        ? 'bg-blue-600 border-blue-600 scale-105 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Product List for this Brand */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h4 className="font-black text-sm text-slate-800">
                  Productos que venderá esta marca ({draftProducts.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 border border-blue-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Producto</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {draftProducts.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80"
                >
                  <div className="col-span-2 sm:col-span-2">
                    <select
                      value={item.emoji}
                      onChange={e => handleRowChange(idx, 'emoji', e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border border-slate-300 bg-white text-base text-center font-bold"
                    >
                      {PRODUCT_EMOJIS.map(em => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-5 sm:col-span-5">
                    <input
                      type="text"
                      required
                      maxLength={120}
                      placeholder="Nombre del producto"
                      value={item.name}
                      onChange={e => handleRowChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ring-app-primary"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-4">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.10"
                        min="0.10"
                        required
                        value={item.price}
                        onChange={e => handleRowChange(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-6 pr-2 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-black font-mono text-slate-900 focus:outline-none focus:ring-2 ring-app-primary"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block pl-1">
                      ≈ {formatBs((Number(item.price) || 0) * settings.bcvRate)}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      disabled={draftProducts.length <= 1}
                      onClick={() => handleRemoveRow(idx)}
                      className={`p-1.5 rounded-lg transition ${
                        draftProducts.length <= 1
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-rose-500 hover:bg-rose-50 cursor-pointer'
                      }`}
                      title="Quitar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsNewProviderModalOpen(false)}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Proveedor y Productos</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
