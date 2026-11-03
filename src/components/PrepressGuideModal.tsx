import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Layers, Ruler, AlertTriangle, Copy, Check, X } from 'lucide-react';

interface PrepressGuideProps {
  isModal?: boolean;
  onClose?: () => void;
}

interface PaperGuideItem {
  id: string;
  name: string;
  grammage: string;
  finish: string;
  durability: string;
  bestFor: string;
  description: string;
}

const PAPER_COATING_GUIDE: PaperGuideItem[] = [
  {
    id: 'glossy-uv',
    name: 'گلاسه و روکش یووی (Glossy + UV)',
    grammage: '۱۳۵، ۱۷۰ و ۳۰۰ گرم',
    finish: 'براق و شفاف با اشباع رنگی بالا',
    durability: 'متوسط (مناسب تیراژ اقتصادی و تبلیغاتی)',
    bestFor: 'تراکت‌های تبلیغاتی، کارت ویزیت‌های اقتصادی و بروشور',
    description:
      'کاغذ گلاسه سطحی صیقلی دارد که جوهر چاپ افست را با حداکثر درخشندگی نمایش می‌دهد. در کارت ویزیت گلاسه، یک لایه لاک UV روی کارت کشیده می‌شود تا در برابر سایش مقاوم‌تر گردد.',
  },
  {
    id: 'cellophane',
    name: 'روکش سلفون مات، براق و مخملی (Cellophane)',
    grammage: 'گلاسه ۳۰۰ گرم + روکش حرارتی ۳۰ میکرون',
    finish: 'مات کلاسیک، براق شفاف، یا مخملی لطیف',
    durability: 'بالا (مقاوم در برابر تا شدن و رطوبت سطحی)',
    bestFor: 'کارت ویزیت‌های رسمی، شرکتی، فروشگاهی و جلد کاتالوگ',
    description:
      'روکش سلفون یک لایه فیلم پلیمری نازک است که با حرارت روی مقوای گلاسه ۳۰۰ گرم پرس می‌شود. در نوع سلفون مات موضعی یا طلاکوب، لوگو یا نام برند به صورت براق برجسته یا متالیک درمی‌آید.',
  },
  {
    id: 'laminate',
    name: 'لمینت برجسته، مخملی و طلاکارت (Rigid Laminate)',
    grammage: 'گلاسه ۳۰۰ گرم + لمینت ضخیم ۱۲۵ تا ۲۵۰ میکرون',
    finish: 'استخوانی، ضخیم و لوکس با گوشه‌های دورگرد استاندارد',
    durability: 'بسیار بالا (ضدآب، نشکن و مقاوم در برابر خمیدگی)',
    bestFor: 'برندهای لوکس، مدیران عامل، کلینیک‌ها و کارت‌های ماندگار',
    description:
      'کارت‌های لمینت به دلیل ضخامت بالا حس یک کارت اعتباری محکم را القا می‌کنند. در مدل‌های لمینت برجسته و طلاکارت، بافت برجسته یا ورق طلا در زیر لایه محافظ یا روی سطح مخملی اجرا می‌شود.',
  },
  {
    id: 'linen-katan',
    name: 'کاغذ و مقوای کتان امباس / آلمان (Linen Textured)',
    grammage: '۱۲۰ گرم (سربرگ و پاکت) تا ۳۰۰ گرم (کارت ویزیت)',
    finish: 'بافت‌دار تار و پودی بدون روکش پلاستیکی (قابل نوشتن با خودکار)',
    durability: 'متوسط (ظاهر هنری و کلاسیک، حساس به رطوبت مستقیم)',
    bestFor: 'دفاتر وکالت، مهندسی، پزشکی، ست اداری رسمی و کارت‌های هنری',
    description:
      'مقوای کتان دارای بافت برجسته پارچه‌ای است و به دلیل نداشتن روکش پلاستیکی، به راحتی می‌توان روی آن با خودکار یا روانشناسی یادداشت نوشت یا مهر زد. برای طرح‌های روشن با پس‌زمینه سفید ایده‌آل است.',
  },
  {
    id: 'tahrir',
    name: 'کاغذ تحریر افست (Uncoated Offset Paper)',
    grammage: '۸۰، ۱۰۰ و ۱۲۰ گرم',
    finish: 'مات طبیعی، جذب مرکب عالی، کاملاً مناسب پرینتر لیزری و جوهررافشان',
    durability: 'استاندارد اداری و مکاتباتی',
    bestFor: 'سربرگ اداری، پاکت نامه ملخی و A4، فرم‌های قراردادی و تراکت اقتصادی',
    description:
      'کاغذ تحریر استانداردترین کاغذ برای مکاتبات اداری است. سربرگ‌های تحریر ۸۰ و ۱۰۰ گرم استودیو در سایز واقعی (Real A4/A5) برش می‌خورند تا بدون گیر کردن داخل انواع پرینترهای اداری استفاده شوند.',
  },
  {
    id: 'pvc-card',
    name: 'کارت PVC (۳۰۰، ۵۰۰ و ۷۶۰ میکرون)',
    grammage: 'پلی‌وینیل کلراید فشرده (۳۰۰، ۵۰۰ و ۷۶۰ میکرون بانکی)',
    finish: 'براق یا برفکی نیمه‌شفاف با برش استاندارد CR80',
    durability: 'فوق‌العاده (۱۰۰٪ ضدآب، نشکن و قابل شستشو)',
    bestFor: 'کارت پرسنلی، کارت عضویت باشگاه، کارت گارانتی، کارت هدیه و وفاداری',
    description:
      'کارت‌های PVC ۷۶۰ میکرون دقیقاً هم‌ضخامت کارت‌های عابربانک هستند و قابلیت چاپ افست یا دیجیتال با ماندگاری چندین ساله را دارند. مدل برفکی (Frosted) جلوه‌ای مدرن و نیمه‌شفاف ایجاد می‌کند.',
  },
];

const PREPRESS_RULES = [
  {
    code: 'CMYK Mode',
    title: '۱. مد رنگی استاندارد چهاررنگ (CMYK)',
    detail:
      'تمامی فایل‌های ارسالی به لیتوگرافی باید از ابتدا در مد رنگی CMYK طراحی شوند. فایل‌های RGB در هنگام تبدیل به پلیت چاپ افست دچار افت شدیدی در رنگ‌های فسفری، آبی لاجوردی و بنفش می‌شوند.',
  },
  {
    code: '300 DPI',
    title: '۲. رزولوشن واقعی ۳۰۰ پیکسل بر اینچ (300 DPI)',
    detail:
      'در سایز واقعی چاپی (۱:۱)، رزولوشن سند باید دقیقاً 300 DPI باشد. بزرگنمایی تصاویر با کیفیت پایین (72 DPI وب) باعث شطرنجی شدن و تاری لبه‌ها در چاپ نهایی می‌گردد.',
  },
  {
    code: '2mm Bleed',
    title: '۳. حاشیه برش (Bleed) ۲ میلی‌متر از هر طرف',
    detail:
      'رنگ یا تصویر پس‌زمینه باید از هر ۴ طرف ۲ میلی‌متر بیشتر از سایز نهایی ادامه یابد (مثلاً کارت ۶×۹ باید در سایز ۶.۴×۹.۴ سانتی‌متر بسته شود) تا پس از برش گیوتین، حاشیه سفید ناخواسته در لبه کار باقی نماند.',
  },
  {
    code: '3mm Safe Margin',
    title: '۴. حاشیه امن (Safe Zone) ۳ تا ۵ میلی‌متر از داخل خط برش',
    detail:
      'لوگو، شماره تماس، کد QR و متون مهم باید حداقل ۳ میلی‌متر (و در کارت‌های دورگرد و لمینت ۵ میلی‌متر) از خط برش به سمت داخل فاصله داشته باشند تا در زمان برش یا قالب‌زنی آسیب نبینند.',
  },
  {
    code: 'K=100 Black',
    title: '۵. متون مشکی تک‌رنگ (C=0, M=0, Y=0, K=100)',
    detail:
      'تمامی متون ریز، بارکدها و خطوط ظریف مشکی باید فقط با کانال K=100 و سایر کانال‌ها صفر (C=0, M=0, Y=0) طراحی شوند. استفاده از مشکی چهاررنگ در متون ریز باعث سایه‌دار شدن (روی هم نیفتادن زینک‌ها) می‌شود.',
  },
];

const TEMPLATE_DIMENSIONS = [
  { name: 'کارت ویزیت استاندارد (عمومی)', cutSize: '85 × 48 mm', fileWithBleed: '89 × 52 mm', safeZone: '79 × 42 mm', pixels300Dpi: '1051 × 614 px' },
  { name: 'کارت ویزیت لمینت و فانتزی', cutSize: '90 × 60 mm', fileWithBleed: '94 × 64 mm', safeZone: '80 × 50 mm', pixels300Dpi: '1110 × 756 px' },
  { name: 'کارت ویزیت مربع فانتزی', cutSize: '60 × 60 mm', fileWithBleed: '64 × 64 mm', safeZone: '52 × 52 mm', pixels300Dpi: '756 × 756 px' },
  { name: 'کارت PVC بانکی (CR80)', cutSize: '85.5 × 54 mm (فایل: 89 × 57)', fileWithBleed: '89 × 57 mm', safeZone: '79 × 48 mm', pixels300Dpi: '1051 × 673 px' },
  { name: 'تراکت و سربرگ A4', cutSize: '210 × 297 mm', fileWithBleed: '214 × 301 mm', safeZone: '200 × 287 mm', pixels300Dpi: '2528 × 3555 px' },
  { name: 'تراکت و سربرگ A5', cutSize: '148 × 210 mm', fileWithBleed: '152 × 214 mm', safeZone: '138 × 200 mm', pixels300Dpi: '1795 × 2528 px' },
  { name: 'تراکت و سربرگ A6', cutSize: '105 × 148 mm', fileWithBleed: '109 × 152 mm', safeZone: '95 × 138 mm', pixels300Dpi: '1287 × 1795 px' },
  { name: 'پاکت نامه اداری (ملخی)', cutSize: '220 × 110 mm', fileWithBleed: '224 × 114 mm', safeZone: '206 × 96 mm', pixels300Dpi: '2646 × 1346 px' },
];

export const PrepressGuideSection: React.FC<PrepressGuideProps> = ({ isModal = false, onClose }) => {
  const [selectedPaperId, setSelectedPaperId] = useState<string>(PAPER_COATING_GUIDE[0].id);
  const [copiedSpec, setCopiedSpec] = useState<string | null>(null);

  const activePaper =
    PAPER_COATING_GUIDE.find((item) => item.id === selectedPaperId) || PAPER_COATING_GUIDE[0];

  const handleCopySpec = (rowName: string, specText: string) => {
    navigator.clipboard?.writeText(specText);
    setCopiedSpec(rowName);
    setTimeout(() => setCopiedSpec(null), 1800);
  };

  const content = (
    <div className="space-y-8" data-testid="prepress-guide-section">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>کیت راهنمای تخصصی چاپ، شناخت متریال و استاندارد شابلون لیتوگرافی</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            مقایسه فنی انواع کاغذ و روکش‌های چاپی به همراه چک‌لیست استاندارد بستن فایل برای چاپ افست و دیجیتال بدون خطا
          </p>
        </div>
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن راهنمای چاپ"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Section 1: Interactive Paper & Coating Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>۱. انتخاب و مقایسه جنس کاغذ و روکش</span>
          </h3>
          {PAPER_COATING_GUIDE.map((item) => {
            const isActive = item.id === activePaper.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPaperId(item.id)}
                className={`w-full text-right px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-500 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-sm">{item.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  گرماژ و ساختار: {item.grammage}
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
              مشخصات فنی متریال منتخب
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {activePaper.name}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
              {activePaper.description}
            </p>

            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 dark:text-slate-400">گرماژ / ضخامت:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activePaper.grammage}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 dark:text-slate-400">جلوه ظاهری و لمسی:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activePaper.finish}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 dark:text-slate-400">میزان دوام و مقاومت:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activePaper.durability}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500 dark:text-slate-400">بهترین کاربرد پیشنهادی:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {activePaper.bestFor}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              نکته فنی: در کاغذهای کتان و تحریر به دلیل جذب مرکب در بافت کاغذ، رنگ‌ها حدود ۵ تا ۱۰ درصد تیره‌تر از مانیتور چاپ می‌شوند.
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: 5 Golden Prepress Rules */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>۲. پنج قانون طلایی لیتوگرافی و آماده‌سازی فایل چاپی (Prepress Rules)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PREPRESS_RULES.map((rule) => (
            <div
              key={rule.code}
              className="p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
            >
              <div className="text-xs font-mono-num text-amber-700 dark:text-amber-400 font-semibold">
                {rule.code}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                {rule.title}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                {rule.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Standard Die-Cut & Template Dimensions Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>۳. جدول شابلون ابعاد استاندارد طراحی (همراه با خط برش و پیکسل ۳۰۰ DPI)</span>
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">نوع محصول چاپی</th>
                <th className="py-3 px-4 font-semibold">سایز نهایی پس از برش</th>
                <th className="py-3 px-4 font-semibold">سایز فایل با حاشیه برش (Bleed)</th>
                <th className="py-3 px-4 font-semibold">محدوده حاشیه امن متون</th>
                <th className="py-3 px-4 font-semibold">ابعاد پیکسلی (300 DPI)</th>
                <th className="py-3 px-4 font-semibold text-left">کپی مشخصات شابلون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {TEMPLATE_DIMENSIONS.map((row) => (
                <tr
                  key={row.name}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 font-mono-num text-slate-700 dark:text-slate-300" dir="ltr">
                    {row.cutSize}
                  </td>
                  <td className="py-3 px-4 font-mono-num font-semibold text-rose-600 dark:text-rose-400" dir="ltr">
                    {row.fileWithBleed}
                  </td>
                  <td className="py-3 px-4 font-mono-num text-emerald-700 dark:text-emerald-400" dir="ltr">
                    {row.safeZone}
                  </td>
                  <td className="py-3 px-4 font-mono-num text-slate-600 dark:text-slate-400" dir="ltr">
                    {row.pixels300Dpi}
                  </td>
                  <td className="py-3 px-4 text-left">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopySpec(
                          row.name,
                          `${row.name} | سایز فایل با برش: ${row.fileWithBleed} | سایز برش‌خورده: ${row.cutSize} | حاشیه امن: ${row.safeZone} | رزولوشن: ${row.pixels300Dpi} (300 DPI CMYK)`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedSpec === row.name ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی شابلون</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="کیت راهنمای چاپ و شابلون"
    >
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        {content}
      </div>
    </div>
  );
};
