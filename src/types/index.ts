export type StickerTagType = 'NTAG215' | 'NTAG213' | 'MIFARE Ultralight' | 'Virtual';

export interface Sticker {
  id: string;
  owner: string;
  balance: number; // in USD
  color: string; // Tailwind gradient classes
  tagType: StickerTagType;
  createdAt: string;
  status: 'active' | 'blocked';
  totalRecharged: number;
  totalSpent: number;
}

export interface Product {
  id: number;
  name: string;
  price: number; // in USD
  emoji: string;
  provider: string;
  category?: string;
  stock?: number;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export type TransactionType = 'RECARGA' | 'CONSUMO' | 'REEMBOLSO';

export type PaymentMethod = 
  | 'Efectivo USD' 
  | 'Pago Móvil (Bs)' 
  | 'Punto de Venta (Bs)' 
  | 'Zelle' 
  | 'Binance Pay';

export interface Transaction {
  id: string;
  type: TransactionType;
  stickerId: string;
  owner: string;
  usd: number;
  bs: number;
  bcvRate: number;
  detail: string;
  provider?: string;
  paymentMethod?: PaymentMethod;
  time: string;
  timestamp: number;
  companyId?: string;
  companyName?: string;
  cartSnapshot?: { name: string; qty: number; price: number; emoji: string; provider?: string }[];
}

export interface AppThemeSettings {
  appName: string;
  subtitle: string;
  bcvRate: number;
  eventCommissionRate: number; // e.g. 10%
  primaryColor: string;
  primaryHoverColor: string;
  secondaryColor: string;
  bgColor: string;
  enableSound: boolean;
  enableVibration: boolean;
}

export type ActiveTab = 'caja' | 'proveedores' | 'admin';

export interface ProviderAccount {
  id: string;
  brandName: string;
  emoji: string;
  pin: string; // Secret numeric PIN (4-8 digits)
  createdAt: string;
}

export interface Company {
  id: string;
  ownerUid?: string;
  name: string;
  slug: string;
  description?: string;
  logoEmoji: string;
  adminPin: string; // Numeric PIN, strictly secret
  cajaPin: string; // Numeric PIN for Caja, strictly secret
  providers: ProviderAccount[]; // Provider brands with secret numeric PINs
  settings: AppThemeSettings;
  stickers: Sticker[];
  products: Product[];
  transactions: Transaction[];
  createdAt: string;
  status?: 'active' | 'suspended';
}

export interface MasterSettings {
  masterPin: string; // Master PIN for Admin Supremo (default: "9999")
  homeTitle: string;
  homeSubtitle: string;
  homeHeroDescription: string;
  homeBannerText: string;
  allowPublicCompanyRegistration: boolean;
}
