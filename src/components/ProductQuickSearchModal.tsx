import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Plus,
  Check,
  Clock,
  Sparkles,
  ArrowLeft,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { PrintCategoryKey, PrintProductRow, PRINT_CATEGORIES } from '../utils/sheetParser';
import { searchProducts } from '../utils/categoryHelpers';

interface ProductQuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: PrintProductRow[];
  onSelectProduct: (product: PrintProductRow) => void;
  onQuickAddToCart: (product: PrintProductRow) => void;
  computeRowPricing: (row: PrintProductRow) => {
    finalPrice: number;
    unitPrice: number;
    marginPercent: number;
  };
}

const POPULAR_KEYWORDS = [
  'لمینت برجسته',
  'لیبل شیشه‌ای',
  'پاکت ملخی',
  'تراکت A5',
  'فاکتور کاربن لس',
  'Table Mat زیربشقابی',
  'لیوان کاغذی',
  '۶ ساعته فوری',
  'طلاکوب و مخملی',
  'سلفون مات دورگرد',
  'پی وی سی',
  'لیبل دایره‌ای',
];

export function ProductQuickSearchModal({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onQuickAddToCart,
  computeRowPricing,
}: ProductQuickSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PrintCategoryKey | 'all'>('all');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    return searchProducts(products, query, selectedCategory);
  }, [products, query, selectedCategory]);

  const handleQuickAdd = (row: PrintProductRow, e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAddToCart(row);
    setRecentlyAddedId(row.id);
    setTimeout(() => setRecentlyAddedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-search-heading"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
              <Search className="w-5 h-5 text-amber-500" />
              <h2 id="quick-search-heading">جستجوی هوشمند در کلیه ۳۸۳ محصول چاپی</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="بستن جستجو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="نام محصول، جنس، سایز، فوری، ۶ ساعته یا ویژگی دلخواه..."
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="پاک کردن"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-400">
                Esc
              </span>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              همه دسته‌ها ({products.length.toLocaleString('fa-IR')})
            </button>
            {PRINT_CATEGORIES.map((cat) => {
              const count = products.filter((p) => p.category === cat.key).length;
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {cat.shortTitle} ({count.toLocaleString('fa-IR')})
                </button>
              );
            })}
          </div>

          {/* Popular Keyword Chips (if query is empty) */}
          {!query && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                عبارات پرکاربرد:
              </span>
              {POPULAR_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setQuery(kw)}
                  className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-[11px] cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Count & Status */}
        <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>
            {query.trim() ? (
              <>
                نتایج جستجو برای <strong className="text-slate-800 dark:text-slate-200">«{query}»</strong>: {searchResults.length.toLocaleString('fa-IR')} محصول
              </>
            ) : (
              <>نمایش کلیه {searchResults.length.toLocaleString('fa-IR')} محصول دسته‌بندی انتخابی</>
            )}
          </span>
          <span className="text-[11px] text-slate-400">
            روی هر محصول کلیک کنید تا در فرم محاسبه فعال شود
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2 sm:p-3 space-y-1">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                محصولی با عبارت «{query}» یافت نشد.
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                می‌توانید از فیلترهای بالا استفاده کنید یا کلمات کلیدی عام مانند «گلاسه»، «سلفون»، «تراکت»، «پاکت» یا «فوری» را جستجو نمایید.
              </p>
            </div>
          ) : (
            searchResults.slice(0, 100).map((row) => {
              const pricing = computeRowPricing(row);
              const isJustAdded = recentlyAddedId === row.id;

              return (
                <div
                  key={row.id}
                  onClick={() => {
                    onSelectProduct(row);
                    onClose();
                  }}
                  className="group p-3 rounded-xl hover:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {row.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {row.productName}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300" dir="ltr">
                        {row.size}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{row.sides}</span>
                      <span aria-hidden>·</span>
                      <span className="font-mono-num">{row.quantity.toLocaleString('fa-IR')} عدد</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {row.deliveryTime}
                      </span>
                    </div>
                  </div>

                  {/* Pricing & Direct Add */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-amber-400 font-mono-num">
                        {pricing.finalPrice.toLocaleString('fa-IR')} تومان
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono-num">
                        فی: {pricing.unitPrice.toLocaleString('fa-IR')} تومان
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(row, e)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                        title="افزودن مستقیم ۱ سری به سبد پیش‌فاکتور"
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>افزوده شد</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>پیش‌فاکتور</span>
                          </>
                        )}
                      </button>

                      <div className="hidden sm:flex text-slate-400 group-hover:text-amber-500 transition-colors p-1">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            کلید میانبر باز کردن سریع جستجو: <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border font-mono text-[11px]">/</kbd>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
