/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Calculator,
  FileSpreadsheet,
  Lock,
  Search,
  Plus,
  Check,
  Clock,
  Layers,
  BookOpen,
  Sun,
  Moon,
  Trash2,
  Printer,
  Download,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import {
  PRINT_CATEGORIES,
  PrintCategoryKey,
  PrintProductRow,
  parsePrintSheetCsv,
  formatPersianPrice,
  getBundledFallbackProducts,
  fetchAndParseAllPublishedSheets,
} from './utils/sheetParser';
import {
  FALLBACK_SHEET_CSV,
  LIVE_GOOGLE_SHEET_CSV_URL,
} from './data/fallbackCsv';
import {
  calculateFinalPrice,
  calculateUnitPrice,
  calculateNetProfit,
} from './utils/wasmPricingEngine';
import {
  AdminSettings,
  DEFAULT_ADMIN_SETTINGS,
  QuoteCartItem,
} from './types/studio';
import { SUB_CATEGORY_FILTERS } from './utils/categoryHelpers';
import { VisualCutPreview } from './components/VisualCutPreview';
import { PrepressGuideSection } from './components/PrepressGuideModal';
import { PreInvoiceModal } from './components/PreInvoiceModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ProductQuickSearchModal } from './components/ProductQuickSearchModal';
import { buildStandaloneSingleFileHtml } from './utils/standaloneHtmlBuilder';

const STORAGE_KEY_ADMIN = 'naghshe_negar_admin_settings_v1';
const STORAGE_KEY_CART = 'naghshe_negar_quote_cart_v1';
const STORAGE_KEY_THEME = 'naghshe_negar_theme_v1';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      return saved ? saved === 'dark' : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  // Admin settings persisted in localStorage
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN);
      if (raw) {
        const parsed = JSON.parse(raw);
        // If storeName was previous uncustomized default, update it to 'چاپ رامین'
        if (parsed.storeName === 'استودیو چاپ و گرافیک نقش‌نگار') {
          parsed.storeName = 'چاپ رامین';
        }
        return { ...DEFAULT_ADMIN_SETTINGS, ...parsed };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_ADMIN_SETTINGS;
  });

  const handleUpdateAdminSettings = useCallback((next: AdminSettings) => {
    setAdminSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  // Product rows state & sync status (11 sheets with 1,779 items)
  const [allProducts, setAllProducts] = useState<PrintProductRow[]>(() =>
    getBundledFallbackProducts()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('آماده به کار');
  const [dataSourceLabel, setDataSourceLabel] = useState<string>('۱۱ شیت گوگل‌شیت');

  // Active Category Tab (11 sheets)
  const [activeCategory, setActiveCategory] = useState<PrintCategoryKey>('کارت ویزیت');
  // Sub-category Filter inside active category
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string>('all');
  // Inline filter for Step 1 Product Select
  const [calculatorProductFilter, setCalculatorProductFilter] = useState<string>('');

  // Reset subcategory & filter when category changes
  const handleSelectCategory = useCallback((catKey: PrintCategoryKey) => {
    setActiveCategory(catKey);
    setActiveSubCategoryId('all');
    setCalculatorProductFilter('');
  }, []);

  // Cascading Calculator Selectors
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(0);
  const [selectedSides, setSelectedSides] = useState<string>('');
  const [seriesCount, setSeriesCount] = useState<number>(1);
  const [customOrderTitle, setCustomOrderTitle] = useState<string>('');
  const [justAddedFeedback, setJustAddedFeedback] = useState<boolean>(false);

  // Table Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidesFilter, setSidesFilter] = useState<'همه' | 'یک رو' | 'دو رو'>('همه');

  // Modals
  const [isPreInvoiceOpen, setIsPreInvoiceOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isPrepressModalOpen, setIsPrepressModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Global Keyboard Shortcut: '/' opens quick product search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) &&
        !isSearchModalOpen
      ) {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen]);

  // Quote Cart State
  const [cartItems, setCartItems] = useState<QuoteCartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CART);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  // Helper to get effective margin % for a given category
  const getCategoryMargin = useCallback(
    (category: PrintCategoryKey): number => {
      if (adminSettings.useCategoryMargins) {
        return adminSettings.categoryMargins[category] ?? adminSettings.globalMarginPercent;
      }
      return adminSettings.globalMarginPercent;
    },
    [adminSettings]
  );

  // Helper to compute dynamic price for any row via Rust/WASM pricing engine
  const computeRowPricing = useCallback(
    (row: PrintProductRow) => {
      const marginPercent = getCategoryMargin(row.category);
      const finalPrice = calculateFinalPrice(
        row.baseCost,
        marginPercent,
        adminSettings.roundingStep
      );
      const unitPrice = calculateUnitPrice(finalPrice, row.quantity);
      const netProfit = calculateNetProfit(finalPrice, row.baseCost);
      return {
        marginPercent,
        finalPrice,
        unitPrice,
        netProfit,
      };
    },
    [getCategoryMargin, adminSettings.roundingStep]
  );

  // Recalculate cart items whenever admin margin or rounding step changes
  useEffect(() => {
    setCartItems((prev) =>
      prev.map((item) => {
        const { marginPercent, finalPrice, unitPrice } = computeRowPricing(item.product);
        return {
          ...item,
          appliedMarginPercent: marginPercent,
          appliedRoundingStep: adminSettings.roundingStep,
          unitCustomerPrice: finalPrice,
          singlePiecePrice: unitPrice,
          totalCustomerPrice: finalPrice * item.seriesCount,
        };
      })
    );
  }, [computeRowPricing, adminSettings.roundingStep]);

  // Live Google Sheet multi-sheet sync across all 11 categories
  const syncLivePricesFromGoogleSheet = useCallback(async () => {
    setIsSyncing(true);
    try {
      const rows = await fetchAndParseAllPublishedSheets();
      if (rows && rows.length > 0) {
        setAllProducts(rows);
        setDataSourceLabel('۱۱ شیت گوگل‌شیت زنده');
        setLastSyncTime(
          new Intl.DateTimeFormat('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }).format(new Date())
        );
      }
    } catch {
      // Fallback to bundled dataset if offline or blocked
      const fallbackRows = getBundledFallbackProducts();
      setAllProducts(fallbackRows);
      setDataSourceLabel('کش محلی ۱۱ شیت (آفلاین)');
      setLastSyncTime(
        new Intl.DateTimeFormat('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date())
      );
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Auto-sync on mount
  useEffect(() => {
    syncLivePricesFromGoogleSheet();
  }, [syncLivePricesFromGoogleSheet]);

  // Products in active category
  const categoryProducts = useMemo(
    () => allProducts.filter((p) => p.category === activeCategory),
    [allProducts, activeCategory]
  );

  // Products filtered by active subcategory
  const subCategoryProducts = useMemo(() => {
    if (activeSubCategoryId === 'all') return categoryProducts;
    const filterObj = SUB_CATEGORY_FILTERS[activeCategory]?.find(
      (f) => f.id === activeSubCategoryId
    );
    if (!filterObj) return categoryProducts;
    const filtered = categoryProducts.filter(filterObj.predicate);
    return filtered.length > 0 ? filtered : categoryProducts;
  }, [categoryProducts, activeCategory, activeSubCategoryId]);

  // Step 1 Options: Unique Product Names in active subcategory, plus inline filter
  const productOptions = useMemo(() => {
    const names = new Set<string>();
    subCategoryProducts.forEach((p) => names.add(p.productName));
    const allNames = Array.from(names);
    if (!calculatorProductFilter.trim()) return allNames;
    const q = calculatorProductFilter.trim().toLowerCase();
    const filtered = allNames.filter((name) => name.toLowerCase().includes(q));
    return filtered.length > 0 ? filtered : allNames;
  }, [subCategoryProducts, calculatorProductFilter]);

  // Ensure valid selectedProductName when category or subcategory changes
  useEffect(() => {
    if (productOptions.length > 0 && !productOptions.includes(selectedProductName)) {
      setSelectedProductName(productOptions[0]);
    }
  }, [productOptions, selectedProductName]);

  // Step 2 Options: Available Sizes for selected Product Name
  const sizeOptions = useMemo(() => {
    const sizes = new Set<string>();
    categoryProducts
      .filter((p) => p.productName === selectedProductName)
      .forEach((p) => sizes.add(p.size));
    return Array.from(sizes);
  }, [categoryProducts, selectedProductName]);

  useEffect(() => {
    if (sizeOptions.length > 0 && !sizeOptions.includes(selectedSize)) {
      setSelectedSize(sizeOptions[0]);
    }
  }, [sizeOptions, selectedSize]);

  // Step 3 Options: Available Quantities for selected Product + Size
  const quantityOptions = useMemo(() => {
    const qtys = new Set<number>();
    categoryProducts
      .filter((p) => p.productName === selectedProductName && p.size === selectedSize)
      .forEach((p) => qtys.add(p.quantity));
    return Array.from(qtys).sort((a, b) => a - b);
  }, [categoryProducts, selectedProductName, selectedSize]);

  useEffect(() => {
    if (quantityOptions.length > 0 && !quantityOptions.includes(selectedQuantity)) {
      setSelectedQuantity(quantityOptions[0]);
    }
  }, [quantityOptions, selectedQuantity]);

  // Step 4 Options: Available Sides for selected Product + Size + Quantity
  const sidesOptions = useMemo(() => {
    const sidesSet = new Set<string>();
    categoryProducts
      .filter(
        (p) =>
          p.productName === selectedProductName &&
          p.size === selectedSize &&
          p.quantity === selectedQuantity
      )
      .forEach((p) => sidesSet.add(p.sides));
    return Array.from(sidesSet);
  }, [categoryProducts, selectedProductName, selectedSize, selectedQuantity]);

  useEffect(() => {
    if (sidesOptions.length > 0 && !sidesOptions.includes(selectedSides)) {
      setSelectedSides(sidesOptions[0]);
    }
  }, [sidesOptions, selectedSides]);

  // Currently matched PrintProductRow in the Calculator
  const activeCalculatorRow = useMemo<PrintProductRow | null>(() => {
    const exactMatch = categoryProducts.find(
      (p) =>
        p.productName === selectedProductName &&
        p.size === selectedSize &&
        p.quantity === selectedQuantity &&
        p.sides === selectedSides
    );
    if (exactMatch) return exactMatch;
    return (
      categoryProducts.find((p) => p.productName === selectedProductName) ||
      categoryProducts[0] ||
      null
    );
  }, [
    categoryProducts,
    selectedProductName,
    selectedSize,
    selectedQuantity,
    selectedSides,
  ]);

  const activeCalculatorPricing = useMemo(() => {
    if (!activeCalculatorRow) return null;
    return computeRowPricing(activeCalculatorRow);
  }, [activeCalculatorRow, computeRowPricing]);

  // Filtered Table Rows
  const filteredTableRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subCategoryProducts.filter((row) => {
      if (sidesFilter !== 'همه' && row.sides !== sidesFilter) {
        return false;
      }
      if (!q) return true;
      return (
        row.productName.toLowerCase().includes(q) ||
        row.size.toLowerCase().includes(q) ||
        String(row.quantity).includes(q) ||
        row.deliveryTime.toLowerCase().includes(q)
      );
    });
  }, [subCategoryProducts, sidesFilter, searchQuery]);

  // Add item to Quote Cart
  const handleAddToCart = useCallback(
    (row: PrintProductRow, count: number = 1, title: string = '') => {
      const safeCount = Math.max(1, Math.round(count));
      const { marginPercent, finalPrice, unitPrice } = computeRowPricing(row);

      setCartItems((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.product.id === row.id && item.customTitle === title.trim()
        );
        if (existingIdx > -1) {
          const updated = [...prev];
          const nextSeries = updated[existingIdx].seriesCount + safeCount;
          updated[existingIdx] = {
            ...updated[existingIdx],
            seriesCount: nextSeries,
            unitCustomerPrice: finalPrice,
            singlePiecePrice: unitPrice,
            totalCustomerPrice: finalPrice * nextSeries,
          };
          return updated;
        }

        const newItem: QuoteCartItem = {
          cartItemId: `${row.id}-${Date.now()}`,
          product: row,
          seriesCount: safeCount,
          customTitle: title.trim(),
          appliedMarginPercent: marginPercent,
          appliedRoundingStep: adminSettings.roundingStep,
          unitCustomerPrice: finalPrice,
          singlePiecePrice: unitPrice,
          totalCustomerPrice: finalPrice * safeCount,
        };
        return [...prev, newItem];
      });

      setJustAddedFeedback(true);
      setTimeout(() => setJustAddedFeedback(false), 1600);
    },
    [computeRowPricing, adminSettings.roundingStep]
  );

  const handleUpdateCartSeries = useCallback((cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId !== cartItemId) return item;
          const nextCount = item.seriesCount + delta;
          if (nextCount <= 0) return null;
          return {
            ...item,
            seriesCount: nextCount,
            totalCustomerPrice: item.unitCustomerPrice * nextCount,
          };
        })
        .filter((x): x is QuoteCartItem => x !== null)
    );
  }, []);

  const handleRemoveCartItem = useCallback((cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const handleSelectRowIntoCalculator = (row: PrintProductRow) => {
    setActiveCategory(row.category);
    setActiveSubCategoryId('all');
    setCalculatorProductFilter('');
    setSelectedProductName(row.productName);
    setSelectedSize(row.size);
    setSelectedQuantity(row.quantity);
    setSelectedSides(row.sides);

    const calcEl = document.getElementById('calculator-workspace');
    if (calcEl) {
      calcEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownloadStandaloneHtml = () => {
    const htmlContent = buildStandaloneSingleFileHtml(adminSettings);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'persian-print-studio-standalone.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cartTotalSum = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.totalCustomerPrice, 0),
    [cartItems]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#calculator-workspace"
          data-testid="header-store-name"
          className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          {adminSettings.storeName || 'چاپ رامین'}
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="ناوبری اصلی"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#calculator-workspace"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            محاسبه‌گر قیمت
          </a>
          <a
            href="#tariff-table-section"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            جدول تعرفه‌ها
          </a>
          <a
            href="#prepress-kit-section"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            کیت راهنمای چاپ
          </a>
          <button
            type="button"
            onClick={() => setIsPrepressModalOpen(true)}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            استاندارد شابلون‌ها
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsPreInvoiceOpen(true)}
            data-testid="open-preinvoice-btn"
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            سبد پیش‌فاکتور ({cartItems.length.toLocaleString('fa-IR')})
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Workspace Utility & Live Sheet Sync Toolbar */}
        <section
          aria-label="نوار ابزار همگام‌سازی و مدیریت"
          className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              سامانه هوشمند استعلام قیمت و سفارش چاپ
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span>منبع تعرفه: {dataSourceLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                تعداد اقلام فعال: {allProducts.length.toLocaleString('fa-IR')} محصول
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">آخرین بروزرسانی: {lastSyncTime}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Prominent Instant Product Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-slate-900 dark:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer group"
              title="جستجوی سریع محصول در بین ۳۸۳ قلم (کلید میانبر /)"
            >
              <Search className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>جستجوی محصول چاپی</span>
              <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                /
              </kbd>
            </button>

            <button
              type="button"
              onClick={syncLivePricesFromGoogleSheet}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>بروزرسانی زنده قیمتها</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              title="دانلود فایل HTML مستقل تک‌فایلی"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>نسخه تک‌فایل HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>حالت روشن</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>حالت تیره</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              data-testid="open-admin-panel-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>پنل مدیریت</span>
            </button>
          </div>
        </section>

        {/* 11 Category Tabs corresponding to 11 sheets */}
        <section aria-label="دسته‌بندی محصولات چاپی" id="calculator-workspace" className="space-y-3">
          <div
            role="tablist"
            aria-label="دسته‌بندی خدمات چاپ"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2"
          >
            {PRINT_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.key;
              const count = allProducts.filter((p) => p.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => handleSelectCategory(cat.key)}
                  className={`text-right p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-extrabold truncate">
                        {cat.shortTitle}
                      </span>
                      <span
                        className={`text-[11px] font-mono-num shrink-0 ${
                          isSelected
                            ? 'text-amber-300 dark:text-slate-900 font-bold'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {count.toLocaleString('fa-IR')}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-1 line-clamp-1 leading-snug ${
                        isSelected
                          ? 'text-slate-300 dark:text-slate-900'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                      title={cat.subtitle}
                    >
                      {cat.subtitle}
                    </p>
                  </div>

                  <div
                    className={`mt-2 pt-1.5 border-t text-[10px] flex items-center justify-between ${
                      isSelected
                        ? 'border-slate-700 dark:border-slate-950/20 text-amber-300 dark:text-slate-900 font-semibold'
                        : 'border-slate-100 dark:border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <span className="truncate">{cat.badgeText}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sub-Category Filter Pills inside active category */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-2xs">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1.5 shrink-0 ml-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
              <span>فیلتر زیرمجموعه:</span>
            </span>
            {SUB_CATEGORY_FILTERS[activeCategory]?.map((sub) => {
              const isSelected = activeSubCategoryId === sub.id;
              const count = allProducts.filter(
                (p) => p.category === activeCategory && sub.predicate(p)
              ).length;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setActiveSubCategoryId(sub.id);
                    setCalculatorProductFilter('');
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span>{sub.shortLabel}</span>
                  <span
                    className={`text-[10px] font-mono-num ${
                      isSelected ? 'text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    ({count.toLocaleString('fa-IR')})
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Interactive Price Calculator + Visual Size & Cut Preview Split */}
        <section
          aria-label="محاسبه‌گر هوشمند قیمت و شبیه‌ساز برش"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          {/* Right 7 Columns: Cascading Step-by-Step Calculator & Price Output */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>محاسبه‌گر آنی قیمت چاپ ({activeCategory})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    مشخصات چاپی مورد نظر را گام‌به‌گام انتخاب کنید تا قیمت نهایی محاسبه گردد
                  </p>
                </div>
              </div>

              {/* 4 Cascading Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {/* 1. Product Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="calc-product-select"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      ۱. انتخاب نوع محصول و جنس کاغذ / مقوا:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono-num">
                      {productOptions.length.toLocaleString('fa-IR')} محصول در این گروه
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                      <select
                        id="calc-product-select"
                        value={selectedProductName}
                        onChange={(e) => setSelectedProductName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        {productOptions.map((prodName) => (
                          <option key={prodName} value={prodName}>
                            {prodName}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Inline Quick Filter in Step 1 */}
                    <div className="sm:w-56 relative shrink-0">
                      <input
                        type="text"
                        value={calculatorProductFilter}
                        onChange={(e) => setCalculatorProductFilter(e.target.value)}
                        placeholder="فیلتر نام محصول..."
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                      />
                      {calculatorProductFilter ? (
                        <button
                          type="button"
                          onClick={() => setCalculatorProductFilter('')}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Size */}
                <div>
                  <label
                    htmlFor="calc-size-select"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    ۲. سایز و قالب برش:
                  </label>
                  <select
                    id="calc-size-select"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-medium font-mono-num rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {sizeOptions.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Quantity / Circulation */}
                <div>
                  <label
                    htmlFor="calc-qty-select"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    ۳. تیراژ چاپ (تعداد در هر سری):
                  </label>
                  <select
                    id="calc-qty-select"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm font-medium font-mono-num rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {quantityOptions.map((qty) => (
                      <option key={qty} value={qty}>
                        {formatPersianPrice(qty)} عدد
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Single / Double-Sided */}
                <div>
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ۴. نوع چاپ (یک رو / دو رو):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {sidesOptions.map((sideOpt) => {
                      const active = selectedSides === sideOpt;
                      return (
                        <button
                          key={sideOpt}
                          type="button"
                          onClick={() => setSelectedSides(sideOpt)}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          چاپ {sideOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Series Count & Custom Design Label */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label
                      htmlFor="calc-series-input"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      تعداد سری:
                    </label>
                    <input
                      id="calc-series-input"
                      type="number"
                      min={1}
                      max={100}
                      value={seriesCount}
                      onChange={(e) =>
                        setSeriesCount(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-full px-2.5 py-2 text-sm font-bold font-mono-num text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      htmlFor="calc-custom-title"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      نام طرح / سفارش (اختیاری):
                    </label>
                    <input
                      id="calc-custom-title"
                      type="text"
                      value={customOrderTitle}
                      onChange={(e) => setCustomOrderTitle(e.target.value)}
                      placeholder="مثلاً: کارت مدیریت"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Price Calculation Summary Strip */}
            {activeCalculatorRow && activeCalculatorPricing && (
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      قیمت نهایی هر سری ({formatPersianPrice(activeCalculatorRow.quantity)} عدد):
                    </div>
                    <div
                      data-testid="calculator-final-price"
                      className="text-2xl font-extrabold font-mono-num text-slate-900 dark:text-amber-400 mt-1"
                    >
                      {formatPersianPrice(activeCalculatorPricing.finalPrice)}{' '}
                      <span className="text-xs font-normal text-slate-500">تومان</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      قیمت هر یک عدد / برگ:
                    </div>
                    <div
                      data-testid="calculator-unit-price"
                      className="text-lg font-bold font-mono-num text-slate-800 dark:text-slate-200 mt-1.5"
                    >
                      {formatPersianPrice(activeCalculatorPricing.unitPrice)}{' '}
                      <span className="text-xs font-normal text-slate-500">تومان</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      زمان تحویل کاری:
                    </div>
                    <div
                      data-testid="calculator-delivery-time"
                      className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5"
                    >
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{activeCalculatorRow.deliveryTime} کاری</span>
                    </div>
                  </div>
                </div>

                {/* Primary CTA: Add to Quote Cart */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {seriesCount > 1 ? (
                      <span>
                        مبلغ کل برای {seriesCount.toLocaleString('fa-IR')} سری:{' '}
                        <strong className="font-mono-num text-slate-900 dark:text-slate-100">
                          {formatPersianPrice(activeCalculatorPricing.finalPrice * seriesCount)} تومان
                        </strong>
                      </span>
                    ) : (
                      <span>کلیه قیمت‌ها با احتساب هزینه چاپ و برش نهایی می‌باشد.</span>
                    )}
                  </div>

                  <button
                    type="button"
                    data-testid="add-to-quote-btn"
                    onClick={() => {
                      handleAddToCart(activeCalculatorRow, seriesCount, customOrderTitle);
                      setCustomOrderTitle('');
                      setSeriesCount(1);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                  >
                    {justAddedFeedback ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950" />
                        <span>به پیش‌فاکتور اضافه شد</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>افزودن به سبد پیش‌فاکتور</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Left 5 Columns: Visual Size & Cut Preview + Quick Quote Summary */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <VisualCutPreview product={activeCalculatorRow} />

            {/* Compact Live Quote Cart Summary Box */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    خلاصه سبد پیش‌فاکتور شما
                  </h3>
                </div>
                <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400">
                  {cartItems.length.toLocaleString('fa-IR')} ردیف سفارش
                </span>
              </div>

              {cartItems.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                  هنوز محصولی به پیش‌فاکتور اضافه نشده است. پس از انتخاب مشخصات، دکمه «افزودن به سبد پیش‌فاکتور» را بزنید.
                </p>
              ) : (
                <div className="space-y-2.5 my-3 max-h-36 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-100 dark:border-slate-800/70 last:border-none"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.product.productName}
                        </span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="font-mono-num text-slate-500">
                          {item.product.size} ({item.seriesCount.toLocaleString('fa-IR')} سری)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-num font-bold text-slate-900 dark:text-slate-100">
                          {formatPersianPrice(item.totalCustomerPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(item.cartItemId)}
                          aria-label={`حذف ${item.product.productName}`}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">جمع کل: </span>
                  <strong
                    data-testid="cart-summary-total"
                    className="text-sm font-extrabold font-mono-num text-slate-900 dark:text-amber-400"
                  >
                    {formatPersianPrice(cartTotalSum)} تومان
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreInvoiceOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>صدور و چاپ پیش‌فاکتور</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Full Interactive Tariff Table Section */}
        <section
          id="tariff-table-section"
          aria-label="جدول کامل تعرفه‌های چاپ"
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
        >
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  لیست کامل تعرفه‌های دسته «{activeCategory}» ({filteredTableRows.length.toLocaleString('fa-IR')} ردیف)
                </span>
              </h2>
              {adminSettings.showBaseCostInTable && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  حالت مقایسه مدیر فعال است: ستون «قیمت خرید همکار (col[3])» و «سود خالص» در جدول نمایش داده می‌شود.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام محصول، سایز یا تیراژ..."
                  aria-label="جستجوی نام محصول، سایز یا تیراژ"
                  className="pr-9 pl-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-60 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Segmented Filter for Sides */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200/80 dark:border-slate-800">
                {(['همه', 'یک رو', 'دو رو'] as const).map((sideMode) => (
                  <button
                    key={sideMode}
                    type="button"
                    onClick={() => setSidesFilter(sideMode)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      sidesFilter === sideMode
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {sideMode === 'همه' ? 'همه روها' : sideMode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Data Grid or Loading Skeleton */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-collapse" data-testid="tariff-table">
              <thead className="bg-slate-100/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">شرح محصول و جنس</th>
                  <th className="py-3 px-4 font-semibold">سایز و قالب</th>
                  <th className="py-3 px-4 font-semibold">تیراژ (عدد)</th>
                  <th className="py-3 px-4 font-semibold">یک رو / دو رو</th>
                  <th className="py-3 px-4 font-semibold">زمان تحویل</th>
                  {adminSettings.showBaseCostInTable && (
                    <>
                      <th className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400">
                        قیمت پایه همکار (ویژه مدیر)
                      </th>
                      <th className="py-3 px-4 font-semibold text-emerald-700 dark:text-emerald-400">
                        سود خالص ({getCategoryMargin(activeCategory)}%)
                      </th>
                    </>
                  )}
                  <th className="py-3 px-4 font-semibold">فی هر عدد (تومان)</th>
                  <th className="py-3 px-4 font-semibold">قیمت نهایی (تومان)</th>
                  <th className="py-3 px-4 font-semibold text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {isSyncing ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-44" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-14" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-14" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-24 mr-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredTableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={adminSettings.showBaseCostInTable ? 10 : 8}
                      className="py-10 text-center text-slate-500 dark:text-slate-400 text-sm"
                    >
                      هیچ محصولی با عبارت جستجو شده در این دسته‌بندی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredTableRows.map((row) => {
                    const { finalPrice, unitPrice, netProfit } = computeRowPricing(row);
                    const isSelectedRow = activeCalculatorRow?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleSelectRowIntoCalculator(row)}
                        className={`transition-colors cursor-pointer ${
                          isSelectedRow
                            ? 'bg-amber-50/70 dark:bg-amber-950/25'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          <div>{row.productName}</div>
                          {row.isRoundedCorner && (
                            <span className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
                              قالب دورگرد استاندارد
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono-num text-slate-700 dark:text-slate-300" dir="ltr">
                          {row.size}
                        </td>
                        <td className="py-3 px-4 font-mono-num text-slate-700 dark:text-slate-300">
                          {formatPersianPrice(row.quantity)}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                          {row.sides}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {row.deliveryTime}
                        </td>
                        {adminSettings.showBaseCostInTable && (
                          <>
                            <td
                              data-testid="admin-base-cost-cell"
                              className="py-3 px-4 font-mono-num font-bold text-rose-600 dark:text-rose-400"
                            >
                              {formatPersianPrice(row.baseCost)}
                            </td>
                            <td className="py-3 px-4 font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                              +{formatPersianPrice(netProfit)}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-4 font-mono-num text-slate-600 dark:text-slate-400">
                          {formatPersianPrice(unitPrice)}
                        </td>
                        <td className="py-3 px-4 font-mono-num font-extrabold text-slate-900 dark:text-amber-400">
                          {formatPersianPrice(finalPrice)}
                        </td>
                        <td
                          className="py-3 px-4 text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleAddToCart(row, 1, '')}
                            aria-label={`افزودن ${row.productName} سایز ${row.size} به پیش‌فاکتور`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>افزودن</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Educational Print & Prepress Kit Section */}
        <section id="prepress-kit-section" className="pt-4">
          <PrepressGuideSection isModal={false} />
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-6">
        <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {adminSettings.storeName || 'چاپ رامین'} · {adminSettings.invoiceTitle}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsPrepressModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              راهنمای شابلون و لیتوگرافی
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsPreInvoiceOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
            >
              مشاهده پیش‌فاکتور ({cartItems.length.toLocaleString('fa-IR')})
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PreInvoiceModal
        isOpen={isPreInvoiceOpen}
        onClose={() => setIsPreInvoiceOpen(false)}
        items={cartItems}
        onUpdateSeries={handleUpdateCartSeries}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        storeName={adminSettings.storeName}
        invoiceTitle={adminSettings.invoiceTitle}
        defaultStudioWhatsapp={adminSettings.storeWhatsapp}
        invoiceFooterNote={adminSettings.invoiceFooterNote}
      />

      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        settings={adminSettings}
        onUpdateSettings={handleUpdateAdminSettings}
        onUploadCustomRows={(rows, label) => {
          setAllProducts(rows);
          setDataSourceLabel(label);
        }}
        onResetToLiveSheet={syncLivePricesFromGoogleSheet}
        dataSourceLabel={dataSourceLabel}
      />

      {isPrepressModalOpen && (
        <PrepressGuideSection
          isModal={true}
          onClose={() => setIsPrepressModalOpen(false)}
        />
      )}

      {/* Global Instant Product Search Modal */}
      <ProductQuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        products={allProducts}
        onSelectProduct={handleSelectRowIntoCalculator}
        onQuickAddToCart={(p) => handleAddToCart(p, 1, '')}
        computeRowPricing={computeRowPricing}
      />
    </div>
  );
}
