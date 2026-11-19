import React, { useState, useEffect } from 'react';
import { X, Plus, Package, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBs } from '../utils/formatters';

const EMOJI_OPTIONS = [
  { emoji: '🍔', label: 'Hamburguesa' },
  { emoji: '🌭', label: 'Perro Caliente' },
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '🍟', label: 'Papas Fritas' },
  { emoji: '🌮', label: 'Tacos / Arepas' },
  { emoji: '🥩', label: 'Parrilla / Carne' },
  { emoji: '🥤', label: 'Refresco' },
  { emoji: '🍺', label: 'Cerveza' },
  { emoji: '🍹', label: 'Cóctel' },
  { emoji: '☕', label: 'Café' },
  { emoji: '🍩', label: 'Dona / Postre' },
  { emoji: '🍦', label: 'Helado' },
  { emoji: '🍿', label: 'Cotufas / Snacks' },
  { emoji: '🎟️', label: 'Ticket / Brazalete' },
];

export const ProductModal: React.FC = () => {
  const {
    isProductModalOpen,
    setIsProductModalOpen,
    setIsNewProviderModalOpen,
    addProduct,
    providers,
    activeProvider,
    settings,
  } = useApp();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('5.00');
  const [emoji, setEmoji] = useState('🍔');
  const [provider, setProvider] = useState('');

  useEffect(() => {
    if (isProductModalOpen) {
      if (activeProvider) {
        setProvider(activeProvider.brandName);
      } else if (providers.length > 0) {
        setProvider(providers[0].brandName);
      } else {
        setProvider('General');
      }
    }
  }, [isProductModalOpen, activeProvider, providers]);

  if (!isProductModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProvider = activeProvider ? activeProvider.brandName : provider || 'General';
    const finalPrice = parseFloat(price);

    if (!name.trim() || isNaN(finalPrice) || finalPrice <= 0) return;

    addProduct({
      name: name.trim(),
      price: finalPrice,
      emoji,
      provider: finalProvider,
      category: 'General',
    });

    setName('');
    setPrice('5.00');
    setIsProductModalOpen(false);
  };

  const parsedPrice = parseFloat(price) || 0;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Registrar Nuevo Producto
            </h3>
          </div>
          <button
            onClick={() => setIsProductModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre del Producto o Servicio
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="Ej. Hamburguesa Doble con Tocineta"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 ring-app-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Precio en Dólares ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">
                  $
                </span>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  required
                  placeholder="5.00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm font-black text-slate-900 font-mono focus:outline-none focus:ring-2 ring-app-primary"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                ≈ {formatBs(parsedPrice * settings.bcvRate)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Emoji / Icono
              </label>
              <select
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:outline-none focus:ring-2 ring-app-primary"
              >
                {EMOJI_OPTIONS.map(opt => (
                  <option key={opt.emoji} value={opt.emoji}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Provider / Stand */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Marca / Proveedor Asignado
            </label>

            {activeProvider ? (
              <div className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-black text-emerald-800 flex items-center gap-2">
                <span>{activeProvider.emoji}</span>
                <span>{activeProvider.brandName}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={provider}
                  onChange={e => setProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white focus:outline-none focus:ring-2 ring-app-primary"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.brandName}>
                      {p.emoji} {p.brandName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setIsNewProviderModalOpen(true);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>+ Registrar una nueva marca de proveedor con su PIN</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-app-primary hover:bg-app-primary-hover text-white font-black text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Producto en Catálogo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
