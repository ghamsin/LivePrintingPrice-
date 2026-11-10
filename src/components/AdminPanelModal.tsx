import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Lock,
  Unlock,
  Sliders,
  Upload,
  Cpu,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Code2,
  ShieldAlert,
  KeyRound,
  Store,
  LogOut,
} from 'lucide-react';
import {
  AdminSettings,
  DEFAULT_ADMIN_SETTINGS,
  RoundingStepOption,
} from '../types/studio';
import {
  PRINT_CATEGORIES,
  PrintCategoryKey,
  PrintProductRow,
  parsePrintSheetRows,
  normalizeCategoryHeader,
} from '../utils/sheetParser';
import {
  calculateFinalPrice,
  isWasmEngineReady,
  runWasmPricingBenchmark,
} from '../utils/wasmPricingEngine';
import {
  buildStandaloneSingleFileHtml,
  RUST_WASM_SOURCE_CODE,
} from '../utils/standaloneHtmlBuilder';
import {
  verifyAdminPassword,
  validatePasswordChange,
} from '../utils/security';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  onUpdateSettings: (next: AdminSettings) => void;
  onUploadCustomRows: (rows: PrintProductRow[], sourceLabel: string) => void;
  onResetToLiveSheet: () => void;
  dataSourceLabel: string;
}

const ROUNDING_STEPS: { value: RoundingStepOption; label: string }[] = [
  { value: 1000, label: '۱,۰۰۰ تومان (پیش‌فرض)' },
  { value: 5000, label: '۵,۰۰۰ تومان' },
  { value: 10000, label: '۱۰,۰۰۰ تومان' },
  { value: 50000, label: '۵۰,۰۰۰ تومان' },
];

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 30;

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onUploadCustomRows,
  onResetToLiveSheet,
  dataSourceLabel,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [pinError, setPinError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState(0);

  // Change password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showRustSource, setShowRustSource] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    iterations: number;
    durationMs: number;
    opsPerSec: number;
    isNativeWasm: boolean;
  } | null>(null);

  // Countdown timer for brute-force lockout
  useEffect(() => {
    if (lockoutRemainingSec <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemainingSec((prev) => {
        if (prev <= 1) {
          setFailedAttempts(0);
          setPinError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemainingSec]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSec > 0) return;

    const candidate = pinInput.trim();
    if (verifyAdminPassword(candidate, settings.adminPasswordHash)) {
      setIsUnlocked(true);
      setPinInput('');
      setPinError('');
      setFailedAttempts(0);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutRemainingSec(LOCKOUT_DURATION_SECONDS);
        setPinError(
          `به دلیل ${MAX_FAILED_ATTEMPTS.toLocaleString('fa-IR')} تلاش ناموفق، ورود به مدت ${LOCKOUT_DURATION_SECONDS.toLocaleString('fa-IR')} ثانیه قفل شد.`
        );
      } else {
        const remaining = MAX_FAILED_ATTEMPTS - nextAttempts;
        setPinError(
          `رمز عبور اشتباه است. (${remaining.toLocaleString('fa-IR')} تلاش دیگر باقی مانده است)`
        );
      }
    }
  };

  const handleLockSession = () => {
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
    setPwdMessage(null);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePasswordChange(
      currentPwd,
      newPwd,
      confirmPwd,
      settings.adminPasswordHash
    );
    if (!validation.valid || !validation.nextHash) {
      setPwdMessage({
        type: 'error',
        text: validation.error || 'خطا در تغییر رمز عبور.',
      });
      return;
    }

    onUpdateSettings({
      ...settings,
      adminPasswordHash: validation.nextHash,
      hasChangedDefaultPassword: true,
    });
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setPwdMessage({
      type: 'success',
      text: 'رمز عبور مدیریت با موفقیت رمزنگاری (Salted Hash) و ذخیره شد.',
    });
  };

  const handleGlobalMarginChange = (val: number) => {
    const clamped = Math.max(0, Math.min(200, Math.round(val)));
    onUpdateSettings({
      ...settings,
      globalMarginPercent: clamped,
    });
  };

  const handleCategoryMarginChange = (cat: PrintCategoryKey, val: number) => {
    const clamped = Math.max(0, Math.min(200, Math.round(val)));
    onUpdateSettings({
      ...settings,
      categoryMargins: {
        ...settings.categoryMargins,
        [cat]: clamped,
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    if (fileName.toLowerCase().endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = String(ev.target?.result || '');
        const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
        const rows = parsePrintSheetRows(parsed.data || []);
        if (rows.length > 0) {
          onUploadCustomRows(rows, `فایل محلی: ${fileName}`);
          setUploadStatus(
            `${rows.length.toLocaleString('fa-IR')} ردیف محصول با موفقیت از فایل CSV بارگذاری شد.`
          );
        } else {
          setUploadStatus('خطا: هیچ ردیف معتبری در فایل یافت نشد.');
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const buffer = ev.target?.result;
        if (!buffer) return;
        const workbook = XLSX.read(buffer, { type: 'array' });
        let allUploadedRows: PrintProductRow[] = [];

        // Parse all sheets in the workbook
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rawMatrix = XLSX.utils.sheet_to_json<string[]>(worksheet, {
            header: 1,
            defval: '',
          });
          const detected = normalizeCategoryHeader(sheetName) || 'کارت ویزیت';
          const sheetRows = parsePrintSheetRows(rawMatrix, detected);
          allUploadedRows = allUploadedRows.concat(sheetRows);
        }

        if (allUploadedRows.length > 0) {
          onUploadCustomRows(
            allUploadedRows,
            `فایل اکسل (${workbook.SheetNames.length} شیت): ${fileName}`
          );
          setUploadStatus(
            `${allUploadedRows.length.toLocaleString(
              'fa-IR'
            )} ردیف محصول از ${workbook.SheetNames.length.toLocaleString(
              'fa-IR'
            )} شیت با موفقیت بارگذاری شد.`
          );
        } else {
          setUploadStatus('خطا: ساختار ستون‌های فایل اکسل با قالب استاندارد مطابقت ندارد.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleRunBenchmark = () => {
    const res = runWasmPricingBenchmark(250000);
    setBenchmarkResult(res);
  };

  const handleDownloadStandaloneHtml = () => {
    const htmlContent = buildStandaloneSingleFileHtml(settings);
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

  // Sample calculation preview for 1,503,700 Toman base cost
  const sampleBase = 1503700;
  const sampleRaw = Math.round((sampleBase * (100 + settings.globalMarginPercent)) / 100);
  const sampleRounded = calculateFinalPrice(
    sampleBase,
    settings.globalMarginPercent,
    settings.roundingStep
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="پنل مدیریت حاشیه سود و تنظیمات قیمت‌گذاری"
    >
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <Unlock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              پنل مدیریت امن، برندینگ فروشگاه و موتور قیمت‌گذاری
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={handleLockSession}
                data-testid="lock-admin-session-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>قفل کردن پنل</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن پنل مدیریت"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isUnlocked ? (
          /* Hardened Security Gate Screen (Never exposes password hint in DOM) */
          <form onSubmit={handlePinSubmit} className="py-8 max-w-sm mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                احراز هویت مدیر سیستم
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                دسترسی به تنظیمات حاشیه سود، قیمت خرید همکار و مشخصات فروشگاه نیازمند رمز عبور مدیریت است.
              </p>
            </div>

            <div className="relative">
              <label htmlFor="admin-pin-input" className="sr-only">
                رمز عبور مدیر
              </label>
              <input
                id="admin-pin-input"
                type={showLoginPassword ? 'text' : 'password'}
                dir="ltr"
                disabled={lockoutRemainingSec > 0}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="رمز عبور مدیریت..."
                autoFocus
                className="w-full text-center tracking-widest font-mono-num text-base px-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword((prev) => !prev)}
                aria-label={showLoginPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {pinError && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  {pinError}
                  {lockoutRemainingSec > 0
                    ? ` (${lockoutRemainingSec.toLocaleString('fa-IR')} ثانیه)`
                    : ''}
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="submit"
                disabled={lockoutRemainingSec > 0 || !pinInput.trim()}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
              >
                ورود به پنل مدیریت
              </button>
            </div>
          </form>
        ) : (
          /* Unlocked Admin Controls */
          <div className="space-y-6 mt-5" data-testid="admin-panel-unlocked">
            {/* 1. Store Branding & Invoice Header Customization */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>۱. تنظیم نام فروشگاه / چاپخانه و عنوان فاکتور رسمی</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="admin-store-name-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    نام فروشگاه / استودیو چاپ (در هدر سایت و بالای فاکتور):
                  </label>
                  <input
                    id="admin-store-name-input"
                    type="text"
                    value={settings.storeName}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        storeName: e.target.value,
                      })
                    }
                    placeholder="مثلاً: چاپ رامین"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-invoice-title-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    عنوان فاکتور / پیش‌فاکتور رسمی:
                  </label>
                  <input
                    id="admin-invoice-title-input"
                    type="text"
                    value={settings.invoiceTitle}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        invoiceTitle: e.target.value,
                      })
                    }
                    placeholder="مثلاً: پیش‌فاکتور رسمی فروش و خدمات چاپ"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-whatsapp-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    شماره واتساپ پیش‌فرض واحد فروش:
                  </label>
                  <input
                    id="admin-whatsapp-input"
                    type="text"
                    dir="ltr"
                    value={settings.storeWhatsapp}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        storeWhatsapp: e.target.value,
                      })
                    }
                    placeholder="989120000000"
                    className="w-full px-3 py-2 text-sm font-mono-num rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-invoice-footer-input"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    متن شرایط و توضیحات پایین پیش‌فاکتور:
                  </label>
                  <input
                    id="admin-invoice-footer-input"
                    type="text"
                    value={settings.invoiceFooterNote}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        invoiceFooterNote: e.target.value,
                      })
                    }
                    placeholder="اعتبار پیش‌فاکتور: ۴۸ ساعت پس از صدور..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* 2. Global Profit Margin & Upward Rounding Step */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>۲. تنظیم حاشیه سود (Profit Margin %) و پله گرد کردن به بالا (Ceiling)</span>
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      ...DEFAULT_ADMIN_SETTINGS,
                      adminPasswordHash: settings.adminPasswordHash,
                      hasChangedDefaultPassword: settings.hasChangedDefaultPassword,
                      storeName: settings.storeName,
                      invoiceTitle: settings.invoiceTitle,
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی سود به پیش‌فرض (۳۰٪ و ۱,۰۰۰)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Global Margin Slider + Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="admin-global-margin-input"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      درصد سود سراسری (از ۰٪ تا ۱۰۰٪):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="admin-global-margin-input"
                        type="number"
                        min={0}
                        max={200}
                        value={settings.globalMarginPercent}
                        onChange={(e) => handleGlobalMarginChange(Number(e.target.value))}
                        className="w-20 px-2.5 py-1 text-sm font-bold font-mono-num text-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-xs font-bold">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    aria-label="اسلایدر درصد سود سراسری"
                    value={Math.min(100, settings.globalMarginPercent)}
                    onChange={(e) => handleGlobalMarginChange(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono-num text-slate-400 mt-1">
                    <span>۰٪ (قیمت خرید)</span>
                    <span>۳۰٪ (پیش‌فرض)</span>
                    <span>۵۰٪</span>
                    <span>۱۰۰٪</span>
                  </div>
                </div>

                {/* Upward Rounding Step Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    پله گرد کردن به بالا (Math.ceil Upward Rounding):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROUNDING_STEPS.map((stepObj) => {
                      const active = settings.roundingStep === stepObj.value;
                      return (
                        <button
                          key={stepObj.value}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({
                              ...settings,
                              roundingStep: stepObj.value,
                            })
                          }
                          className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          {stepObj.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Per-Category Margin Toggle & Inputs */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useCategoryMargins}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...settings,
                        useCategoryMargins: e.target.checked,
                      })
                    }
                    className="rounded accent-amber-600"
                  />
                  <span>تخصیص درصد سود مجزا برای هر دسته‌بندی (Per-Category Margin)</span>
                </label>

                {settings.useCategoryMargins && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                    {PRINT_CATEGORIES.map((cat) => (
                      <div
                        key={cat.key}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      >
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {cat.shortTitle}
                        </label>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={settings.categoryMargins[cat.key]}
                            onChange={(e) =>
                              handleCategoryMarginChange(cat.key, Number(e.target.value))
                            }
                            className="w-full px-2 py-1 text-xs font-mono-num font-bold rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                          />
                          <span className="text-xs">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Formula Verification Box */}
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">
                  تست زنده فرمول (گلاسه یووی با قیمت خرید ۱,۵۰۳,۷۰۰):
                </span>
                <div className="font-mono-num text-slate-800 dark:text-slate-200">
                  خام: <strong>{sampleRaw.toLocaleString('fa-IR')}</strong> ← گرد شده به بالا:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {sampleRounded.toLocaleString('fa-IR')} تومان
                  </strong>
                </div>
              </div>
            </div>

            {/* 3. Toggle Show Base Cost in Table */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {settings.showBaseCostInTable ? (
                  <Eye className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <EyeOff className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    نمایش قیمت خرید در جدول (ویژه مدیر)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    در صورت فعال‌سازی، ستون «قیمت پایه همکار (col[3])» و «سود خالص» در جدول تعرفه‌ها برای مقایسه مدیریتی نمایش داده می‌شود.
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2.5 cursor-pointer shrink-0 select-none">
                <input
                  type="checkbox"
                  aria-label="نمایش قیمت خرید در جدول (ویژه مدیر)"
                  checked={settings.showBaseCostInTable}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      showBaseCostInTable: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded accent-rose-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {settings.showBaseCostInTable ? 'فعال' : 'غیرفعال'}
                </span>
              </label>
            </div>

            {/* 4. Change Admin Password & Security */}
            <form
              onSubmit={handleChangePassword}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>۳. تغییر رمز عبور مدیریت و امنیت پنل (Salted Hash)</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  وضعیت رمز:{' '}
                  <strong
                    className={
                      settings.hasChangedDefaultPassword
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {settings.hasChangedDefaultPassword
                      ? 'رمز اختصاصی مدیر فعال است'
                      : 'رمز پیش‌فرض اولیه'}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="admin-current-pwd"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    رمز عبور فعلی:
                  </label>
                  <input
                    id="admin-current-pwd"
                    type="password"
                    dir="ltr"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="Current Password"
                    className="w-full px-3 py-2 text-sm font-mono-num rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-new-pwd"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    رمز عبور جدید (حداقل ۴ کاراکتر):
                  </label>
                  <input
                    id="admin-new-pwd"
                    type="password"
                    dir="ltr"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="New Password"
                    className="w-full px-3 py-2 text-sm font-mono-num rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-confirm-pwd"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    تکرار رمز عبور جدید:
                  </label>
                  <input
                    id="admin-confirm-pwd"
                    type="password"
                    dir="ltr"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full px-3 py-2 text-sm font-mono-num rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs">
                  {pwdMessage ? (
                    <span
                      data-testid="password-change-message"
                      className={
                        pwdMessage.type === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-rose-600 dark:text-rose-400 font-semibold'
                      }
                    >
                      {pwdMessage.text}
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">
                      رمز عبور به صورت هش رمزنگاری‌شده ۲۵۶ بیتی ذخیره می‌شود و در کد صفحه قابل رویت نیست.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  data-testid="save-new-password-btn"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  ذخیره رمز عبور جدید
                </button>
              </div>
            </form>

            {/* 5. Offline Excel / CSV Upload & Live Sheet Reset */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>۴. بارگذاری فایل اکسل / CSV آفلاین (SheetJS & PapaParse)</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  منبع فعلی: <strong className="text-slate-800 dark:text-slate-200">{dataSourceLabel}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>انتخاب فایل Excel (.xlsx/.xls) یا CSV</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    onResetToLiveSheet();
                    setUploadStatus('اتصال مجدد به جدول زنده گوگل شیت انجام شد.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازگشت به گوگل شیت زنده</span>
                </button>
              </div>

              {uploadStatus && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 pt-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadStatus}</span>
                </div>
              )}
            </div>

            {/* 6. Rust + WebAssembly Engine Status & Single-File HTML Export */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    ۵. موتور محاسباتی Rust + WebAssembly و خروجی تک‌فایل HTML
                  </h3>
                </div>
                <span className="text-xs font-mono-num text-emerald-700 dark:text-emerald-400">
                  {isWasmEngineReady() ? 'WebAssembly Binary Active (f64.ceil)' : 'JS Fallback'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRunBenchmark}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-amber-600" />
                  <span>تست بنچمارک ۲۵۰,۰۰۰ محاسبه چاپی در WASM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRustSource((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showRustSource ? 'بستن سورس کد Rust' : 'مشاهده کد Rust/WASM'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadStandaloneHtml}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود نسخه تک‌فایل HTML (با تنظیمات فعلی شما)</span>
                </button>
              </div>

              {benchmarkResult && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono-num flex flex-wrap items-center justify-between gap-2">
                  <span>
                    تعداد محاسبات: <strong>{benchmarkResult.iterations.toLocaleString('fa-IR')}</strong>
                  </span>
                  <span>
                    زمان اجرا: <strong>{benchmarkResult.durationMs} ms</strong>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    توان عملیاتی: {benchmarkResult.opsPerSec.toLocaleString('fa-IR')} عملیات/ثانیه
                  </span>
                </div>
              )}

              {showRustSource && (
                <pre
                  dir="ltr"
                  className="p-3.5 rounded-lg bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed"
                >
                  {RUST_WASM_SOURCE_CODE}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
