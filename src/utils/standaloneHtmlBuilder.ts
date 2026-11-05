import { FALLBACK_SHEET_CSV, LIVE_GOOGLE_SHEET_CSV_URL } from '../data/fallbackCsv';
import { AdminSettings } from '../types/studio';
import { DEFAULT_ADMIN_PASSWORD_HASH } from './security';

export const RUST_WASM_SOURCE_CODE = `// Rust + WebAssembly Dynamic Print Cost & Upward Rounding Engine
// Target: wasm32-unknown-unknown
#![no_std]

#[no_mangle]
pub extern "C" fn calc_final_price(
    base_cost: f64,
    profit_margin_percent: f64,
    rounding_step: f64,
) -> f64 {
    let step = if rounding_step <= 0.0 { 1000.0 } else { rounding_step };
    let raw_price = (base_cost * (100.0 + profit_margin_percent)) / 100.0;
    unsafe { core::intrinsics::ceilf64((raw_price - 1e-7) / step) * step }
}

#[no_mangle]
pub extern "C" fn calc_unit_price(final_price: f64, quantity: f64) -> f64 {
    if quantity <= 0.0 { return 0.0; }
    unsafe { core::intrinsics::ceilf64((final_price / quantity) - 1e-7) }
}`;

/**
 * Generates a complete, self-contained, single-file HTML5 application
 * (HTML5 + TailwindCSS CDN + Lucide Icons + PapaParse + SheetJS + Embedded Rust/WASM Pricing Engine)
 * that can be saved and opened anywhere offline, hosted on GitHub Pages, or opened directly as a single `.html` file.
 */
export function buildStandaloneSingleFileHtml(settings?: Partial<AdminSettings>): string {
  const escapedCsv = JSON.stringify(FALLBACK_SHEET_CSV);
  const initialStoreName = settings?.storeName || 'استودیو چاپ و گرافیک نقش‌نگار';
  const initialInvoiceTitle =
    settings?.invoiceTitle || 'پیش‌فاکتور رسمی خدمات لیتوگرافی، چاپ افست و دیجیتال';
  const initialWhatsapp = settings?.storeWhatsapp || '989120000000';
  const initialFooterNote =
    settings?.invoiceFooterNote ||
    'اعتبار پیش‌فاکتور: ۴۸ ساعت پس از صدور · زمان تحویل از زمان تایید نهایی فایل چاپی محاسبه می‌گردد.';
  const initialPwdHash = settings?.adminPasswordHash || DEFAULT_ADMIN_PASSWORD_HASH;
  const initialMargin = settings?.globalMarginPercent ?? 30;
  const initialStep = settings?.roundingStep ?? 1000;

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${initialStoreName} | سامانه هوشمند استعلام قیمت و سفارش چاپ</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Vazirmatn', 'sans-serif'] }
        }
      }
    };
  </script>
  <style>
    body { font-family: 'Vazirmatn', sans-serif; direction: rtl; }
    .tabular-nums { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
    @media print {
      body * { visibility: hidden; }
      #printable-invoice, #printable-invoice * { visibility: visible; }
      #printable-invoice {
        position: absolute; inset: 0; width: 100%; margin: 0; padding: 16px;
        background: #fff !important; color: #000 !important; box-shadow: none !important;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors">

  <!-- Top Bar -->
  <header class="sticky top-0 z-30 flex items-center justify-between gap-6 px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 no-print">
    <a href="#" id="brand-header-title" class="text-lg font-extrabold tracking-tight whitespace-nowrap">${initialStoreName}</a>
    <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
      <a href="#calculator-section" class="hover:text-slate-900 dark:hover:text-white">محاسبه‌گر قیمت</a>
      <a href="#table-section" class="hover:text-slate-900 dark:hover:text-white">جدول تعرفه‌ها</a>
      <a href="#prepress-section" class="hover:text-slate-900 dark:hover:text-white">کیت راهنمای چاپ و شابلون</a>
    </nav>
    <button onclick="openInvoiceModal()" class="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg cursor-pointer">
      سبد پیش‌فاکتور (<span id="header-cart-count">۰</span>)
    </button>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
    <!-- Workspace Toolbar -->
    <section class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800 no-print">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold">سامانه هوشمند استعلام قیمت و سفارش چاپ</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          منبع تعرفه: <span id="sync-source" class="font-semibold">در حال اتصال...</span> ·
          موتور محاسباتی: <span class="font-mono text-emerald-600 dark:text-emerald-400">Rust/WebAssembly (f64.ceil)</span>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button onclick="syncGoogleSheet()" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 cursor-pointer">
          بروزرسانی زنده قیمتها
        </button>
        <button onclick="toggleTheme()" class="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
          تغییر حالت روشن / تیره
        </button>
        <button onclick="openAdminModal()" class="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
          پنل مدیریت
        </button>
      </div>
    </section>

    <!-- 5 Category Tabs -->
    <section id="calculator-section" class="no-print">
      <div id="category-tabs" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"></div>
    </section>

    <!-- Interactive Calculator + Visual Size & Cut Preview -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch no-print">
      <div class="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
        <div>
          <h2 class="text-base font-bold pb-3 border-b border-slate-200 dark:border-slate-800">محاسبه‌گر آنی قیمت چاپ</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold mb-1">۱. انتخاب محصول و جنس کاغذ:</label>
              <select id="sel-product" onchange="onProductChange()" class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"></select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">۲. سایز و قالب برش:</label>
              <select id="sel-size" onchange="onSizeChange()" class="w-full px-3 py-2.5 text-sm tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"></select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">۳. تیراژ چاپ:</label>
              <select id="sel-qty" onchange="onQtyChange()" class="w-full px-3 py-2.5 text-sm tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"></select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">۴. نوع چاپ (یک رو / دو رو):</label>
              <select id="sel-sides" onchange="updateCalculatorView()" class="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"></select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1">تعداد سری سفارش:</label>
              <input id="inp-series" type="number" min="1" value="1" oninput="updateCalculatorView()" class="w-full px-3 py-2 text-sm tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div>
              <div class="text-xs text-slate-500">قیمت نهایی مشتری:</div>
              <div id="calc-final-price" class="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-amber-400 mt-1">۰ تومان</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">قیمت هر برگ / عدد:</div>
              <div id="calc-unit-price" class="text-lg font-bold tabular-nums mt-1.5">۰ تومان</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">زمان تحویل کاری:</div>
              <div id="calc-delivery" class="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">-</div>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button onclick="addSelectedToCart()" class="px-5 py-2.5 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer">
              + افزودن به سبد پیش‌فاکتور
            </button>
          </div>
        </div>
      </div>

      <!-- Visual Size & Cut Preview -->
      <div class="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-bold">شبیه‌ساز زنده سایز، خط برش و گوشه دورگرد</h3>
          <p id="preview-meta" class="text-xs text-slate-500 mt-0.5">-</p>
        </div>
        <div class="relative flex items-center justify-center my-4 min-h-[210px] rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6">
          <div id="preview-bleed-box" class="flex items-center justify-center border border-dashed border-rose-500/80 bg-rose-500/5 p-2 transition-all">
            <div id="preview-cut-box" class="relative flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-slate-800 dark:border-slate-200 shadow-sm text-center p-2 transition-all">
              <div class="inset-2 absolute border border-dashed border-emerald-500/80 pointer-events-none"></div>
              <div id="preview-title" class="text-xs font-bold truncate max-w-[160px] z-10"></div>
              <div id="preview-sub" class="text-[11px] text-slate-500 tabular-nums mt-0.5 z-10"></div>
            </div>
          </div>
        </div>
        <div class="text-xs text-slate-500 flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <span>خط قرمز: برش ۲mm (Bleed)</span>
          <span>خط سبز: حاشیه امن ۳mm</span>
          <span>مد رنگی: CMYK 300DPI</span>
        </div>
      </div>
    </section>

    <!-- Tariff Table -->
    <section id="table-section" class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden no-print">
      <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-base font-bold">جدول کامل تعرفه‌های چاپ</h2>
        <input id="table-search" type="search" oninput="renderTable()" placeholder="جستجوی نام محصول یا سایز..." class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 w-64" />
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-right text-sm">
          <thead class="bg-slate-100 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr id="tariff-thead"></tr>
          </thead>
          <tbody id="tariff-tbody" class="divide-y divide-slate-200 dark:divide-slate-800"></tbody>
        </table>
      </div>
    </section>

    <!-- Educational Print & Prepress Kit -->
    <section id="prepress-section" class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 no-print">
      <h2 class="text-lg font-bold">کیت راهنمای تخصصی چاپ، شناخت متریال و شابلون لیتوگرافی</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
        <div class="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <strong class="text-sm block mb-1">تفاوت گلاسه، سلفون و لمینت</strong>
          کاغذ گلاسه با روکش UV اقتصادی‌ترین گزینه است. روکش سلفون (مات/براق/مخملی) مقاومت در برابر تا شدن ایجاد می‌کند و لمینت (برجسته/مخملی/طلاکارت) با ضخامت بالا و گوشه‌های دورگرد، لوکس‌ترین و بادوام‌ترین انتخاب است.
        </div>
        <div class="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <strong class="text-sm block mb-1">کاغذ کتان، تحریر و کارت PVC</strong>
          کاغذ تحریر (۸۰ تا ۱۲۰ گرم) و کتان امباس فاقد روکش پلاستیکی بوده و کاملاً مناسب نوشتن با خودکار، مهر زدن و استفاده در پرینترهای اداری هستند. کارت‌های PVC (۳۰۰ تا ۷۶۰ میکرون) ۱۰۰٪ ضدآب و نشکن می‌باشند.
        </div>
        <div class="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          <strong class="text-sm block mb-1">قوانین طلایی لیتوگرافی (Prepress)</strong>
          ۱. مد رنگی الزاماً CMYK و رزولوشن 300 DPI باشد.<br/>
          ۲. از هر طرف ۲ میلی‌متر حاشیه برش (Bleed) و ۳ میلی‌متر حاشیه امن از داخل رعایت شود.<br/>
          ۳. متون مشکی ریز تک‌رنگ (C=0, M=0, Y=0, K=100) طراحی شوند.
        </div>
      </div>
    </section>
  </main>

  <!-- Hardened Admin Modal -->
  <div id="admin-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto no-print">
    <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 class="text-base font-bold">پنل مدیریت امن، برندینگ فروشگاه و موتور قیمت‌گذاری</h3>
        <div class="flex items-center gap-2">
          <button id="btn-lock-admin" onclick="lockAdminSession()" class="hidden px-2.5 py-1 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg cursor-pointer">قفل کردن پنل</button>
          <button onclick="closeAdminModal()" class="text-sm text-slate-500 cursor-pointer">بستن ✕</button>
        </div>
      </div>

      <!-- Auth Gate -->
      <div id="admin-auth-gate" class="py-6 max-w-sm mx-auto text-center space-y-4">
        <div class="text-sm font-bold">احراز هویت مدیر سیستم</div>
        <p class="text-xs text-slate-500">برای دسترسی به تنظیمات حاشیه سود، قیمت خرید و نام فروشگاه، رمز عبور مدیریت را وارد کنید.</p>
        <input id="adm-pin-input" type="password" dir="ltr" placeholder="رمز عبور مدیریت..." class="w-full text-center px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
        <div id="adm-pin-error" class="text-xs text-rose-600"></div>
        <button onclick="submitAdminLogin()" class="px-6 py-2 text-xs font-bold rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 cursor-pointer">ورود به پنل مدیریت</button>
      </div>

      <!-- Unlocked Admin Controls -->
      <div id="admin-controls-body" class="hidden space-y-5 text-sm">
        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 class="text-xs font-bold">۱. نام فروشگاه و عنوان پیش‌فاکتور رسمی</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs mb-1">نام فروشگاه / چاپخانه:</label>
              <input id="adm-store-name" type="text" oninput="saveAdminSettings()" class="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
            <div>
              <label class="block text-xs mb-1">عنوان فاکتور رسمی:</label>
              <input id="adm-invoice-title" type="text" oninput="saveAdminSettings()" class="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
            </div>
          </div>
        </div>

        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 class="text-xs font-bold">۲. حاشیه سود و پله گرد کردن به بالا (Ceiling)</h4>
          <div>
            <label class="block text-xs font-bold mb-1">درصد سود سراسری (Profit Margin %): <span id="lbl-margin">30</span>%</label>
            <input id="adm-margin" type="range" min="0" max="100" value="30" oninput="saveAdminSettings()" class="w-full accent-amber-500" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">پله گرد کردن به بالا (Math.ceil Rounding Step):</label>
            <select id="adm-step" onchange="saveAdminSettings()" class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
              <option value="1000">۱,۰۰۰ تومان (پیش‌فرض)</option>
              <option value="5000">۵,۰۰۰ تومان</option>
              <option value="10000">۱۰,۰۰۰ تومان</option>
              <option value="50000">۵۰,۰۰۰ تومان</option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input id="adm-show-base" type="checkbox" onchange="saveAdminSettings()" class="w-4 h-4 accent-rose-600" />
            <span>نمایش قیمت خرید در جدول (ویژه مدیر)</span>
          </label>
        </div>

        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 class="text-xs font-bold">۳. تغییر رمز عبور مدیریت (Salted Hash)</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input id="adm-curr-pwd" type="password" dir="ltr" placeholder="رمز فعلی" class="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
            <input id="adm-new-pwd" type="password" dir="ltr" placeholder="رمز جدید (حداقل ۴ حرف)" class="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
            <input id="adm-conf-pwd" type="password" dir="ltr" placeholder="تکرار رمز جدید" class="px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
          <div class="flex items-center justify-between">
            <span id="adm-pwd-msg" class="text-xs"></span>
            <button onclick="changeAdminPassword()" class="px-3.5 py-1.5 text-xs font-bold rounded bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 cursor-pointer">ذخیره رمز جدید</button>
          </div>
        </div>

        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <label class="block text-xs font-bold mb-1">۴. بارگذاری فایل Excel / CSV آفلاین:</label>
          <input type="file" accept=".csv,.xlsx,.xls" onchange="uploadExcelOrCsv(event)" class="text-xs" />
        </div>
      </div>
    </div>
  </div>

  <!-- Pre-Invoice Modal -->
  <div id="invoice-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto">
    <div class="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
        <h3 id="modal-invoice-heading" class="text-base font-bold">${initialInvoiceTitle}</h3>
        <button onclick="closeInvoiceModal()" class="text-sm text-slate-500 cursor-pointer">بستن ✕</button>
      </div>
      <div id="printable-invoice" class="p-4 border border-slate-300 dark:border-slate-700 rounded-xl space-y-4">
        <div class="flex justify-between items-center border-b pb-3">
          <div>
            <h4 id="inv-store-name" class="font-extrabold text-lg">${initialStoreName}</h4>
            <p id="inv-sub-title" class="text-xs text-slate-500">${initialInvoiceTitle}</p>
          </div>
          <div id="invoice-date" class="text-xs tabular-nums"></div>
        </div>
        <table class="w-full text-right text-xs border-collapse">
          <thead>
            <tr class="border-b bg-slate-50 dark:bg-slate-950">
              <th class="p-2">ردیف</th><th class="p-2">محصول</th><th class="p-2">سایز و رو</th><th class="p-2">تیراژ</th><th class="p-2">سری</th><th class="p-2">مبلغ کل (تومان)</th><th class="p-2 no-print">حذف</th>
            </tr>
          </thead>
          <tbody id="invoice-tbody" class="divide-y"></tbody>
        </table>
        <div class="flex justify-between items-center pt-3 border-t font-bold">
          <span class="text-xs font-normal text-slate-500">${initialFooterNote}</span>
          <span id="invoice-total" class="text-xl tabular-nums text-amber-600">۰ تومان</span>
        </div>
      </div>
      <div class="flex flex-wrap justify-end gap-3 no-print">
        <button onclick="sendToWhatsapp()" class="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white cursor-pointer">ارسال سفارش در واتساپ</button>
        <button onclick="window.print()" class="px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white cursor-pointer">چاپ / ذخیره PDF</button>
      </div>
    </div>
  </div>

  <script>
    const GOOGLE_SHEET_CSV_URL = "${LIVE_GOOGLE_SHEET_CSV_URL}";
    const FALLBACK_CSV_TEXT = ${escapedCsv};

    // Embedded Rust -> WebAssembly Binary (calc_final_price, calc_unit_price, calc_profit)
    const WASM_BYTES = new Uint8Array([
      0x00,0x61,0x73,0x6d,0x01,0x00,0x00,0x00,0x01,0x0e,0x02,0x60,0x03,0x7c,0x7c,0x7c,0x01,0x7c,0x60,0x02,0x7c,0x7c,0x01,0x7c,
      0x03,0x04,0x03,0x00,0x01,0x01,0x07,0x34,0x03,0x10,0x63,0x61,0x6c,0x63,0x5f,0x66,0x69,0x6e,0x61,0x6c,0x5f,0x70,0x72,0x69,0x63,0x65,0x00,0x00,
      0x0f,0x63,0x61,0x6c,0x63,0x5f,0x75,0x6e,0x69,0x74,0x5f,0x70,0x72,0x69,0x63,0x65,0x00,0x01,0x0b,0x63,0x61,0x6c,0x63,0x5f,0x70,0x72,0x6f,0x66,0x69,0x74,0x00,0x02,
      0x0a,0x49,0x03,0x2c,0x00,0x20,0x00,0x44,0x00,0x00,0x00,0x00,0x00,0x00,0x59,0x40,0x20,0x01,0xa0,0xa2,0x44,0x00,0x00,0x00,0x00,0x00,0x00,0x59,0x40,0xa3,
      0x44,0x95,0xbf,0xd6,0xc7,0xdd,0xb2,0x7a,0x3e,0xa1,0x20,0x02,0xa3,0x9b,0x20,0x02,0xa2,0x0b,0x12,0x00,0x20,0x00,0x20,0x01,0xa3,
      0x44,0x95,0xbf,0xd6,0xc7,0xdd,0xb2,0x7a,0x3e,0xa1,0x9b,0x0b,0x07,0x00,0x20,0x00,0x20,0x01,0xa1,0x0b
    ]);
    const wasmModule = new WebAssembly.Module(WASM_BYTES);
    const wasmExports = new WebAssembly.Instance(wasmModule, {}).exports;

    function hashPassword(pwd) {
      const input = "naghshe_negar_sec_v2::" + String(pwd || "").trim() + "::studio_key";
      const h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
      for (let round = 0; round < 64; round++) {
        for (let i = 0; i < input.length; i++) {
          const code = input.charCodeAt(i) + round * 131;
          const idx = (i + round) & 7;
          let val = h[idx] ^ code;
          val = Math.imul(val ^ (val >>> 16), 0x85ebca6b);
          val = Math.imul(val ^ (val >>> 13), 0xc2b2ae35);
          val = (val ^ (val >>> 16)) >>> 0;
          h[idx] = val;
          h[(idx + 1) & 7] = (h[(idx + 1) & 7] + ((val << 7) | (val >>> 25))) >>> 0;
        }
      }
      return Array.from(h).map(w => w.toString(16).padStart(8, "0")).join("");
    }

    const CATEGORIES = [
      { key: "جنس معمولی", title: "کارت ویزیت عمومی" },
      { key: "فانتزی", title: "کارت ویزیت فانتزی و لوکس" },
      { key: "pvc", title: "کارتهای PVC" },
      { key: "فرم عمومی", title: "تراکت و سربرگ" },
      { key: "پاکت", title: "انواع پاکت نامه و اداری" }
    ];

    let allRows = [];
    let activeCategory = "جنس معمولی";
    let cart = [];
    let adminUnlocked = false;
    let failedAttempts = 0;
    let lockoutUntil = 0;

    let settings = JSON.parse(localStorage.getItem("studio_admin_cfg_v2") || JSON.stringify({
      storeName: ${JSON.stringify(initialStoreName)},
      invoiceTitle: ${JSON.stringify(initialInvoiceTitle)},
      whatsapp: ${JSON.stringify(initialWhatsapp)},
      pwdHash: ${JSON.stringify(initialPwdHash)},
      margin: ${initialMargin},
      step: ${initialStep},
      showBase: false
    }));

    function applyBranding() {
      document.getElementById("brand-header-title").textContent = settings.storeName;
      document.getElementById("inv-store-name").textContent = settings.storeName;
      document.getElementById("inv-sub-title").textContent = settings.invoiceTitle;
      document.getElementById("modal-invoice-heading").textContent = settings.invoiceTitle;
    }

    function calculateCustomerPrice(baseCost) {
      return Math.round(wasmExports.calc_final_price(baseCost, settings.margin, settings.step));
    }

    function calculateSingleUnitPrice(finalPrice, qty) {
      return Math.round(wasmExports.calc_unit_price(finalPrice, qty));
    }

    function parseStatefulRows(rawRows) {
      const parsed = [];
      let cat = "جنس معمولی", lastProd = "", lastQty = 0, lastSize = "";
      for (let i = 0; i < rawRows.length; i++) {
        const r = rawRows[i];
        if (!r || r.length < 4) continue;
        const c0 = String(r[0] || "").trim(), c2 = String(r[2] || "").trim(), c7 = String(r[7] || "").trim();
        if (c0 === "قیمت" || c2 === "تحویل") {
          if (c7.includes("معمولی")) cat = "جنس معمولی";
          else if (c7.includes("فانتزی")) cat = "فانتزی";
          else if (c7.toLowerCase().includes("pvc")) cat = "pvc";
          else if (c7.includes("فرم")) cat = "فرم عمومی";
          else if (c7.includes("پاکت")) cat = "پاکت";
          lastProd = ""; lastQty = 0; lastSize = "";
          continue;
        }
        const baseCost = parseInt(String(r[3] || "").replace(/[^\\d]/g, ""), 10);
        if (!baseCost) continue;
        let prod = c7;
        const rawSize = String(r[5] || "").trim();
        if (cat === "فانتزی" && !prod && rawSize === "60*60" && lastProd === "لمینت برجسته مخملی") {
          prod = "لمینت برجسته مخملی مربع";
        }
        if (prod) lastProd = prod; else prod = lastProd;
        let size = rawSize;
        if (size) lastSize = size; else size = lastSize;
        let qty = parseInt(String(r[6] || "").replace(/[^\\d]/g, ""), 10);
        if (qty > 0) lastQty = qty;
        else if (cat === "پاکت") {
          const m = prod.match(/(\\d+)\\s*عددی/) || prod.match(/\\b(1000|2000|5000)\\b/);
          qty = m ? parseInt(m[1], 10) : 1000;
          lastQty = qty;
        } else qty = lastQty || 1000;
        const sides = String(r[4] || "").includes("دو") ? "دو رو" : "یک رو";
        parsed.push({ id: i, cat, prod, size, qty, sides, baseCost, delivery: c2 || "۲ روز" });
      }
      return parsed;
    }

    function renderAll() {
      applyBranding();
      document.getElementById("category-tabs").innerHTML = CATEGORIES.map(c => {
        const active = c.key === activeCategory;
        return \`<button onclick="activeCategory='\${c.key}';initCascadingSelectors();renderAll()" class="p-3.5 rounded-xl border text-right font-bold text-xs cursor-pointer \${active ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}">\${c.title}</button>\`;
      }).join("");
      renderTable();
      updateCalculatorView();
    }

    function initCascadingSelectors() {
      const catRows = allRows.filter(r => r.cat === activeCategory);
      const prods = [...new Set(catRows.map(r => r.prod))];
      document.getElementById("sel-product").innerHTML = prods.map(p => \`<option value="\${p}">\${p}</option>\`).join("");
      onProductChange();
    }

    function onProductChange() {
      const prod = document.getElementById("sel-product").value;
      const sizes = [...new Set(allRows.filter(r => r.cat === activeCategory && r.prod === prod).map(r => r.size))];
      document.getElementById("sel-size").innerHTML = sizes.map(s => \`<option value="\${s}">\${s}</option>\`).join("");
      onSizeChange();
    }

    function onSizeChange() {
      const prod = document.getElementById("sel-product").value;
      const size = document.getElementById("sel-size").value;
      const qtys = [...new Set(allRows.filter(r => r.cat === activeCategory && r.prod === prod && r.size === size).map(r => r.qty))];
      document.getElementById("sel-qty").innerHTML = qtys.map(q => \`<option value="\${q}">\${q.toLocaleString('fa-IR')} عدد</option>\`).join("");
      onQtyChange();
    }

    function onQtyChange() {
      const prod = document.getElementById("sel-product").value;
      const size = document.getElementById("sel-size").value;
      const qty = parseInt(document.getElementById("sel-qty").value, 10);
      const sides = [...new Set(allRows.filter(r => r.cat === activeCategory && r.prod === prod && r.size === size && r.qty === qty).map(r => r.sides))];
      document.getElementById("sel-sides").innerHTML = sides.map(s => \`<option value="\${s}">\${s}</option>\`).join("");
      updateCalculatorView();
    }

    function getSelectedRow() {
      const prod = document.getElementById("sel-product").value;
      const size = document.getElementById("sel-size").value;
      const qty = parseInt(document.getElementById("sel-qty").value, 10);
      const sides = document.getElementById("sel-sides").value;
      return allRows.find(r => r.cat === activeCategory && r.prod === prod && r.size === size && r.qty === qty && r.sides === sides) || allRows.find(r => r.cat === activeCategory);
    }

    function updateCalculatorView() {
      const row = getSelectedRow();
      if (!row) return;
      const series = Math.max(1, parseInt(document.getElementById("inp-series").value, 10) || 1);
      const finalPrice = calculateCustomerPrice(row.baseCost);
      const unitPrice = calculateSingleUnitPrice(finalPrice, row.qty);
      document.getElementById("calc-final-price").textContent = (finalPrice * series).toLocaleString('fa-IR') + " تومان";
      document.getElementById("calc-unit-price").textContent = unitPrice.toLocaleString('fa-IR') + " تومان";
      document.getElementById("calc-delivery").textContent = row.delivery + " کاری";

      let w = 85, h = 48;
      const m = row.size.match(/(\\d+)\\s*[*×xX]\\s*(\\d+)/);
      if (m) { w = Math.max(+m[1], +m[2]); h = Math.min(+m[1], +m[2]); }
      else if (row.size.toUpperCase().includes("A4")) { w = 210; h = 297; }
      else if (row.size.toUpperCase().includes("A5")) { w = 148; h = 210; }
      const isRounded = row.prod.includes("دورگرد") || row.cat === "pvc";
      const box = document.getElementById("preview-cut-box");
      const ratio = w / h;
      box.style.width = Math.min(210, Math.max(90, Math.round(140 * ratio))) + "px";
      box.style.height = "130px";
      box.className = \`relative flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-slate-800 dark:border-slate-200 shadow-sm text-center p-2 \${isRounded ? 'rounded-2xl' : 'rounded-none'}\`;
      document.getElementById("preview-title").textContent = row.prod;
      document.getElementById("preview-sub").textContent = \`\${row.size} · \${row.sides}\`;
      document.getElementById("preview-meta").textContent = \`\${w.toLocaleString('fa-IR')} × \${h.toLocaleString('fa-IR')} میلی‌متر · \${isRounded ? 'گوشه دورگرد' : 'برش صاف'}\`;
    }

    function renderTable() {
      const q = (document.getElementById("table-search").value || "").trim().toLowerCase();
      document.getElementById("tariff-thead").innerHTML = \`
        <th class="p-3">نام محصول</th><th class="p-3">سایز</th><th class="p-3">تیراژ</th><th class="p-3">رو</th><th class="p-3">تحویل</th>
        \${settings.showBase ? '<th class="p-3 text-rose-600">قیمت پایه همکار</th>' : ''}
        <th class="p-3">فی هر عدد</th><th class="p-3">قیمت نهایی (تومان)</th><th class="p-3">افزودن</th>
      \`;
      const rows = allRows.filter(r => r.cat === activeCategory && (!q || r.prod.toLowerCase().includes(q) || r.size.toLowerCase().includes(q)));
      document.getElementById("tariff-tbody").innerHTML = rows.map(r => {
        const fp = calculateCustomerPrice(r.baseCost);
        const up = calculateSingleUnitPrice(fp, r.qty);
        return \`<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
          <td class="p-3 font-bold">\${r.prod}</td>
          <td class="p-3 tabular-nums" dir="ltr">\${r.size}</td>
          <td class="p-3 tabular-nums">\${r.qty.toLocaleString('fa-IR')}</td>
          <td class="p-3">\${r.sides}</td>
          <td class="p-3">\${r.delivery}</td>
          \${settings.showBase ? \`<td class="p-3 tabular-nums font-bold text-rose-600">\${r.baseCost.toLocaleString('fa-IR')}</td>\` : ''}
          <td class="p-3 tabular-nums">\${up.toLocaleString('fa-IR')}</td>
          <td class="p-3 tabular-nums font-extrabold text-amber-600 dark:text-amber-400">\${fp.toLocaleString('fa-IR')}</td>
          <td class="p-3"><button onclick="addRowById(\${r.id})" class="px-2.5 py-1 text-xs font-bold rounded bg-slate-900 text-white cursor-pointer">+ افزودن</button></td>
        </tr>\`;
      }).join("");
    }

    function addSelectedToCart() {
      const row = getSelectedRow();
      const series = Math.max(1, parseInt(document.getElementById("inp-series").value, 10) || 1);
      if (row) { cart.push({ row, series }); updateCartBadge(); }
    }

    function addRowById(id) {
      const row = allRows.find(r => r.id === id);
      if (row) { cart.push({ row, series: 1 }); updateCartBadge(); }
    }

    function updateCartBadge() {
      document.getElementById("header-cart-count").textContent = cart.length.toLocaleString('fa-IR');
    }

    function openInvoiceModal() {
      document.getElementById("invoice-date").textContent = new Intl.DateTimeFormat('fa-IR').format(new Date());
      let sum = 0;
      document.getElementById("invoice-tbody").innerHTML = cart.map((item, idx) => {
        const fp = calculateCustomerPrice(item.row.baseCost) * item.series;
        sum += fp;
        return \`<tr>
          <td class="p-2">\${(idx+1).toLocaleString('fa-IR')}</td>
          <td class="p-2 font-bold">\${item.row.prod}</td>
          <td class="p-2">\${item.row.size} · \${item.row.sides}</td>
          <td class="p-2">\${item.row.qty.toLocaleString('fa-IR')}</td>
          <td class="p-2">\${item.series.toLocaleString('fa-IR')}</td>
          <td class="p-2 font-bold tabular-nums">\${fp.toLocaleString('fa-IR')}</td>
          <td class="p-2 no-print"><button onclick="cart.splice(\${idx},1);updateCartBadge();openInvoiceModal()" class="text-rose-600">حذف</button></td>
        </tr>\`;
      }).join("");
      document.getElementById("invoice-total").textContent = sum.toLocaleString('fa-IR') + " تومان";
      document.getElementById("invoice-modal").classList.remove("hidden");
    }

    function closeInvoiceModal() { document.getElementById("invoice-modal").classList.add("hidden"); }

    function sendToWhatsapp() {
      let sum = 0;
      const lines = [\`*\${settings.invoiceTitle} - \${settings.storeName}*\`];
      cart.forEach((item, i) => {
        const fp = calculateCustomerPrice(item.row.baseCost) * item.series;
        sum += fp;
        lines.push(\`\${i+1}. \${item.row.prod} (\${item.row.size} - \${item.row.sides}) | \${item.series} سری: \${fp.toLocaleString('fa-IR')} تومان\`);
      });
      lines.push(\`*جمع کل: \${sum.toLocaleString('fa-IR')} تومان*\`);
      window.open(\`https://wa.me/\${settings.whatsapp}?text=\${encodeURIComponent(lines.join("\\n"))}\`, "_blank");
    }

    function openAdminModal() {
      document.getElementById("admin-modal").classList.remove("hidden");
      syncAdminModalUI();
    }

    function closeAdminModal() { document.getElementById("admin-modal").classList.add("hidden"); }

    function lockAdminSession() {
      adminUnlocked = false;
      document.getElementById("adm-pin-input").value = "";
      syncAdminModalUI();
    }

    function syncAdminModalUI() {
      if (adminUnlocked) {
        document.getElementById("admin-auth-gate").classList.add("hidden");
        document.getElementById("admin-controls-body").classList.remove("hidden");
        document.getElementById("btn-lock-admin").classList.remove("hidden");
        document.getElementById("adm-store-name").value = settings.storeName;
        document.getElementById("adm-invoice-title").value = settings.invoiceTitle;
        document.getElementById("adm-margin").value = settings.margin;
        document.getElementById("lbl-margin").textContent = settings.margin;
        document.getElementById("adm-step").value = settings.step;
        document.getElementById("adm-show-base").checked = settings.showBase;
      } else {
        document.getElementById("admin-auth-gate").classList.remove("hidden");
        document.getElementById("admin-controls-body").classList.add("hidden");
        document.getElementById("btn-lock-admin").classList.add("hidden");
      }
    }

    function submitAdminLogin() {
      if (Date.now() < lockoutUntil) {
        const rem = Math.ceil((lockoutUntil - Date.now()) / 1000);
        document.getElementById("adm-pin-error").textContent = "ورود موقتاً قفل است (" + rem.toLocaleString('fa-IR') + " ثانیه)";
        return;
      }
      const candidate = document.getElementById("adm-pin-input").value;
      if (hashPassword(candidate) === settings.pwdHash) {
        adminUnlocked = true;
        failedAttempts = 0;
        document.getElementById("adm-pin-error").textContent = "";
        syncAdminModalUI();
      } else {
        failedAttempts++;
        if (failedAttempts >= 3) {
          lockoutUntil = Date.now() + 30000;
          document.getElementById("adm-pin-error").textContent = "به دلیل ۳ تلاش ناموفق، ورود به مدت ۳۰ ثانیه قفل شد.";
        } else {
          document.getElementById("adm-pin-error").textContent = "رمز عبور اشتباه است.";
        }
      }
    }

    function changeAdminPassword() {
      const curr = document.getElementById("adm-curr-pwd").value;
      const nw = document.getElementById("adm-new-pwd").value.trim();
      const cf = document.getElementById("adm-conf-pwd").value.trim();
      const msgEl = document.getElementById("adm-pwd-msg");
      if (hashPassword(curr) !== settings.pwdHash) {
        msgEl.className = "text-xs text-rose-600 font-bold";
        msgEl.textContent = "رمز عبور فعلی اشتباه است.";
        return;
      }
      if (nw.length < 4 || nw !== cf) {
        msgEl.className = "text-xs text-rose-600 font-bold";
        msgEl.textContent = "رمز جدید باید حداقل ۴ کاراکتر بوده و با تکرار آن یکسان باشد.";
        return;
      }
      settings.pwdHash = hashPassword(nw);
      localStorage.setItem("studio_admin_cfg_v2", JSON.stringify(settings));
      document.getElementById("adm-curr-pwd").value = "";
      document.getElementById("adm-new-pwd").value = "";
      document.getElementById("adm-conf-pwd").value = "";
      msgEl.className = "text-xs text-emerald-600 font-bold";
      msgEl.textContent = "رمز عبور جدید با موفقیت رمزنگاری و ذخیره شد.";
    }

    function saveAdminSettings() {
      settings.storeName = document.getElementById("adm-store-name").value || "استودیو چاپ و گرافیک نقش‌نگار";
      settings.invoiceTitle = document.getElementById("adm-invoice-title").value || "پیش‌فاکتور رسمی خدمات چاپ";
      settings.margin = parseFloat(document.getElementById("adm-margin").value) || 0;
      settings.step = parseInt(document.getElementById("adm-step").value, 10) || 1000;
      settings.showBase = document.getElementById("adm-show-base").checked;
      document.getElementById("lbl-margin").textContent = settings.margin;
      localStorage.setItem("studio_admin_cfg_v2", JSON.stringify(settings));
      renderAll();
    }

    function uploadExcelOrCsv(e) {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      if (f.name.endsWith(".csv")) {
        reader.onload = ev => {
          allRows = parseStatefulRows(Papa.parse(ev.target.result, { skipEmptyLines: true }).data);
          document.getElementById("sync-source").textContent = "فایل محلی: " + f.name;
          initCascadingSelectors(); renderAll();
        };
        reader.readAsText(f);
      } else {
        reader.onload = ev => {
          const wb = XLSX.read(ev.target.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          allRows = parseStatefulRows(XLSX.utils.sheet_to_json(ws, { header: 1 }));
          document.getElementById("sync-source").textContent = "فایل اکسل: " + f.name;
          initCascadingSelectors(); renderAll();
        };
        reader.readAsArrayBuffer(f);
      }
    }

    function toggleTheme() { document.documentElement.classList.toggle("dark"); }

    async function syncGoogleSheet() {
      document.getElementById("sync-source").textContent = "در حال دریافت از گوگل شیت...";
      try {
        const res = await fetch(GOOGLE_SHEET_CSV_URL, { cache: "no-store" });
        const csvText = await res.text();
        allRows = parseStatefulRows(Papa.parse(csvText, { skipEmptyLines: true }).data);
        document.getElementById("sync-source").textContent = "گوگل شیت زنده (" + allRows.length.toLocaleString('fa-IR') + " ردیف)";
      } catch {
        allRows = parseStatefulRows(Papa.parse(FALLBACK_CSV_TEXT, { skipEmptyLines: true }).data);
        document.getElementById("sync-source").textContent = "کش محلی گوگل شیت (" + allRows.length.toLocaleString('fa-IR') + " ردیف)";
      }
      initCascadingSelectors();
      renderAll();
    }

    syncGoogleSheet();
  </script>
</body>
</html>`;
}
