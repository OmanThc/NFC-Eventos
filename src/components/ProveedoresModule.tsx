import React, { useState, useMemo } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Radio,
  Search,
  Store,
  ShoppingBag,
  ArrowRight,
  Lock,
  Unlock,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUSD, formatBs } from '../utils/formatters';
import { Product } from '../types';

export const ProveedoresModule: React.FC = () => {
  const {
    providers,
    activeProvider,
    openProviderPinPrompt,
    lockProvider,
    setIsNewProviderModalOpen,
    products,
    cart,
    addToCart,
    updateCartQty,
    clearCart,
    cartTotalUSD,
    cartTotalBs,
    cartItemCount,
    openNfcModal,
    setIsProductModalOpen,
    settings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter products strictly to the unlocked provider brand
  const filteredProducts = useMemo(() => {
    if (!activeProvider) return [];
    return products.filter(p => {
      const matchesBrand = p.provider === activeProvider.brandName;
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBrand && matchesSearch;
    });
  }, [products, activeProvider, searchQuery]);

  const handleChargeClick = () => {
    if (cartTotalUSD <= 0) return;

    openNfcModal({
      mode: 'CHARGE',
      amountUSD: cartTotalUSD,
      title: `Cobro en ${activeProvider?.brandName || 'Stand'}`,
      subtitle: `Acerca la etiqueta del cliente para descontar ${formatUSD(cartTotalUSD)}.`,
    });
  };

  // If no provider stand is unlocked yet, show Provider Login & Registration Screen
  if (!activeProvider) {
    return (
      <section className="space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-6 h-6 text-emerald-600" />
              <span>Acceso de Proveedores / Stands</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Cada marca ingresa con su PIN numérico secreto para gestionar sus productos y cobrar con NFC.
            </p>
          </div>

          <button
            onClick={() => setIsNewProviderModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Nuevo Proveedor</span>
          </button>
        </div>

        {providers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
            <Store className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-base text-slate-700">No hay proveedores registrados aún</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Crea el primer proveedor indicando el nombre de su marca, sus productos y su PIN de acceso.
            </p>
            <button
              onClick={() => setIsNewProviderModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primer Proveedor</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map(prov => {
              const brandProducts = products.filter(p => p.provider === prov.brandName);
              return (
                <button
                  key={prov.id}
                  onClick={() => openProviderPinPrompt(prov.id)}
                  className="bg-white hover:border-emerald-500 border border-slate-200/90 rounded-3xl p-6 text-left shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group active:scale-[0.99] cursor-pointer"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition">
                        {prov.emoji || '🏪'}
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Requiere PIN</span>
                      </span>
                    </div>

                    <h3 className="font-black text-lg text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                      {prov.brandName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {brandProducts.length} {brandProducts.length === 1 ? 'producto disponible' : 'productos disponibles'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-black text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Ingresar con PIN</span>
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Top Active Brand Bar */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2">
            <span className="text-2xl">{activeProvider.emoji || '🏪'}</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Unlock className="w-3 h-3" />
                <span>Stand Activo</span>
              </span>
              <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                {activeProvider.brandName}
              </h3>
            </div>
          </div>

          <div className="flex-1 max-w-xs min-w-[160px]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar en este stand..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ring-app-primary focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Agregar Producto</span>
          </button>

          <button
            onClick={() => setIsNewProviderModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>Nuevo Proveedor</span>
          </button>

          <button
            onClick={lockProvider}
            className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Bloquear este stand y cambiar de proveedor"
          >
            <Lock className="w-4 h-4" />
            <span>Cambiar Stand</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Catalog + Order Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Catalog Grid */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-slate-700" />
              <span>Productos de {activeProvider.brandName}</span>
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {filteredProducts.length} productos
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-bold text-base text-slate-600">No hay productos registrados en esta marca</p>
              <p className="text-xs text-slate-400 mt-1">
                Pulsa &quot;Agregar Producto&quot; para añadir artículos al menú de {activeProvider.brandName}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {filteredProducts.map((prod: Product) => {
                const inCart = cart.find(i => i.product.id === prod.id);
                return (
                  <button
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="bg-white hover:border-blue-500 border border-slate-200/90 rounded-2xl p-4 text-left shadow-xs hover:shadow-md transition-all duration-150 flex flex-col justify-between group active:scale-95 cursor-pointer relative overflow-hidden"
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-blue-600 text-white font-black text-[11px] shadow">
                        {inCart.qty} en orden
                      </span>
                    )}

                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-2xl mb-3 transition shadow-inner">
                        {prod.emoji || '📦'}
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2">
                        {prod.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-semibold block mt-1">
                        {prod.provider}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <span className="font-black text-app-primary text-base font-mono block">
                          {formatUSD(prod.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ≈ {formatBs(prod.price * settings.bcvRate)}
                        </span>
                      </div>
                      <span className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-app-primary group-hover:text-white text-slate-700 flex items-center justify-center font-black text-base transition shadow-xs">
                        +
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Customer Order & NFC Charge Terminal */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 sm:p-6 sticky top-28">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-slate-800 text-lg tracking-tight">Orden del Cliente</h3>
              <span className="px-2 py-0.5 rounded-full bg-app-primary text-white text-xs font-black">
                {cartItemCount}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 min-h-[170px] max-h-[300px] overflow-y-auto pr-1 mb-5">
            {cart.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">El carrito de consumo está vacío</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                  Toca productos de {activeProvider.brandName} para armar el pedido antes de escanear la pulsera NFC.
                </p>
              </div>
            ) : (
              cart.map(item => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-2.5 bg-slate-50 hover:bg-slate-100/70 p-3 rounded-2xl border border-slate-200/80 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{item.product.emoji || '🍽️'}</span>
                    <div className="truncate">
                      <p className="font-black text-slate-800 text-xs sm:text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold font-mono">
                        {formatUSD(item.product.price)} c/u
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="w-7 h-7 rounded-xl bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-black text-sm font-mono text-slate-900">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="w-7 h-7 rounded-xl bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-4 space-y-2 text-white">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-medium">Equivalente en Bolívares (BCV):</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {formatBs(cartTotalBs)}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
              <span className="text-sm font-bold text-slate-300">Total a Descontar:</span>
              <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {formatUSD(cartTotalUSD)}
              </span>
            </div>
          </div>

          <button
            onClick={handleChargeClick}
            disabled={cartTotalUSD <= 0}
            className={`w-full py-4 px-5 rounded-2xl font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              cartTotalUSD > 0
                ? 'bg-app-secondary hover:bg-app-secondary-hover text-white shadow-emerald-500/25 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Radio className="w-6 h-6 animate-pulse" />
            <span>LEER NFC Y DESCONTAR</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() =>
              openNfcModal({
                mode: 'QUERY',
                amountUSD: 0,
                title: 'Consultar Saldo de Cliente',
                subtitle: 'Acerca la pulsera del cliente para verificar cuánto saldo tiene disponible antes de ordenar.',
              })
            }
            className="w-full mt-2.5 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>Ver Saldo de Pulsera del Cliente</span>
          </button>
        </div>
      </div>
    </section>
  );
};
