import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  BOOTSTRAP_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import {
  Sticker,
  Product,
  CartItem,
  Transaction,
  AppThemeSettings,
  ActiveTab,
  PaymentMethod,
  Company,
  MasterSettings,
  ProviderAccount,
} from '../types';
import { INITIAL_COMPANIES } from '../data/initialCompanies';
import { INITIAL_SETTINGS, INITIAL_MASTER_SETTINGS } from '../data/initialData';
import { soundSynth } from '../utils/audio';
import { formatUSD, formatTime } from '../utils/formatters';

interface NfcModalConfig {
  mode: 'RECHARGE' | 'CHARGE';
  amountUSD: number;
  title: string;
  subtitle: string;
  paymentMethod?: PaymentMethod;
}

interface ResultModalData {
  isOpen: boolean;
  isSuccess: boolean;
  title: string;
  message: string;
  details?: {
    stickerId?: string;
    owner?: string;
    amountUSD?: number;
    amountBs?: number;
    prevBalance?: number;
    newBalance?: number;
    missingUSD?: number;
    detail?: string;
    bcvRate?: number;
  };
  transaction?: Transaction;
}

export interface NewProviderProductDraft {
  name: string;
  price: number;
  emoji: string;
  category?: string;
}

interface AppContextType {
  // Firebase Auth & Sync
  firebaseUser: User | null;
  isAuthReady: boolean;
  isCloudSynced: boolean;
  isCloudLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutGoogle: () => Promise<void>;

  // Master / Super Admin
  masterSettings: MasterSettings;
  updateMasterSettings: (partial: Partial<MasterSettings>) => void;
  isSuperAdminAuthenticated: boolean;
  showSuperAdminModal: boolean;
  setShowSuperAdminModal: (show: boolean) => void;
  isSuperAdminDashboardOpen: boolean;
  setIsSuperAdminDashboardOpen: (open: boolean) => void;
  loginSuperAdmin: (pin: string) => boolean;
  logoutSuperAdmin: () => void;
  updateCompanyPinByMaster: (companyId: string, newPin: string) => void;
  updateCompanyCajaPinByMaster: (companyId: string, newPin: string) => void;
  updateProviderPinByMaster: (companyId: string, providerId: string, newPin: string) => void;
  updateCompanyByMaster: (companyId: string, partial: Partial<Company>) => void;
  enterCompanyAsSuperAdmin: (companyId: string) => void;
  allGlobalTransactions: Transaction[];
  exportGlobalTransactionsCSV: () => void;

  // Company & Multi-tenant
  companies: Company[];
  currentCompany: Company | null;
  loginCompany: (companyId: string) => void;
  logoutCompany: () => void;
  registerCompany: (
    name: string,
    adminPin: string,
    cajaPin: string,
    logoEmoji?: string,
    description?: string,
    initialBcvRate?: number
  ) => Company;
  deleteCompany: (companyId: string) => void;

  // Admin PIN Lock (Company level)
  isAdminUnlocked: boolean;
  unlockAdminWithPin: (pin: string) => boolean;
  lockAdmin: () => void;
  updateAdminPin: (newPin: string) => void;
  showPinModal: boolean;
  setShowPinModal: (show: boolean) => void;

  // Caja PIN Lock (Company level)
  isCajaUnlocked: boolean;
  unlockCajaWithPin: (pin: string) => boolean;
  lockCaja: () => void;
  updateCajaPin: (newPin: string) => void;
  showCajaPinModal: boolean;
  setShowCajaPinModal: (show: boolean) => void;

  // Provider Brand Accounts & PIN Lock
  providers: ProviderAccount[];
  unlockedProviderId: string | null;
  activeProvider: ProviderAccount | null;
  pendingProviderId: string | null;
  showProviderPinModal: boolean;
  openProviderPinPrompt: (providerId: string) => void;
  closeProviderPinPrompt: () => void;
  unlockProviderWithPin: (providerId: string, pin: string) => boolean;
  lockProvider: () => void;
  isNewProviderModalOpen: boolean;
  setIsNewProviderModalOpen: (open: boolean) => void;
  addProviderWithProducts: (
    brandName: string,
    emoji: string,
    pin: string,
    initialProducts: NewProviderProductDraft[]
  ) => ProviderAccount | null;
  updateProviderPin: (providerId: string, newPin: string) => void;
  deleteProviderBrand: (providerId: string) => void;

  // Navigation & Settings
  settings: AppThemeSettings;
  updateSettings: (partial: Partial<AppThemeSettings>) => void;
  resetTheme: () => void;
  setPresetTheme: (primary: string, secondary: string, bg: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  requestNavigateTab: (tab: ActiveTab) => void;

  // Stickers
  stickers: Sticker[];
  addSticker: (owner: string, initialBalance?: number, color?: string) => Sticker;
  updateSticker: (id: string, partial: Partial<Sticker>) => void;
  deleteSticker: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: number, fields: Partial<Product>) => void;
  deleteProduct: (id: number) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQty: (productId: number, delta: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartTotalUSD: number;
  cartTotalBs: number;
  cartItemCount: number;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'time'>) => Transaction;

  // Modals
  isNfcModalOpen: boolean;
  nfcModalConfig: NfcModalConfig | null;
  openNfcModal: (config: NfcModalConfig) => void;
  closeNfcModal: () => void;
  resultModal: ResultModalData;
  closeResultModal: () => void;
  isStickersDrawerOpen: boolean;
  toggleStickersDrawer: () => void;
  setIsStickersDrawerOpen: (open: boolean) => void;
  isProductModalOpen: boolean;
  setIsProductModalOpen: (open: boolean) => void;
  receiptModalTx: Transaction | null;
  setReceiptModalTx: (tx: Transaction | null) => void;
  processNfcTap: (stickerId: string) => Promise<boolean>;

  // Backup & Reset
  resetCurrentCompanyData: () => void;
  exportDataJSON: () => void;
  exportTransactionsCSV: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  COMPANIES: 'paysticker_companies_v4',
  ACTIVE_COMPANY_ID: 'paysticker_active_company_id_v4',
  MASTER_SETTINGS: 'paysticker_master_settings_v2',
};

const sanitizePin = (pin: string, fallback = '1234'): string => {
  const digits = (pin || '').replace(/\D/g, '').slice(0, 8);
  return digits.length >= 4 ? digits : fallback;
};

const sanitizeHex = (hex: string | undefined, fallback: string): string => {
  if (hex && /^#[0-9a-fA-F]{3,8}$/.test(hex.trim())) return hex.trim();
  return fallback;
};

const clampStr = (val: string | undefined, maxLen: number, fallback = ''): string => {
  const trimmed = (val ?? '').trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
};

const normalizeCompany = (c: Partial<Company>): Company => {
  const fallbackProviders: ProviderAccount[] = Array.isArray(c.providers)
    ? c.providers
    : [];
  // Ensure every product's provider exists in providers list
  const prods = Array.isArray(c.products) ? c.products : [];
  const provMap = new Map<string, ProviderAccount>();
  fallbackProviders.forEach(p => provMap.set(p.brandName, p));
  prods.forEach((pr, idx) => {
    if (pr.provider && !provMap.has(pr.provider)) {
      provMap.set(pr.provider, {
        id: `prov-auto-${idx}-${Date.now().toString(36)}`,
        brandName: pr.provider,
        emoji: pr.emoji || '🏪',
        pin: '2026',
        createdAt: c.createdAt || new Date().toISOString().slice(0, 10),
      });
    }
  });

  return {
    id: c.id || `comp-${Date.now().toString(36)}`,
    ownerUid: c.ownerUid,
    name: c.name || 'Empresa',
    slug: c.slug || 'empresa',
    description: c.description || '',
    logoEmoji: c.logoEmoji || '🏢',
    adminPin: c.adminPin || '1234',
    cajaPin: c.cajaPin || '1111',
    providers: Array.from(provMap.values()),
    settings: { ...INITIAL_SETTINGS, ...(c.settings || {}) },
    stickers: Array.isArray(c.stickers) ? c.stickers : [],
    products: prods,
    transactions: Array.isArray(c.transactions) ? c.transactions : [],
    createdAt: c.createdAt || new Date().toISOString().slice(0, 10),
    status: c.status || 'active',
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Firebase Auth state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isCloudSynced = Boolean(firebaseUser && firebaseUser.emailVerified);
  const isBootstrappedAdminUser =
    Boolean(firebaseUser && firebaseUser.emailVerified && firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL);

  // 1. Master Settings state
  const [masterSettings, setMasterSettings] = useState<MasterSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MASTER_SETTINGS);
      return saved ? { ...INITIAL_MASTER_SETTINGS, ...JSON.parse(saved) } : INITIAL_MASTER_SETTINGS;
    } catch {
      return INITIAL_MASTER_SETTINGS;
    }
  });

  // 2. Super Admin Access state
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState<boolean>(false);
  const [isSuperAdminDashboardOpen, setIsSuperAdminDashboardOpen] = useState<boolean>(false);

  // 3. Companies state
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeCompany);
        }
      }
      return INITIAL_COMPANIES.map(normalizeCompany);
    } catch {
      return INITIAL_COMPANIES.map(normalizeCompany);
    }
  });

  // 4. Active Company ID
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID) || null;
    } catch {
      return null;
    }
  });

  const currentCompany = useMemo(() => {
    if (!activeCompanyId) return null;
    return companies.find(c => c.id === activeCompanyId) || null;
  }, [companies, activeCompanyId]);

  // 5. Company-level PIN Locks (Admin, Caja, Provider)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  const [isCajaUnlocked, setIsCajaUnlocked] = useState<boolean>(false);
  const [showCajaPinModal, setShowCajaPinModal] = useState<boolean>(false);

  const [unlockedProviderId, setUnlockedProviderId] = useState<string | null>(null);
  const [pendingProviderId, setPendingProviderId] = useState<string | null>(null);
  const [showProviderPinModal, setShowProviderPinModal] = useState<boolean>(false);
  const [isNewProviderModalOpen, setIsNewProviderModalOpen] = useState<boolean>(false);

  // 6. Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('caja');

  // 7. Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // 8. Modals
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);
  const [nfcModalConfig, setNfcModalConfig] = useState<NfcModalConfig | null>(null);
  const [resultModal, setResultModal] = useState<ResultModalData>({
    isOpen: false,
    isSuccess: true,
    title: '',
    message: '',
  });
  const [isStickersDrawerOpen, setIsStickersDrawerOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [receiptModalTx, setReceiptModalTx] = useState<Transaction | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      soundSynth.playSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setAuthError(msg);
      soundSynth.playError(true);
    }
  }, []);

  const signOutGoogle = useCallback(async () => {
    try {
      await signOut(auth);
      setActiveCompanyId(null);
      setIsAdminUnlocked(false);
      setIsCajaUnlocked(false);
      setUnlockedProviderId(null);
      setCart([]);
      soundSynth.playClick(true);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }, []);

  // Keep subcollection unsubscribe refs cleanly tracked
  const subUnsubsRef = useRef<Map<string, Unsubscribe[]>>(new Map());

  // Seed initial companies into Firestore on first authenticated session if user has none
  const seedUserCompaniesIfEmpty = useCallback(async (user: User) => {
    const companiesCol = collection(db, 'companies');
    const q =
      user.email === BOOTSTRAP_ADMIN_EMAIL
        ? query(companiesCol)
        : query(companiesCol, where('ownerUid', '==', user.uid));

    let snap;
    try {
      snap = await getDocs(q);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'companies');
    }

    if (!snap.empty) return;

    const batch = writeBatch(db);
    const suffix = user.email === BOOTSTRAP_ADMIN_EMAIL ? '' : `-${user.uid.slice(0, 6)}`;

    INITIAL_COMPANIES.forEach(rawComp => {
      const compId = `${rawComp.id}${suffix}`.slice(0, 128);
      const compRef = doc(db, 'companies', compId);
      batch.set(compRef, {
        id: compId,
        ownerUid: user.uid,
        name: rawComp.name.slice(0, 120),
        slug: rawComp.slug.slice(0, 120),
        description: (rawComp.description || '').slice(0, 500),
        logoEmoji: rawComp.logoEmoji.slice(0, 24),
        adminPin: sanitizePin(rawComp.adminPin, '1234'),
        cajaPin: sanitizePin(rawComp.cajaPin, '1111'),
        appName: rawComp.settings.appName.slice(0, 120),
        subtitle: rawComp.settings.subtitle.slice(0, 160),
        bcvRate: rawComp.settings.bcvRate,
        eventCommissionRate: rawComp.settings.eventCommissionRate,
        primaryColor: sanitizeHex(rawComp.settings.primaryColor, '#2563eb'),
        primaryHoverColor: sanitizeHex(rawComp.settings.primaryHoverColor, '#1d4ed8'),
        secondaryColor: sanitizeHex(rawComp.settings.secondaryColor, '#10b981'),
        bgColor: sanitizeHex(rawComp.settings.bgColor, '#f8fafc'),
        enableSound: rawComp.settings.enableSound,
        enableVibration: rawComp.settings.enableVibration,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      rawComp.providers.forEach(prov => {
        const provRef = doc(db, 'companies', compId, 'providers', prov.id);
        batch.set(provRef, {
          id: prov.id,
          companyId: compId,
          ownerUid: user.uid,
          brandName: prov.brandName.slice(0, 100),
          emoji: prov.emoji.slice(0, 24),
          pin: sanitizePin(prov.pin, '2001'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      rawComp.stickers.forEach(st => {
        const stRef = doc(db, 'companies', compId, 'stickers', st.id);
        batch.set(stRef, {
          id: st.id,
          companyId: compId,
          ownerUid: user.uid,
          owner: st.owner.slice(0, 100),
          balance: st.balance,
          color: st.color.slice(0, 80),
          tagType: st.tagType,
          status: st.status,
          totalRecharged: st.totalRecharged,
          totalSpent: st.totalSpent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      rawComp.products.forEach(pr => {
        const prodId = String(pr.id);
        const prRef = doc(db, 'companies', compId, 'products', prodId);
        batch.set(prRef, {
          id: prodId,
          companyId: compId,
          ownerUid: user.uid,
          name: pr.name.slice(0, 120),
          price: pr.price,
          emoji: pr.emoji.slice(0, 24),
          provider: pr.provider.slice(0, 100),
          category: (pr.category || 'General').slice(0, 60),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      rawComp.transactions.forEach(tx => {
        const txRef = doc(db, 'companies', compId, 'transactions', tx.id);
        const payload: Record<string, unknown> = {
          id: tx.id,
          companyId: compId,
          ownerUid: user.uid,
          type: tx.type,
          stickerId: tx.stickerId,
          owner: tx.owner.slice(0, 100),
          usd: tx.usd,
          bs: tx.bs,
          bcvRate: tx.bcvRate,
          detail: tx.detail.slice(0, 500),
          time: tx.time.slice(0, 40),
          timestamp: tx.timestamp,
          createdAt: serverTimestamp(),
        };
        if (tx.provider) payload.provider = tx.provider.slice(0, 100);
        if (tx.paymentMethod) payload.paymentMethod = tx.paymentMethod.slice(0, 60);
        if (tx.cartSnapshot) payload.cartSnapshot = tx.cartSnapshot.slice(0, 50);
        batch.set(txRef, payload);
      });
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'companies/seed');
    }
  }, []);

  // Firestore real-time synchronization when authenticated
  useEffect(() => {
    if (!isAuthReady || !firebaseUser || !firebaseUser.emailVerified) {
      setIsCloudLoading(false);
      return;
    }

    let cancelled = false;
    const unsubs: Unsubscribe[] = [];
    const currentSubUnsubs = subUnsubsRef.current;

    const cleanupSubListeners = () => {
      currentSubUnsubs.forEach(list => list.forEach(u => u()));
      currentSubUnsubs.clear();
    };

    const startSync = async () => {
      setIsCloudLoading(true);

      // 1. Platform config (Master Admin reads /platform/config; others read /platform_public/config)
      if (firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL) {
        const platRef = doc(db, 'platform', 'config');
        const platPubRef = doc(db, 'platform_public', 'config');
        try {
          const platSnap = await getDoc(platRef);
          if (!platSnap.exists()) {
            const batch = writeBatch(db);
            batch.set(platRef, {
              ownerUid: firebaseUser.uid,
              masterPin: INITIAL_MASTER_SETTINGS.masterPin,
              homeTitle: INITIAL_MASTER_SETTINGS.homeTitle,
              homeSubtitle: INITIAL_MASTER_SETTINGS.homeSubtitle,
              homeHeroDescription: INITIAL_MASTER_SETTINGS.homeHeroDescription,
              homeBannerText: INITIAL_MASTER_SETTINGS.homeBannerText,
              allowPublicCompanyRegistration: INITIAL_MASTER_SETTINGS.allowPublicCompanyRegistration,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            batch.set(platPubRef, {
              ownerUid: firebaseUser.uid,
              homeTitle: INITIAL_MASTER_SETTINGS.homeTitle,
              homeSubtitle: INITIAL_MASTER_SETTINGS.homeSubtitle,
              homeHeroDescription: INITIAL_MASTER_SETTINGS.homeHeroDescription,
              homeBannerText: INITIAL_MASTER_SETTINGS.homeBannerText,
              allowPublicCompanyRegistration: INITIAL_MASTER_SETTINGS.allowPublicCompanyRegistration,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            await batch.commit();
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'platform/config');
        }

        const unsubPlat = onSnapshot(
          platRef,
          snap => {
            if (snap.exists()) {
              const d = snap.data();
              setMasterSettings(prev => ({
                ...prev,
                masterPin: d.masterPin || prev.masterPin,
                homeTitle: d.homeTitle || prev.homeTitle,
                homeSubtitle: d.homeSubtitle || prev.homeSubtitle,
                homeHeroDescription: d.homeHeroDescription || prev.homeHeroDescription,
                homeBannerText: d.homeBannerText || prev.homeBannerText,
                allowPublicCompanyRegistration:
                  typeof d.allowPublicCompanyRegistration === 'boolean'
                    ? d.allowPublicCompanyRegistration
                    : prev.allowPublicCompanyRegistration,
              }));
            }
          },
          error => {
            handleFirestoreError(error, OperationType.GET, 'platform/config');
          }
        );
        unsubs.push(unsubPlat);
      } else {
        const platPubRef = doc(db, 'platform_public', 'config');
        const unsubPlatPub = onSnapshot(
          platPubRef,
          snap => {
            if (snap.exists()) {
              const d = snap.data();
              setMasterSettings(prev => ({
                ...prev,
                homeTitle: d.homeTitle || prev.homeTitle,
                homeSubtitle: d.homeSubtitle || prev.homeSubtitle,
                homeHeroDescription: d.homeHeroDescription || prev.homeHeroDescription,
                homeBannerText: d.homeBannerText || prev.homeBannerText,
                allowPublicCompanyRegistration:
                  typeof d.allowPublicCompanyRegistration === 'boolean'
                    ? d.allowPublicCompanyRegistration
                    : prev.allowPublicCompanyRegistration,
              }));
            }
          },
          error => {
            handleFirestoreError(error, OperationType.GET, 'platform_public/config');
          }
        );
        unsubs.push(unsubPlatPub);
      }

      // 2. Seed companies if empty
      await seedUserCompaniesIfEmpty(firebaseUser);
      if (cancelled) return;

      // 3. Subscribe to Companies
      const companiesQuery =
        firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL
          ? query(collection(db, 'companies'))
          : query(collection(db, 'companies'), where('ownerUid', '==', firebaseUser.uid));

      const unsubCompanies = onSnapshot(
        companiesQuery,
        snapshot => {
          const docsMap = new Map<string, Company>();
          const activeIds = new Set<string>();

          snapshot.docs.forEach(docSnap => {
            const d = docSnap.data();
            const cid = docSnap.id;
            activeIds.add(cid);

            docsMap.set(cid, {
              id: cid,
              ownerUid: d.ownerUid,
              name: d.name,
              slug: d.slug,
              description: d.description || '',
              logoEmoji: d.logoEmoji || '🏢',
              adminPin: d.adminPin || '1234',
              cajaPin: d.cajaPin || '1111',
              providers: [],
              settings: {
                appName: d.appName || d.name,
                subtitle: d.subtitle || 'Sistema Cashless & Tasa BCV',
                bcvRate: Number(d.bcvRate) || 52.4,
                eventCommissionRate: Number(d.eventCommissionRate ?? 8),
                primaryColor: d.primaryColor || '#2563eb',
                primaryHoverColor: d.primaryHoverColor || d.primaryColor || '#1d4ed8',
                secondaryColor: d.secondaryColor || '#10b981',
                bgColor: d.bgColor || '#f8fafc',
                enableSound: typeof d.enableSound === 'boolean' ? d.enableSound : true,
                enableVibration: typeof d.enableVibration === 'boolean' ? d.enableVibration : true,
              },
              stickers: [],
              products: [],
              transactions: [],
              createdAt:
                d.createdAt && typeof d.createdAt.toDate === 'function'
                  ? d.createdAt.toDate().toISOString().slice(0, 10)
                  : new Date().toISOString().slice(0, 10),
              status: d.status || 'active',
            });
          });

          setCompanies(prev => {
            const prevById = new Map(prev.map(c => [c.id, c]));
            return Array.from(docsMap.values()).map(nextComp => {
              const old = prevById.get(nextComp.id);
              return old
                ? {
                    ...nextComp,
                    providers: old.providers,
                    stickers: old.stickers,
                    products: old.products,
                    transactions: old.transactions,
                  }
                : nextComp;
            });
          });

          // Remove listeners for deleted companies
          currentSubUnsubs.forEach((list, cid) => {
            if (!activeIds.has(cid)) {
              list.forEach(u => u());
              currentSubUnsubs.delete(cid);
            }
          });

          // Attach subcollection listeners for new companies
          activeIds.forEach(cid => {
            if (currentSubUnsubs.has(cid)) return;
            const companySubUnsubs: Unsubscribe[] = [];
            const isAdminEmail = firebaseUser.email === BOOTSTRAP_ADMIN_EMAIL;

            const makeSubQuery = (subName: string) => {
              const colRef = collection(db, 'companies', cid, subName);
              return isAdminEmail ? query(colRef) : query(colRef, where('ownerUid', '==', firebaseUser.uid));
            };

            // Providers
            companySubUnsubs.push(
              onSnapshot(
                makeSubQuery('providers'),
                subSnap => {
                  const list: ProviderAccount[] = subSnap.docs.map(s => {
                    const sd = s.data();
                    return {
                      id: s.id,
                      brandName: sd.brandName,
                      emoji: sd.emoji || '🏪',
                      pin: sd.pin || '2001',
                      createdAt:
                        sd.createdAt && typeof sd.createdAt.toDate === 'function'
                          ? sd.createdAt.toDate().toISOString().slice(0, 10)
                          : new Date().toISOString().slice(0, 10),
                    };
                  });
                  setCompanies(prev => prev.map(c => (c.id === cid ? { ...c, providers: list } : c)));
                },
                error => handleFirestoreError(error, OperationType.LIST, `companies/${cid}/providers`)
              )
            );

            // Stickers
            companySubUnsubs.push(
              onSnapshot(
                makeSubQuery('stickers'),
                subSnap => {
                  const list: Sticker[] = subSnap.docs.map(s => {
                    const sd = s.data();
                    return {
                      id: s.id,
                      owner: sd.owner,
                      balance: Number(sd.balance) || 0,
                      color: sd.color || 'from-blue-600 to-indigo-700',
                      tagType: sd.tagType || 'NTAG215',
                      status: sd.status || 'active',
                      totalRecharged: Number(sd.totalRecharged) || 0,
                      totalSpent: Number(sd.totalSpent) || 0,
                      createdAt:
                        sd.createdAt && typeof sd.createdAt.toDate === 'function'
                          ? sd.createdAt.toDate().toISOString().slice(0, 16).replace('T', ' ')
                          : new Date().toISOString().slice(0, 16).replace('T', ' '),
                    };
                  });
                  setCompanies(prev => prev.map(c => (c.id === cid ? { ...c, stickers: list } : c)));
                },
                error => handleFirestoreError(error, OperationType.LIST, `companies/${cid}/stickers`)
              )
            );

            // Products
            companySubUnsubs.push(
              onSnapshot(
                makeSubQuery('products'),
                subSnap => {
                  const list: Product[] = subSnap.docs.map(s => {
                    const sd = s.data();
                    const numericId = Number(s.id);
                    return {
                      id: !Number.isNaN(numericId) ? numericId : Math.abs(s.id.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7)),
                      name: sd.name,
                      price: Number(sd.price) || 0,
                      emoji: sd.emoji || '📦',
                      provider: sd.provider,
                      category: sd.category || 'General',
                      stock: sd.stock,
                    };
                  });
                  setCompanies(prev => prev.map(c => (c.id === cid ? { ...c, products: list } : c)));
                },
                error => handleFirestoreError(error, OperationType.LIST, `companies/${cid}/products`)
              )
            );

            // Transactions
            companySubUnsubs.push(
              onSnapshot(
                makeSubQuery('transactions'),
                subSnap => {
                  const list: Transaction[] = subSnap.docs
                    .map(s => {
                      const sd = s.data();
                      return {
                        id: s.id,
                        type: sd.type,
                        stickerId: sd.stickerId,
                        owner: sd.owner,
                        usd: Number(sd.usd) || 0,
                        bs: Number(sd.bs) || 0,
                        bcvRate: Number(sd.bcvRate) || 52.4,
                        detail: sd.detail,
                        provider: sd.provider,
                        paymentMethod: sd.paymentMethod,
                        time: sd.time,
                        timestamp: Number(sd.timestamp) || Date.now(),
                        cartSnapshot: sd.cartSnapshot,
                      } as Transaction;
                    })
                    .sort((a, b) => b.timestamp - a.timestamp);
                  setCompanies(prev => prev.map(c => (c.id === cid ? { ...c, transactions: list } : c)));
                },
                error => handleFirestoreError(error, OperationType.LIST, `companies/${cid}/transactions`)
              )
            );

            currentSubUnsubs.set(cid, companySubUnsubs);
          });

          setIsCloudLoading(false);
        },
        error => {
          setIsCloudLoading(false);
          handleFirestoreError(error, OperationType.LIST, 'companies');
        }
      );
      unsubs.push(unsubCompanies);
    };

    void startSync();

    return () => {
      cancelled = true;
      unsubs.forEach(u => u());
      cleanupSubListeners();
    };
  }, [isAuthReady, firebaseUser, seedUserCompaniesIfEmpty]);

  // LocalStorage fallback sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MASTER_SETTINGS, JSON.stringify(masterSettings));
    } catch {
      // ignore
    }
  }, [masterSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    } catch {
      // ignore
    }
  }, [companies]);

  useEffect(() => {
    try {
      if (activeCompanyId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, activeCompanyId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);
      }
    } catch {
      // ignore
    }
  }, [activeCompanyId]);

  // Dynamic Theme CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    if (currentCompany) {
      root.style.setProperty('--color-primary', currentCompany.settings.primaryColor);
      root.style.setProperty('--color-primary-hover', currentCompany.settings.primaryHoverColor || currentCompany.settings.primaryColor);
      root.style.setProperty('--color-secondary', currentCompany.settings.secondaryColor);
      root.style.setProperty('--color-bg', currentCompany.settings.bgColor);
    } else {
      root.style.setProperty('--color-primary', '#2563eb');
      root.style.setProperty('--color-primary-hover', '#1d4ed8');
      root.style.setProperty('--color-secondary', '#10b981');
      root.style.setProperty('--color-bg', '#090d16');
    }
  }, [currentCompany]);

  // Helper to update active company locally
  const updateCurrentCompany = useCallback((updater: (comp: Company) => Company) => {
    if (!activeCompanyId) return;
    setCompanies(prev => prev.map(c => (c.id === activeCompanyId ? updater(c) : c)));
  }, [activeCompanyId]);

  // Helper: get ownerUid for writes
  const getCompanyOwnerUid = useCallback(
    (company: Company): string => {
      return company.ownerUid || firebaseUser?.uid || '';
    },
    [firebaseUser]
  );

  // Master / Super Admin methods
  const updateMasterSettings = useCallback(
    (partial: Partial<MasterSettings>) => {
      setMasterSettings(prev => {
        const next = { ...prev, ...partial };
        if (isCloudSynced && isBootstrappedAdminUser && firebaseUser) {
          const batch = writeBatch(db);
          batch.update(doc(db, 'platform', 'config'), {
            masterPin: sanitizePin(next.masterPin, '9999'),
            homeTitle: clampStr(next.homeTitle, 200, INITIAL_MASTER_SETTINGS.homeTitle),
            homeSubtitle: clampStr(next.homeSubtitle, 200, INITIAL_MASTER_SETTINGS.homeSubtitle),
            homeHeroDescription: clampStr(next.homeHeroDescription, 600, INITIAL_MASTER_SETTINGS.homeHeroDescription),
            homeBannerText: clampStr(next.homeBannerText, 200, INITIAL_MASTER_SETTINGS.homeBannerText),
            allowPublicCompanyRegistration: Boolean(next.allowPublicCompanyRegistration),
            updatedAt: serverTimestamp(),
          });
          batch.update(doc(db, 'platform_public', 'config'), {
            homeTitle: clampStr(next.homeTitle, 200, INITIAL_MASTER_SETTINGS.homeTitle),
            homeSubtitle: clampStr(next.homeSubtitle, 200, INITIAL_MASTER_SETTINGS.homeSubtitle),
            homeHeroDescription: clampStr(next.homeHeroDescription, 600, INITIAL_MASTER_SETTINGS.homeHeroDescription),
            homeBannerText: clampStr(next.homeBannerText, 200, INITIAL_MASTER_SETTINGS.homeBannerText),
            allowPublicCompanyRegistration: Boolean(next.allowPublicCompanyRegistration),
            updatedAt: serverTimestamp(),
          });
          batch.commit().catch(err => handleFirestoreError(err, OperationType.UPDATE, 'platform/config'));
        }
        return next;
      });
      soundSynth.playSuccess(true);
    },
    [isCloudSynced, isBootstrappedAdminUser, firebaseUser]
  );

  const loginSuperAdmin = useCallback((pin: string): boolean => {
    const isCorrect = pin.trim() === masterSettings.masterPin.trim();
    if (isCorrect) {
      setIsSuperAdminAuthenticated(true);
      setShowSuperAdminModal(false);
      setIsSuperAdminDashboardOpen(true);
      soundSynth.playSuccess(true);
      return true;
    } else {
      soundSynth.playError(true);
      return false;
    }
  }, [masterSettings.masterPin]);

  const logoutSuperAdmin = useCallback(() => {
    setIsSuperAdminAuthenticated(false);
    setIsSuperAdminDashboardOpen(false);
    soundSynth.playClick(true);
  }, []);

  const updateCompanyPinByMaster = useCallback(
    (companyId: string, newPin: string) => {
      const cleaned = sanitizePin(newPin, '');
      if (!cleaned) return;
      setCompanies(prev => prev.map(c => (c.id === companyId ? { ...c, adminPin: cleaned } : c)));
      if (isCloudSynced) {
        updateDoc(doc(db, 'companies', companyId), {
          adminPin: cleaned,
          updatedAt: serverTimestamp(),
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `companies/${companyId}`));
      }
      soundSynth.playSuccess(true);
    },
    [isCloudSynced]
  );

  const updateCompanyCajaPinByMaster = useCallback(
    (companyId: string, newPin: string) => {
      const cleaned = sanitizePin(newPin, '');
      if (!cleaned) return;
      setCompanies(prev => prev.map(c => (c.id === companyId ? { ...c, cajaPin: cleaned } : c)));
      if (isCloudSynced) {
        updateDoc(doc(db, 'companies', companyId), {
          cajaPin: cleaned,
          updatedAt: serverTimestamp(),
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `companies/${companyId}`));
      }
      soundSynth.playSuccess(true);
    },
    [isCloudSynced]
  );

  const updateProviderPinByMaster = useCallback(
    (companyId: string, providerId: string, newPin: string) => {
      const cleaned = sanitizePin(newPin, '');
      if (!cleaned) return;
      setCompanies(prev =>
        prev.map(c =>
          c.id === companyId
            ? {
                ...c,
                providers: c.providers.map(p => (p.id === providerId ? { ...p, pin: cleaned } : p)),
              }
            : c
        )
      );
      if (isCloudSynced) {
        updateDoc(doc(db, 'companies', companyId, 'providers', providerId), {
          pin: cleaned,
          updatedAt: serverTimestamp(),
        }).catch(err =>
          handleFirestoreError(err, OperationType.UPDATE, `companies/${companyId}/providers/${providerId}`)
        );
      }
      soundSynth.playSuccess(true);
    },
    [isCloudSynced]
  );

  const updateCompanyByMaster = useCallback(
    (companyId: string, partial: Partial<Company>) => {
      setCompanies(prev => prev.map(c => (c.id === companyId ? { ...c, ...partial } : c)));
      if (isCloudSynced && partial.status) {
        updateDoc(doc(db, 'companies', companyId), {
          status: partial.status,
          updatedAt: serverTimestamp(),
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `companies/${companyId}`));
      }
      soundSynth.playSuccess(true);
    },
    [isCloudSynced]
  );

  const enterCompanyAsSuperAdmin = useCallback((companyId: string) => {
    const target = companies.find(c => c.id === companyId);
    if (!target) return;
    setActiveCompanyId(companyId);
    setIsAdminUnlocked(true);
    setIsCajaUnlocked(true);
    setUnlockedProviderId(null);
    setIsSuperAdminDashboardOpen(false);
    setActiveTab('admin');
    setCart([]);
    soundSynth.playSuccess(true);
  }, [companies]);

  // Consolidated global transactions across all companies
  const allGlobalTransactions = useMemo(() => {
    const list: Transaction[] = [];
    companies.forEach(comp => {
      comp.transactions.forEach(tx => {
        list.push({
          ...tx,
          companyId: comp.id,
          companyName: comp.name,
        });
      });
    });
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [companies]);

  const exportGlobalTransactionsCSV = useCallback(() => {
    const headers = ['ID', 'Empresa', 'Tipo', 'Sticker ID', 'Cliente', 'Monto USD', 'Monto Bs', 'Tasa BCV', 'Detalle', 'Metodo/Stand', 'Hora'];
    const rows = allGlobalTransactions.map(t => [
      t.id,
      `"${(t.companyName || '').replace(/"/g, '""')}"`,
      t.type,
      t.stickerId,
      `"${t.owner.replace(/"/g, '""')}"`,
      t.usd.toFixed(2),
      t.bs.toFixed(2),
      t.bcvRate.toFixed(2),
      `"${t.detail.replace(/"/g, '""')}"`,
      `"${(t.paymentMethod || t.provider || '').replace(/"/g, '""')}"`,
      `"${t.time}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_global_admin_supremo_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [allGlobalTransactions]);

  // Company management
  const loginCompany = useCallback((companyId: string) => {
    const target = companies.find(c => c.id === companyId);
    if (!target) return;
    setActiveCompanyId(companyId);
    setIsAdminUnlocked(false);
    setIsCajaUnlocked(false);
    setUnlockedProviderId(null);
    setPendingProviderId(null);
    setShowProviderPinModal(false);
    setActiveTab('caja');
    setCart([]);
    soundSynth.playSuccess(target.settings.enableSound ?? true);
  }, [companies]);

  const logoutCompany = useCallback(() => {
    setActiveCompanyId(null);
    setIsAdminUnlocked(false);
    setIsCajaUnlocked(false);
    setUnlockedProviderId(null);
    setPendingProviderId(null);
    setShowProviderPinModal(false);
    setCart([]);
    soundSynth.playClick(true);
  }, []);

  const registerCompany = useCallback(
    (
      name: string,
      adminPin: string,
      cajaPin: string,
      logoEmoji: string = '🏪',
      description: string = '',
      initialBcvRate: number = 52.4
    ): Company => {
      const id = `comp-${Date.now().toString(36)}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;
      const cleanAdminPin = sanitizePin(adminPin, '1234');
      const cleanCajaPin = sanitizePin(cajaPin, '1111');
      const cleanBcv = initialBcvRate > 0 ? Number(initialBcvRate.toFixed(2)) : 52.4;
      const today = new Date().toISOString().slice(0, 10);

      const defaultProviders: ProviderAccount[] = [
        { id: `prov-${Date.now().toString(36)}-1`, brandName: 'Stand Principal', emoji: '🍔', pin: '2001', createdAt: today },
        { id: `prov-${Date.now().toString(36)}-2`, brandName: 'Barra de Bebidas', emoji: '🥤', pin: '2002', createdAt: today },
      ];

      const prod1Id = Date.now() + 1;
      const prod2Id = Date.now() + 2;

      const newCompany: Company = {
        id,
        ownerUid: firebaseUser?.uid,
        name: clampStr(name, 120, 'Nueva Empresa'),
        slug: clampStr(slug, 120, id),
        description: clampStr(description, 500, 'Sistema de gestión de caja, proveedores y control NFC.'),
        logoEmoji: clampStr(logoEmoji, 24, '🏪'),
        adminPin: cleanAdminPin,
        cajaPin: cleanCajaPin,
        providers: defaultProviders,
        createdAt: today,
        status: 'active',
        settings: {
          ...INITIAL_SETTINGS,
          appName: clampStr(name, 120, 'Nueva Empresa'),
          subtitle: 'Cashless Oficial & Tasa BCV',
          bcvRate: cleanBcv,
          primaryColor: '#2563eb',
          primaryHoverColor: '#1d4ed8',
          secondaryColor: '#10b981',
          bgColor: '#f8fafc',
        },
        stickers: [
          {
            id: 'NFC-001',
            owner: 'Cliente Demo (VIP)',
            balance: 20.0,
            color: 'from-blue-600 to-indigo-700',
            tagType: 'NTAG215',
            createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            status: 'active',
            totalRecharged: 20.0,
            totalSpent: 0.0,
          },
        ],
        products: [
          { id: prod1Id, name: 'Combo Especial de Bienvenida', price: 5.0, emoji: '🍔', provider: 'Stand Principal', category: 'Comida' },
          { id: prod2Id, name: 'Bebida Refrescante 400ml', price: 2.0, emoji: '🥤', provider: 'Barra de Bebidas', category: 'Bebidas' },
        ],
        transactions: [],
      };

      setCompanies(prev => [newCompany, ...prev]);

      if (isCloudSynced && firebaseUser) {
        const batch = writeBatch(db);
        batch.set(doc(db, 'companies', id), {
          id,
          ownerUid: firebaseUser.uid,
          name: newCompany.name,
          slug: newCompany.slug,
          description: newCompany.description || '',
          logoEmoji: newCompany.logoEmoji,
          adminPin: newCompany.adminPin,
          cajaPin: newCompany.cajaPin,
          appName: newCompany.settings.appName,
          subtitle: newCompany.settings.subtitle,
          bcvRate: newCompany.settings.bcvRate,
          eventCommissionRate: newCompany.settings.eventCommissionRate,
          primaryColor: newCompany.settings.primaryColor,
          primaryHoverColor: newCompany.settings.primaryHoverColor,
          secondaryColor: newCompany.settings.secondaryColor,
          bgColor: newCompany.settings.bgColor,
          enableSound: newCompany.settings.enableSound,
          enableVibration: newCompany.settings.enableVibration,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        defaultProviders.forEach(prov => {
          batch.set(doc(db, 'companies', id, 'providers', prov.id), {
            id: prov.id,
            companyId: id,
            ownerUid: firebaseUser.uid,
            brandName: prov.brandName,
            emoji: prov.emoji,
            pin: prov.pin,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        newCompany.stickers.forEach(st => {
          batch.set(doc(db, 'companies', id, 'stickers', st.id), {
            id: st.id,
            companyId: id,
            ownerUid: firebaseUser.uid,
            owner: st.owner,
            balance: st.balance,
            color: st.color,
            tagType: st.tagType,
            status: st.status,
            totalRecharged: st.totalRecharged,
            totalSpent: st.totalSpent,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        newCompany.products.forEach(pr => {
          const pId = String(pr.id);
          batch.set(doc(db, 'companies', id, 'products', pId), {
            id: pId,
            companyId: id,
            ownerUid: firebaseUser.uid,
            name: pr.name,
            price: pr.price,
            emoji: pr.emoji,
            provider: pr.provider,
            category: pr.category || 'General',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        batch.commit().catch(err => handleFirestoreError(err, OperationType.CREATE, `companies/${id}`));
      }

      setActiveCompanyId(newCompany.id);
      setIsAdminUnlocked(false);
      setIsCajaUnlocked(false);
      setUnlockedProviderId(null);
      setActiveTab('caja');
      setCart([]);
      soundSynth.playSuccess(true);
      return newCompany;
    },
    [firebaseUser, isCloudSynced]
  );

  const deleteCompany = useCallback(
    (companyId: string) => {
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      if (isCloudSynced) {
        deleteDoc(doc(db, 'companies', companyId)).catch(err =>
          handleFirestoreError(err, OperationType.DELETE, `companies/${companyId}`)
        );
      }
      if (activeCompanyId === companyId) {
        logoutCompany();
      }
    },
    [activeCompanyId, logoutCompany, isCloudSynced]
  );

  // Company Admin PIN authorization
  const unlockAdminWithPin = useCallback(
    (pin: string): boolean => {
      if (!currentCompany) return false;
      const isCorrect =
        pin.trim() === currentCompany.adminPin.trim() || pin.trim() === masterSettings.masterPin.trim();
      if (isCorrect) {
        setIsAdminUnlocked(true);
        setShowPinModal(false);
        setActiveTab('admin');
        soundSynth.playSuccess(currentCompany.settings.enableSound);
        return true;
      } else {
        soundSynth.playError(currentCompany.settings.enableSound);
        return false;
      }
    },
    [currentCompany, masterSettings.masterPin]
  );

  const lockAdmin = useCallback(() => {
    setIsAdminUnlocked(false);
    if (activeTab === 'admin') {
      setActiveTab('caja');
    }
    soundSynth.playClick(currentCompany?.settings.enableSound ?? true);
  }, [activeTab, currentCompany]);

  const updateAdminPin = useCallback(
    (newPin: string) => {
      const cleaned = sanitizePin(newPin, '');
      if (!cleaned || !currentCompany) return;
      updateCurrentCompany(c => ({
        ...c,
        adminPin: cleaned,
      }));
      if (isCloudSynced) {
        updateDoc(doc(db, 'companies', currentCompany.id), {
          adminPin: cleaned,
          updatedAt: serverTimestamp(),
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `companies/${currentCompany.id}`));
      }
      soundSynth.playSuccess(currentCompany.settings.enableSound ?? true);
    },
    [updateCurrentCompany, currentCompany, isCloudSynced]
  );

  // Company Caja PIN authorization
  const unlockCajaWithPin = useCallback(
    (pin: string): boolean => {
      if (!currentCompany) return false;
      const isCorrect =
        pin.trim() === (currentCompany.cajaPin || '1111').trim() ||
        pin.trim() === masterSettings.masterPin.trim();
      if (isCorrect) {
        setIsCajaUnlocked(true);
        setShowCajaPinModal(false);
        soundSynth.playSuccess(currentCompany.settings.enableSound);
        return true;
      } else {
        soundSynth.playError(currentCompany.settings.enableSound);
        return false;
      }
    },
    [currentCompany, masterSettings.masterPin]
  );

  const lockCaja = useCallback(() => {
    setIsCajaUnlocked(false);
    soundSynth.playClick(currentCompany?.settings.enableSound ?? true);
  }, [currentCompany]);

  const updateCajaPin = useCallback(
    (newPin: string) => {
      const cleaned = sanitizePin(newPin, '');
      if (!cleaned || !currentCompany) return;
      updateCurrentCompany(c => ({
        ...c,
        cajaPin: cleaned,
      }));
      if (isCloudSynced) {
        updateDoc(doc(db, 'companies', currentCompany.id), {
          cajaPin: cleaned,
          updatedAt: serverTimestamp(),
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `companies/${currentCompany.id}`));
      }
      soundSynth.playSuccess(currentCompany.settings.enableSound ?? true);
    },
    [updateCurrentCompany, currentCompany, isCloudSynced]
  );

  // Provider Brands & PIN authorization
  const providers = useMemo(() => {
    return currentCompany ? currentCompany.providers : [];
  }, [currentCompany]);

  const activeProvider = useMemo(() => {
    if (!unlockedProviderId) return null;
    return providers.find(p => p.id === unlockedProviderId) || null;
  }, [providers, unlockedProviderId]);

  const openProviderPinPrompt = useCallback((providerId: string) => {
    setPendingProviderId(providerId);
    setShowProviderPinModal(true);
  }, []);

  const closeProviderPinPrompt = useCallback(() => {
    setShowProviderPinModal(false);
    setPendingProviderId(null);
  }, []);

  const unlockProviderWithPin = useCallback(
    (providerId: string, pin: string): boolean => {
      if (!currentCompany) return false;
      const target = currentCompany.providers.find(p => p.id === providerId);
      if (!target) return false;
      const isCorrect =
        pin.trim() === target.pin.trim() || pin.trim() === masterSettings.masterPin.trim();
      if (isCorrect) {
        setUnlockedProviderId(providerId);
        setShowProviderPinModal(false);
        setPendingProviderId(null);
        setCart([]);
        soundSynth.playSuccess(currentCompany.settings.enableSound);
        return true;
      } else {
        soundSynth.playError(currentCompany.settings.enableSound);
        return false;
      }
    },
    [currentCompany, masterSettings.masterPin]
  );

  const lockProvider = useCallback(() => {
    setUnlockedProviderId(null);
    setCart([]);
    soundSynth.playClick(currentCompany?.settings.enableSound ?? true);
  }, [currentCompany]);

  const addProviderWithProducts = useCallback(
    (
      brandName: string,
      emoji: string,
      pin: string,
      initialProducts: NewProviderProductDraft[]
    ): ProviderAccount | null => {
      if (!currentCompany) return null;
      const cleanBrand = clampStr(brandName, 100);
      if (!cleanBrand) return null;

      const cleanEmoji = clampStr(emoji, 24, '🏪');
      const cleanPin = sanitizePin(pin, '2001');
      const provId = `prov-${Date.now().toString(36)}`;
      const today = new Date().toISOString().slice(0, 10);

      const newProvider: ProviderAccount = {
        id: provId,
        brandName: cleanBrand,
        emoji: cleanEmoji,
        pin: cleanPin,
        createdAt: today,
      };

      const baseTimestamp = Date.now();
      const newProducts: Product[] = initialProducts
        .filter(item => item.name.trim().length > 0 && Number(item.price) > 0)
        .map((item, idx) => ({
          id: baseTimestamp + idx + 1,
          name: clampStr(item.name, 120),
          price: Math.max(0.1, Number(Number(item.price).toFixed(2))),
          emoji: clampStr(item.emoji, 24, '📦'),
          provider: cleanBrand,
          category: clampStr(item.category, 60, 'General'),
        }));

      updateCurrentCompany(c => ({
        ...c,
        providers: [...c.providers, newProvider],
        products: [...newProducts, ...c.products],
      }));

      if (isCloudSynced && firebaseUser) {
        const ownerUid = getCompanyOwnerUid(currentCompany) || firebaseUser.uid;
        const batch = writeBatch(db);
        batch.set(doc(db, 'companies', currentCompany.id, 'providers', provId), {
          id: provId,
          companyId: currentCompany.id,
          ownerUid,
          brandName: newProvider.brandName,
          emoji: newProvider.emoji,
          pin: newProvider.pin,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        newProducts.forEach(pr => {
          const pId = String(pr.id);
          batch.set(doc(db, 'companies', currentCompany.id, 'products', pId), {
            id: pId,
            companyId: currentCompany.id,
            ownerUid,
            name: pr.name,
            price: pr.price,
            emoji: pr.emoji,
            provider: pr.provider,
            category: pr.category || 'General',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        batch.commit().catch(err =>
          handleFirestoreError(err, OperationType.CREATE, `companies/${currentCompany.id}/providers/${provId}`)
        );
      }

      soundSynth.playSuccess(currentCompany.settings.enableSound);
      return newProvider;
    },
    [currentCompany, updateCurrentCompany, isCloudSynced, firebaseUser, getCompanyOwnerUid]
  );

  const updateProviderPin = useCallback(
    (providerId: string, newPin: string) => {
      const cleaned = sanitizePin(newPin, '');
      if (!cleaned || !currentCompany) return;
      updateCurrentCompany(c => ({
        ...c,
        providers: c.providers.map(p => (p.id === providerId ? { ...p, pin: cleaned } : p)),
      }));
      if (isCloudSynced) {
        updateDoc(doc(db, 'companies', currentCompany.id, 'providers', providerId), {
          pin: cleaned,
          updatedAt: serverTimestamp(),
        }).catch(err =>
          handleFirestoreError(err, OperationType.UPDATE, `companies/${currentCompany.id}/providers/${providerId}`)
        );
      }
      soundSynth.playSuccess(currentCompany.settings.enableSound);
    },
    [currentCompany, updateCurrentCompany, isCloudSynced]
  );

  const deleteProviderBrand = useCallback(
    (providerId: string) => {
      if (!currentCompany) return;
      const target = currentCompany.providers.find(p => p.id === providerId);
      if (!target) return;

      const productsToRemove = currentCompany.products.filter(p => p.provider === target.brandName);
      updateCurrentCompany(c => ({
        ...c,
        providers: c.providers.filter(p => p.id !== providerId),
        products: c.products.filter(p => p.provider !== target.brandName),
      }));

      if (unlockedProviderId === providerId) {
        setUnlockedProviderId(null);
        setCart([]);
      }

      if (isCloudSynced) {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'companies', currentCompany.id, 'providers', providerId));
        productsToRemove.forEach(pr => {
          batch.delete(doc(db, 'companies', currentCompany.id, 'products', String(pr.id)));
        });
        batch.commit().catch(err =>
          handleFirestoreError(err, OperationType.DELETE, `companies/${currentCompany.id}/providers/${providerId}`)
        );
      }
    },
    [currentCompany, updateCurrentCompany, unlockedProviderId, isCloudSynced]
  );

  const requestNavigateTab = useCallback(
    (tab: ActiveTab) => {
      if (tab === 'admin') {
        if (isAdminUnlocked) {
          setActiveTab('admin');
        } else {
          setShowPinModal(true);
        }
      } else {
        setActiveTab(tab);
      }
    },
    [isAdminUnlocked]
  );

  // Settings & Theme for active company
  const settings = useMemo(() => {
    return currentCompany ? currentCompany.settings : INITIAL_SETTINGS;
  }, [currentCompany]);

  const updateSettings = useCallback(
    (partial: Partial<AppThemeSettings>) => {
      if (!currentCompany) return;
      const merged = { ...currentCompany.settings, ...partial };
      updateCurrentCompany(c => ({
        ...c,
        settings: merged,
      }));
      if (isCloudSynced) {
        const payload: Record<string, unknown> = {
          appName: clampStr(merged.appName, 120, currentCompany.name),
          subtitle: clampStr(merged.subtitle, 160, 'Sistema Cashless & Tasa BCV'),
          bcvRate: merged.bcvRate > 0 ? Number(merged.bcvRate) : 52.4,
          eventCommissionRate: Math.min(100, Math.max(0, Number(merged.eventCommissionRate ?? 8))),
          primaryColor: sanitizeHex(merged.primaryColor, '#2563eb'),
          primaryHoverColor: sanitizeHex(merged.primaryHoverColor, '#1d4ed8'),
          secondaryColor: sanitizeHex(merged.secondaryColor, '#10b981'),
          bgColor: sanitizeHex(merged.bgColor, '#f8fafc'),
          enableSound: Boolean(merged.enableSound),
          enableVibration: Boolean(merged.enableVibration),
          updatedAt: serverTimestamp(),
        };
        updateDoc(doc(db, 'companies', currentCompany.id), payload).catch(err =>
          handleFirestoreError(err, OperationType.UPDATE, `companies/${currentCompany.id}`)
        );
      }
    },
    [currentCompany, updateCurrentCompany, isCloudSynced]
  );

  const resetTheme = useCallback(() => {
    if (!currentCompany) return;
    updateSettings({
      appName: currentCompany.name,
      subtitle: 'Sistema Cashless & Tasa BCV',
      primaryColor: '#2563eb',
      primaryHoverColor: '#1d4ed8',
      secondaryColor: '#10b981',
      bgColor: '#f8fafc',
    });
  }, [currentCompany, updateSettings]);

  const setPresetTheme = useCallback(
    (primary: string, secondary: string, bg: string) => {
      updateSettings({
        primaryColor: primary,
        primaryHoverColor: primary,
        secondaryColor: secondary,
        bgColor: bg,
      });
    },
    [updateSettings]
  );

  // Stickers of active company
  const stickers = useMemo(() => {
    return currentCompany ? currentCompany.stickers : [];
  }, [currentCompany]);

  const addSticker = useCallback(
    (owner: string, initialBalance: number = 0, customColor?: string): Sticker => {
      const nextNum = (stickers.length + 1).toString().padStart(3, '0');
      const uniqueSuffix = isCloudSynced ? `-${Date.now().toString(36).slice(-3).toUpperCase()}` : '';
      const colors = [
        'from-blue-600 to-indigo-700',
        'from-emerald-600 to-teal-700',
        'from-purple-600 to-pink-600',
        'from-amber-600 to-orange-700',
        'from-rose-600 to-red-800',
        'from-cyan-600 to-blue-700',
      ];
      const color = customColor || colors[stickers.length % colors.length];
      const safeBalance = Math.max(0, Number(initialBalance.toFixed(2)));
      const stickerId = stickers.some(s => s.id === `NFC-${nextNum}`)
        ? `NFC-${nextNum}${uniqueSuffix}`
        : `NFC-${nextNum}`;

      const newSticker: Sticker = {
        id: stickerId,
        owner: clampStr(owner, 100, `Cliente #${nextNum}`),
        balance: safeBalance,
        color: clampStr(color, 80, 'from-blue-600 to-indigo-700'),
        tagType: 'NTAG215',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: 'active',
        totalRecharged: safeBalance,
        totalSpent: 0,
      };

      updateCurrentCompany(c => ({
        ...c,
        stickers: [...c.stickers, newSticker],
      }));

      if (isCloudSynced && currentCompany && firebaseUser) {
        const ownerUid = getCompanyOwnerUid(currentCompany) || firebaseUser.uid;
        setDoc(doc(db, 'companies', currentCompany.id, 'stickers', newSticker.id), {
          id: newSticker.id,
          companyId: currentCompany.id,
          ownerUid,
          owner: newSticker.owner,
          balance: newSticker.balance,
          color: newSticker.color,
          tagType: newSticker.tagType,
          status: newSticker.status,
          totalRecharged: newSticker.totalRecharged,
          totalSpent: newSticker.totalSpent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(err =>
          handleFirestoreError(err, OperationType.CREATE, `companies/${currentCompany.id}/stickers/${newSticker.id}`)
        );
      }

      soundSynth.playSuccess(settings.enableSound);
      return newSticker;
    },
    [stickers, updateCurrentCompany, settings.enableSound, isCloudSynced, currentCompany, firebaseUser, getCompanyOwnerUid]
  );

  const updateSticker = useCallback(
    (id: string, partial: Partial<Sticker>) => {
      if (!currentCompany) return;
      updateCurrentCompany(c => ({
        ...c,
        stickers: c.stickers.map(s => (s.id === id ? { ...s, ...partial } : s)),
      }));
      if (isCloudSynced) {
        const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
        if (partial.owner !== undefined) payload.owner = clampStr(partial.owner, 100, 'Cliente');
        if (partial.balance !== undefined) payload.balance = Math.max(0, Number(partial.balance));
        if (partial.color !== undefined) payload.color = clampStr(partial.color, 80);
        if (partial.status !== undefined) payload.status = partial.status;
        if (partial.totalRecharged !== undefined) payload.totalRecharged = Math.max(0, Number(partial.totalRecharged));
        if (partial.totalSpent !== undefined) payload.totalSpent = Math.max(0, Number(partial.totalSpent));

        updateDoc(doc(db, 'companies', currentCompany.id, 'stickers', id), payload).catch(err =>
          handleFirestoreError(err, OperationType.UPDATE, `companies/${currentCompany.id}/stickers/${id}`)
        );
      }
    },
    [currentCompany, updateCurrentCompany, isCloudSynced]
  );

  const deleteSticker = useCallback(
    (id: string) => {
      if (!currentCompany) return;
      updateCurrentCompany(c => ({
        ...c,
        stickers: c.stickers.filter(s => s.id !== id),
      }));
      if (isCloudSynced) {
        deleteDoc(doc(db, 'companies', currentCompany.id, 'stickers', id)).catch(err =>
          handleFirestoreError(err, OperationType.DELETE, `companies/${currentCompany.id}/stickers/${id}`)
        );
      }
    },
    [currentCompany, updateCurrentCompany, isCloudSynced]
  );

  // Products of active company
  const products = useMemo(() => {
    return currentCompany ? currentCompany.products : [];
  }, [currentCompany]);

  const addProduct = useCallback(
    (prodData: Omit<Product, 'id'>): Product => {
      const newProd: Product = {
        ...prodData,
        id: Date.now(),
        name: clampStr(prodData.name, 120, 'Producto'),
        price: Math.max(0.1, Number(prodData.price.toFixed(2))),
        emoji: clampStr(prodData.emoji, 24, '📦'),
        provider: clampStr(prodData.provider, 100, 'General'),
        category: clampStr(prodData.category, 60, 'General'),
      };

      updateCurrentCompany(c => {
        const hasProvider = c.providers.some(p => p.brandName === newProd.provider);
        return {
          ...c,
          products: [newProd, ...c.products],
          providers: hasProvider
            ? c.providers
            : [
                ...c.providers,
                {
                  id: `prov-${Date.now().toString(36)}`,
                  brandName: newProd.provider,
                  emoji: newProd.emoji,
                  pin: '2001',
                  createdAt: new Date().toISOString().slice(0, 10),
                },
              ],
        };
      });

      if (isCloudSynced && currentCompany && firebaseUser) {
        const ownerUid = getCompanyOwnerUid(currentCompany) || firebaseUser.uid;
        const prodId = String(newProd.id);
        setDoc(doc(db, 'companies', currentCompany.id, 'products', prodId), {
          id: prodId,
          companyId: currentCompany.id,
          ownerUid,
          name: newProd.name,
          price: newProd.price,
          emoji: newProd.emoji,
          provider: newProd.provider,
          category: newProd.category || 'General',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(err =>
          handleFirestoreError(err, OperationType.CREATE, `companies/${currentCompany.id}/products/${prodId}`)
        );
      }

      soundSynth.playSuccess(settings.enableSound);
      return newProd;
    },
    [updateCurrentCompany, settings.enableSound, isCloudSynced, currentCompany, firebaseUser, getCompanyOwnerUid]
  );

  const updateProduct = useCallback(
    (id: number, fields: Partial<Product>) => {
      if (!currentCompany) return;
      updateCurrentCompany(c => ({
        ...c,
        products: c.products.map(p => (p.id === id ? { ...p, ...fields } : p)),
      }));
      if (isCloudSynced) {
        const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
        if (fields.name !== undefined && fields.name.trim()) payload.name = clampStr(fields.name, 120);
        if (fields.price !== undefined && fields.price > 0) payload.price = Math.max(0.1, Number(fields.price));
        if (fields.emoji !== undefined) payload.emoji = clampStr(fields.emoji, 24, '📦');
        if (fields.provider !== undefined && fields.provider.trim()) payload.provider = clampStr(fields.provider, 100);
        if (fields.category !== undefined) payload.category = clampStr(fields.category, 60, 'General');

        if (Object.keys(payload).length > 1) {
          updateDoc(doc(db, 'companies', currentCompany.id, 'products', String(id)), payload).catch(err =>
            handleFirestoreError(err, OperationType.UPDATE, `companies/${currentCompany.id}/products/${id}`)
          );
        }
      }
    },
    [currentCompany, updateCurrentCompany, isCloudSynced]
  );

  const deleteProduct = useCallback(
    (id: number) => {
      if (!currentCompany) return;
      updateCurrentCompany(c => ({
        ...c,
        products: c.products.filter(p => p.id !== id),
      }));
      setCart(prev => prev.filter(item => item.product.id !== id));
      if (isCloudSynced) {
        deleteDoc(doc(db, 'companies', currentCompany.id, 'products', String(id))).catch(err =>
          handleFirestoreError(err, OperationType.DELETE, `companies/${currentCompany.id}/products/${id}`)
        );
      }
    },
    [currentCompany, updateCurrentCompany, isCloudSynced]
  );

  // Cart
  const addToCart = useCallback(
    (product: Product) => {
      soundSynth.playClick(settings.enableSound);
      setCart(prev => {
        const existing = prev.find(item => item.product.id === product.id);
        if (existing) {
          return prev.map(item => (item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        }
        return [...prev, { product, qty: 1 }];
      });
    },
    [settings.enableSound]
  );

  const updateCartQty = useCallback(
    (productId: number, delta: number) => {
      soundSynth.playClick(settings.enableSound);
      setCart(prev => {
        return prev
          .map(item => {
            if (item.product.id === productId) {
              const nextQty = item.qty + delta;
              return nextQty > 0 ? { ...item, qty: nextQty } : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null);
      });
    },
    [settings.enableSound]
  );

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotalUSD = useMemo(() => {
    const sum = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);
    return Number(sum.toFixed(2));
  }, [cart]);

  const cartTotalBs = useMemo(() => {
    return Number((cartTotalUSD * settings.bcvRate).toFixed(2));
  }, [cartTotalUSD, settings.bcvRate]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  // Transactions of active company
  const transactions = useMemo(() => {
    return currentCompany ? currentCompany.transactions : [];
  }, [currentCompany]);

  const addTransaction = useCallback(
    (txData: Omit<Transaction, 'id' | 'timestamp' | 'time'>): Transaction => {
      const now = Date.now();
      const newTx: Transaction = {
        ...txData,
        id: `TX-${now.toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: now,
        time: formatTime(now),
      };

      updateCurrentCompany(c => ({
        ...c,
        transactions: [newTx, ...c.transactions],
      }));

      return newTx;
    },
    [updateCurrentCompany]
  );

  // NFC Modals
  const openNfcModal = useCallback(
    (config: NfcModalConfig) => {
      soundSynth.playNfcPing(settings.enableSound);
      setNfcModalConfig(config);
      setIsNfcModalOpen(true);
    },
    [settings.enableSound]
  );

  const closeNfcModal = useCallback(() => {
    setIsNfcModalOpen(false);
    setNfcModalConfig(null);
  }, []);

  const closeResultModal = useCallback(() => {
    setResultModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggleStickersDrawer = useCallback(() => {
    setIsStickersDrawerOpen(prev => !prev);
  }, []);

  // Process NFC Tap (Atomic Firestore Batch for sticker balance + transaction creation)
  const processNfcTap = useCallback(
    async (stickerId: string): Promise<boolean> => {
      if (!nfcModalConfig || !currentCompany) return false;
      const sticker = stickers.find(s => s.id === stickerId);
      if (!sticker) return false;

      closeNfcModal();

      if (sticker.status === 'blocked') {
        soundSynth.playError(settings.enableSound);
        setResultModal({
          isOpen: true,
          isSuccess: false,
          title: 'Sticker Bloqueado',
          message: `El sticker ${sticker.id} de ${sticker.owner} se encuentra bloqueado.`,
        });
        return false;
      }

      if (nfcModalConfig.mode === 'RECHARGE') {
        const amountUSD = Number(nfcModalConfig.amountUSD.toFixed(2));
        const amountBs = Number((amountUSD * settings.bcvRate).toFixed(2));
        const prevBalance = sticker.balance;
        const newBalance = Number((prevBalance + amountUSD).toFixed(2));
        const nextTotalRecharged = Number(((sticker.totalRecharged || 0) + amountUSD).toFixed(2));

        updateCurrentCompany(comp => ({
          ...comp,
          stickers: comp.stickers.map(s =>
            s.id === sticker.id
              ? {
                  ...s,
                  balance: newBalance,
                  totalRecharged: nextTotalRecharged,
                }
              : s
          ),
        }));

        const paymentMethod = nfcModalConfig.paymentMethod || 'Efectivo USD';
        const tx = addTransaction({
          type: 'RECARGA',
          stickerId: sticker.id,
          owner: sticker.owner,
          usd: amountUSD,
          bs: amountBs,
          bcvRate: settings.bcvRate,
          detail: `Recarga en Caja (${paymentMethod})`,
          paymentMethod,
        });

        if (isCloudSynced && firebaseUser) {
          const ownerUid = getCompanyOwnerUid(currentCompany) || firebaseUser.uid;
          const batch = writeBatch(db);
          batch.update(doc(db, 'companies', currentCompany.id, 'stickers', sticker.id), {
            balance: newBalance,
            totalRecharged: nextTotalRecharged,
            updatedAt: serverTimestamp(),
          });
          batch.set(doc(db, 'companies', currentCompany.id, 'transactions', tx.id), {
            id: tx.id,
            companyId: currentCompany.id,
            ownerUid,
            type: tx.type,
            stickerId: tx.stickerId,
            owner: clampStr(tx.owner, 100),
            usd: tx.usd,
            bs: tx.bs,
            bcvRate: tx.bcvRate,
            detail: clampStr(tx.detail, 500),
            paymentMethod: paymentMethod.slice(0, 60),
            time: tx.time,
            timestamp: tx.timestamp,
            createdAt: serverTimestamp(),
          });
          batch.commit().catch(err =>
            handleFirestoreError(err, OperationType.WRITE, `companies/${currentCompany.id}/transactions/${tx.id}`)
          );
        }

        soundSynth.playSuccess(settings.enableSound);
        try {
          confetti({
            particleCount: 65,
            spread: 60,
            origin: { y: 0.65 },
          });
        } catch {
          // ignore
        }

        setResultModal({
          isOpen: true,
          isSuccess: true,
          title: '¡Recarga Exitosa!',
          message: `Se han acreditado ${formatUSD(amountUSD)} en la etiqueta de ${sticker.owner}.`,
          details: {
            stickerId: sticker.id,
            owner: sticker.owner,
            amountUSD,
            amountBs,
            prevBalance,
            newBalance,
            bcvRate: settings.bcvRate,
            detail: `Método: ${paymentMethod}`,
          },
          transaction: tx,
        });

        return true;
      }

      if (nfcModalConfig.mode === 'CHARGE') {
        const totalUSD = Number(nfcModalConfig.amountUSD.toFixed(2));
        const prevBalance = sticker.balance;

        if (prevBalance < totalUSD) {
          const missingUSD = Number((totalUSD - prevBalance).toFixed(2));
          soundSynth.playError(settings.enableSound);

          setResultModal({
            isOpen: true,
            isSuccess: false,
            title: 'Saldo Insuficiente',
            message: `El sticker de ${sticker.owner} no cuenta con fondos suficientes para pagar esta orden.`,
            details: {
              stickerId: sticker.id,
              owner: sticker.owner,
              prevBalance,
              amountUSD: totalUSD,
              missingUSD,
              bcvRate: settings.bcvRate,
            },
          });

          return false;
        }

        const newBalance = Number((prevBalance - totalUSD).toFixed(2));
        const amountBs = Number((totalUSD * settings.bcvRate).toFixed(2));
        const nextTotalSpent = Number(((sticker.totalSpent || 0) + totalUSD).toFixed(2));

        updateCurrentCompany(comp => ({
          ...comp,
          stickers: comp.stickers.map(s =>
            s.id === sticker.id
              ? {
                  ...s,
                  balance: newBalance,
                  totalSpent: nextTotalSpent,
                }
              : s
          ),
        }));

        const summaryItems = cart.map(i => `${i.qty}x ${i.product.name}`).join(', ');
        const cartSnapshot = cart.slice(0, 50).map(i => ({
          name: i.product.name,
          qty: i.qty,
          price: i.product.price,
          emoji: i.product.emoji,
          provider: i.product.provider,
        }));

        const provider = activeProvider?.brandName || (cart.length > 0 ? cart[0].product.provider : 'Varios');

        const tx = addTransaction({
          type: 'CONSUMO',
          stickerId: sticker.id,
          owner: sticker.owner,
          usd: totalUSD,
          bs: amountBs,
          bcvRate: settings.bcvRate,
          detail: summaryItems || 'Consumo en Stand',
          provider,
          cartSnapshot,
        });

        if (isCloudSynced && firebaseUser) {
          const ownerUid = getCompanyOwnerUid(currentCompany) || firebaseUser.uid;
          const batch = writeBatch(db);
          batch.update(doc(db, 'companies', currentCompany.id, 'stickers', sticker.id), {
            balance: newBalance,
            totalSpent: nextTotalSpent,
            updatedAt: serverTimestamp(),
          });
          batch.set(doc(db, 'companies', currentCompany.id, 'transactions', tx.id), {
            id: tx.id,
            companyId: currentCompany.id,
            ownerUid,
            type: tx.type,
            stickerId: tx.stickerId,
            owner: clampStr(tx.owner, 100),
            usd: tx.usd,
            bs: tx.bs,
            bcvRate: tx.bcvRate,
            detail: clampStr(tx.detail, 500),
            provider: clampStr(provider, 100),
            time: tx.time,
            timestamp: tx.timestamp,
            cartSnapshot,
            createdAt: serverTimestamp(),
          });
          batch.commit().catch(err =>
            handleFirestoreError(err, OperationType.WRITE, `companies/${currentCompany.id}/transactions/${tx.id}`)
          );
        }

        setCart([]);
        soundSynth.playSuccess(settings.enableSound);
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#6ee7b7', '#2563eb'],
          });
        } catch {
          // ignore
        }

        setResultModal({
          isOpen: true,
          isSuccess: true,
          title: '¡Pago Aprobado!',
          message: `Cobro procesado exitosamente con el sticker NFC de ${sticker.owner}.`,
          details: {
            stickerId: sticker.id,
            owner: sticker.owner,
            amountUSD: totalUSD,
            amountBs,
            prevBalance,
            newBalance,
            detail: summaryItems,
            bcvRate: settings.bcvRate,
          },
          transaction: tx,
        });

        return true;
      }

      return false;
    },
    [
      nfcModalConfig,
      currentCompany,
      stickers,
      settings.bcvRate,
      settings.enableSound,
      updateCurrentCompany,
      addTransaction,
      cart,
      closeNfcModal,
      activeProvider,
      isCloudSynced,
      firebaseUser,
      getCompanyOwnerUid,
    ]
  );

  const resetCurrentCompanyData = useCallback(() => {
    if (!currentCompany) return;
    const baseId = INITIAL_COMPANIES.find(c => currentCompany.id.startsWith(c.id));
    if (baseId) {
      updateCurrentCompany(c => ({
        ...baseId,
        id: c.id,
        ownerUid: c.ownerUid,
      }));
    } else {
      updateCurrentCompany(c => ({
        ...c,
        stickers: [],
        products: [],
        transactions: [],
      }));
    }
    setCart([]);
    soundSynth.playSuccess(true);
  }, [currentCompany, updateCurrentCompany]);

  const exportDataJSON = useCallback(() => {
    if (!currentCompany) return;
    const backup = {
      company: currentCompany,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `paysticker_${currentCompany.slug}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [currentCompany]);

  const exportTransactionsCSV = useCallback(() => {
    if (!currentCompany) return;
    const headers = ['ID', 'Tipo', 'Sticker ID', 'Cliente', 'Monto USD', 'Monto Bs', 'Tasa BCV', 'Detalle', 'Metodo/Stand', 'Hora'];
    const rows = transactions.map(t => [
      t.id,
      t.type,
      t.stickerId,
      `"${t.owner.replace(/"/g, '""')}"`,
      t.usd.toFixed(2),
      t.bs.toFixed(2),
      t.bcvRate.toFixed(2),
      `"${t.detail.replace(/"/g, '""')}"`,
      `"${(t.paymentMethod || t.provider || '').replace(/"/g, '""')}"`,
      `"${t.time}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_${currentCompany.slug}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [currentCompany, transactions]);

  const value: AppContextType = {
    firebaseUser,
    isAuthReady,
    isCloudSynced,
    isCloudLoading,
    authError,
    signInWithGoogle,
    signOutGoogle,

    masterSettings,
    updateMasterSettings,
    isSuperAdminAuthenticated,
    showSuperAdminModal,
    setShowSuperAdminModal,
    isSuperAdminDashboardOpen,
    setIsSuperAdminDashboardOpen,
    loginSuperAdmin,
    logoutSuperAdmin,
    updateCompanyPinByMaster,
    updateCompanyCajaPinByMaster,
    updateProviderPinByMaster,
    updateCompanyByMaster,
    enterCompanyAsSuperAdmin,
    allGlobalTransactions,
    exportGlobalTransactionsCSV,

    companies,
    currentCompany,
    loginCompany,
    logoutCompany,
    registerCompany,
    deleteCompany,

    isAdminUnlocked,
    unlockAdminWithPin,
    lockAdmin,
    updateAdminPin,
    showPinModal,
    setShowPinModal,

    isCajaUnlocked,
    unlockCajaWithPin,
    lockCaja,
    updateCajaPin,
    showCajaPinModal,
    setShowCajaPinModal,

    providers,
    unlockedProviderId,
    activeProvider,
    pendingProviderId,
    showProviderPinModal,
    openProviderPinPrompt,
    closeProviderPinPrompt,
    unlockProviderWithPin,
    lockProvider,
    isNewProviderModalOpen,
    setIsNewProviderModalOpen,
    addProviderWithProducts,
    updateProviderPin,
    deleteProviderBrand,

    settings,
    updateSettings,
    resetTheme,
    setPresetTheme,
    activeTab,
    setActiveTab,
    requestNavigateTab,

    stickers,
    addSticker,
    updateSticker,
    deleteSticker,

    products,
    addProduct,
    updateProduct,
    deleteProduct,

    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartTotalUSD,
    cartTotalBs,
    cartItemCount,

    transactions,
    addTransaction,

    isNfcModalOpen,
    nfcModalConfig,
    openNfcModal,
    closeNfcModal,
    resultModal,
    closeResultModal,
    isStickersDrawerOpen,
    toggleStickersDrawer,
    setIsStickersDrawerOpen,
    isProductModalOpen,
    setIsProductModalOpen,
    receiptModalTx,
    setReceiptModalTx,
    processNfcTap,

    resetCurrentCompanyData,
    exportDataJSON,
    exportTransactionsCSV,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
