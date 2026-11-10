import { PrintCategoryKey, PrintProductRow } from './sheetParser';

export interface SubCategoryFilter {
  id: string;
  label: string;
  shortLabel: string;
  predicate: (row: PrintProductRow) => boolean;
}

/**
 * Intelligent sub-category filters for each of the 11 Google Sheet categories,
 * allowing users to immediately narrow down products without scrolling through long lists.
 */
export const SUB_CATEGORY_FILTERS: Record<PrintCategoryKey, SubCategoryFilter[]> = {
  'کارت ویزیت': [
    {
      id: 'all',
      label: 'همه کارت‌های ویزیت',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'cellophane',
      label: 'سلفون مات و براق',
      shortLabel: 'سلفون مات / براق',
      predicate: (r) => r.productName.includes('سلفون'),
    },
    {
      id: 'luxury-embossed',
      label: 'لمینت برجسته، مخملی و لوکس',
      shortLabel: 'لمینت برجسته و لوکس',
      predicate: (r) =>
        r.productName.includes('برجسته') ||
        r.productName.includes('مخملی') ||
        r.productName.includes('طلا') ||
        r.productName.includes('موج'),
    },
    {
      id: 'linen-paper',
      label: 'کتان امباس و کارتی',
      shortLabel: 'کتان و کارتی',
      predicate: (r) =>
        r.productName.includes('کتان') ||
        r.productName.includes('کارتی') ||
        r.productName.includes('امباس'),
    },
    {
      id: 'pvc-cards',
      label: 'کارت‌های PVC و ضدآب',
      shortLabel: 'کارت‌های PVC',
      predicate: (r) =>
        r.productName.toLowerCase().includes('pvc') ||
        r.productName.includes('پی وی سی') ||
        r.productName.includes('برفکی'),
    },
    {
      id: 'rounded-cut',
      label: 'دورگرد و خاص',
      shortLabel: 'دورگرد',
      predicate: (r) => r.productName.includes('دورگرد') || r.isRoundedCorner,
    },
    {
      id: 'square-cards',
      label: 'مربع (60*60)',
      shortLabel: 'مربع',
      predicate: (r) => r.size.includes('60*60') || r.productName.includes('مربع'),
    },
  ],

  'تراکت ، سربرگ ، پوستر': [
    {
      id: 'all',
      label: 'همه فرم‌های عمومی',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'glossy-tract',
      label: 'تراکت گلاسه (۱۳۵ و ۱۷۰ گرم)',
      shortLabel: 'تراکت گلاسه',
      predicate: (r) => r.productName.includes('تراکت') && r.productName.includes('گلاسه'),
    },
    {
      id: 'bond-tract',
      label: 'تراکت تحریر (۸۰ گرم)',
      shortLabel: 'تراکت تحریر',
      predicate: (r) => r.productName.includes('تراکت') && r.productName.includes('تحریر'),
    },
    {
      id: 'letterhead',
      label: 'سربرگ اداری A4 و A5',
      shortLabel: 'سربرگ اداری',
      predicate: (r) => r.productName.includes('سربرگ') || r.size.includes('سربرگ'),
    },
    {
      id: 'poster',
      label: 'پوستر اختصاصی افست',
      shortLabel: 'پوستر افست',
      predicate: (r) => r.productName.includes('پوستر') || r.size.includes('پوستر'),
    },
    {
      id: 'brochure',
      label: 'بروشور ۳ لت و تاشده',
      shortLabel: 'بروشور تاشده',
      predicate: (r) =>
        r.productName.includes('بروشور') ||
        r.productName.includes('تا شده') ||
        r.productName.includes('لت'),
    },
  ],

  'پشت چسبدار (لیبل)': [
    {
      id: 'all',
      label: 'همه لیبل‌ها و برچسب‌ها',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'cellophane-label',
      label: 'لیبل سلفون براق و مات',
      shortLabel: 'سلفون براق / مات',
      predicate: (r) => r.productName.includes('سلفون'),
    },
    {
      id: 'uv-label',
      label: 'لیبل روکش یووی (UV)',
      shortLabel: 'روکش یووی',
      predicate: (r) => r.productName.includes('یووی'),
    },
    {
      id: 'uncoated-label',
      label: 'لیبل بدون روکش (تحریر)',
      shortLabel: 'بدون روکش',
      predicate: (r) => r.productName.includes('بدون روکش'),
    },
    {
      id: 'metallic-glass',
      label: 'شیشه‌ای، متالایز و طلاکوب',
      shortLabel: 'شیشه‌ای / متالایز',
      predicate: (r) =>
        r.productName.includes('شیشه') ||
        r.productName.includes('متالایز') ||
        r.productName.includes('طلا') ||
        r.productName.includes('شفاف'),
    },
    {
      id: 'express-label',
      label: 'لیبل فوری و ۶ ساعته',
      shortLabel: 'فوری',
      predicate: (r) =>
        r.productName.includes('فوری') ||
        r.productName.includes('ساعت') ||
        r.deliveryTime.includes('1') ||
        r.deliveryTime.includes('۲'),
    },
  ],

  'پاکت': [
    {
      id: 'all',
      label: 'همه مدل‌های پاکت',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'envelope-letter',
      label: 'پاکت نامه (ملخی ۱۱×۲۲)',
      shortLabel: 'پاکت ملخی (نامه)',
      predicate: (r) =>
        r.size.includes('نامه') ||
        r.productName.includes('ملخی') ||
        r.productName.includes('نامه'),
    },
    {
      id: 'envelope-a4',
      label: 'پاکت کیسه‌ای و کیفی A4',
      shortLabel: 'پاکت A4 کیسه‌ای',
      predicate: (r) => r.size.includes('A4') || r.productName.includes('A4'),
    },
    {
      id: 'envelope-a5',
      label: 'پاکت استاندارد A5',
      shortLabel: 'پاکت A5',
      predicate: (r) => r.size.includes('A5') || r.productName.includes('A5'),
    },
    {
      id: 'envelope-a3',
      label: 'پاکت بزرگ A3',
      shortLabel: 'پاکت A3',
      predicate: (r) => r.size.includes('A3') || r.productName.includes('A3'),
    },
    {
      id: 'paper-varieties',
      label: 'تحریر، گلاسه و کتان',
      shortLabel: 'انواع کاغذ',
      predicate: (r) =>
        r.productName.includes('تحریر') ||
        r.productName.includes('گلاسه') ||
        r.productName.includes('کتان'),
    },
  ],

  'انواع جعبه و بسته بندی': [
    {
      id: 'all',
      label: 'همه ملزومات جعبه و بسته‌بندی',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'circle-labels',
      label: 'لیبل‌های دایره‌ای پلمپ (قطر ۲ تا ۵ سانت)',
      shortLabel: 'لیبل دایره‌ای (قطر)',
      predicate: (r) => r.size.includes('قطر') || r.productName.includes('دایره'),
    },
    {
      id: 'envelope-boxes',
      label: 'پاکتشوهای خاص',
      shortLabel: 'پاکتشو',
      predicate: (r) => r.productName.includes('پاکتشو') || r.size.includes('پاکتشو'),
    },
    {
      id: 'packaging-boxes',
      label: 'جعبه و بسته‌بندی مقوایی',
      shortLabel: 'جعبه و بسته‌بندی',
      predicate: (r) =>
        r.productName.includes('جعبه') ||
        r.productName.includes('بسته بندی') ||
        r.productName.includes('کارتن'),
    },
    {
      id: 'special-codes',
      label: 'کدهای استاندارد بسته‌بندی',
      shortLabel: 'کدهای اختصاصی',
      predicate: (r) => r.size.includes('کد'),
    },
  ],

  'محصولات تبلیغاتی': [
    {
      id: 'all',
      label: 'همه هدایا و محصولات تبلیغاتی',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'paper-cups',
      label: 'لیوان کاغذی بهداشتی (۲۰۰ سی‌سی)',
      shortLabel: 'لیوان کاغذی',
      predicate: (r) => r.productName.includes('لیوان') || r.size.includes('سی سی'),
    },
    {
      id: 'promo-cards',
      label: 'کارت‌های پروموشن و آویز',
      shortLabel: 'کارت پروموشن',
      predicate: (r) =>
        r.productName.includes('کارت') ||
        r.productName.includes('سلفون') ||
        r.productName.includes('لمینت'),
    },
    {
      id: 'folders-bags',
      label: 'فولدر تبلیغاتی و ساک دستی',
      shortLabel: 'فولدر و ساک',
      predicate: (r) =>
        r.productName.includes('فولدر') ||
        r.productName.includes('ساک') ||
        r.productName.includes('کیف'),
    },
    {
      id: 'promo-items',
      label: 'اقلام تشریفاتی و کدهای سازمانی',
      shortLabel: 'اقلام تشریفاتی',
      predicate: (r) => r.size.includes('کد') || r.productName.includes('تبلیغاتی'),
    },
  ],

  'محصولات اداری و تجاری': [
    {
      id: 'all',
      label: 'همه محصولات اداری و ست سازمانی',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'real-letterhead',
      label: 'سربرگ اداری سایز واقعی (A4/A5)',
      shortLabel: 'سربرگ سایز واقعی',
      predicate: (r) => r.productName.includes('سربرگ'),
    },
    {
      id: 'notepad',
      label: 'یادداشت اداری با سرچسب',
      shortLabel: 'یادداشت اداری',
      predicate: (r) => r.productName.includes('یادداشت'),
    },
    {
      id: 'office-a4',
      label: 'سایز اداری A4',
      shortLabel: 'سایز A4',
      predicate: (r) => r.size.includes('A4') || r.productName.includes('A4'),
    },
    {
      id: 'office-a5-a6',
      label: 'سایز اداری A5 و A6',
      shortLabel: 'سایز A5 و A6',
      predicate: (r) =>
        r.size.includes('A5') ||
        r.size.includes('A6') ||
        r.productName.includes('A5') ||
        r.productName.includes('A6'),
    },
  ],

  'فاکتور': [
    {
      id: 'all',
      label: 'همه فاکتورها و فرم‌های مالی',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'ncr-single-color',
      label: 'کاربن‌لس تک‌رنگ (مشکی / سرمه‌ای)',
      shortLabel: 'کاربن‌لس تک‌رنگ',
      predicate: (r) => r.productName.includes('تک رنگ'),
    },
    {
      id: 'ncr-multi-color',
      label: 'کاربن‌لس ۲ و ۴ رنگ رسمی',
      shortLabel: 'کاربن‌لس چندرنگ',
      predicate: (r) =>
        r.productName.includes('رنگ') && !r.productName.includes('تک رنگ'),
    },
    {
      id: 'invoice-a4',
      label: 'فاکتور سایز A4',
      shortLabel: 'فاکتور A4',
      predicate: (r) => r.size.includes('A4'),
    },
    {
      id: 'invoice-a5',
      label: 'فاکتور سایز A5',
      shortLabel: 'فاکتور A5',
      predicate: (r) => r.size.includes('A5'),
    },
    {
      id: 'invoice-b5',
      label: 'فاکتور سایز B5 و B4',
      shortLabel: 'فاکتور B5 و B4',
      predicate: (r) => r.size.includes('B5') || r.size.includes('B4'),
    },
    {
      id: 'invoice-express',
      label: 'فاکتور فوری ۱ روزه',
      shortLabel: 'فوری',
      predicate: (r) =>
        r.productName.includes('فوری') || r.deliveryTime.includes('1'),
    },
  ],

  'محصولات فست فود': [
    {
      id: 'all',
      label: 'همه محصولات چاپی فست‌فود و رستوران',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'table-mat',
      label: 'زیربشقابی و زیرسینی (Table Mat)',
      shortLabel: 'زیربشقابی و زیرسینی',
      predicate: (r) =>
        r.productName.includes('Table Mat') ||
        r.productName.includes('زیر بشقابی') ||
        r.productName.includes('سینی'),
    },
    {
      id: 'kraft-parchment',
      label: 'کاغذ پوستی ۴۰ گرم',
      shortLabel: 'کاغذ پوستی',
      predicate: (r) => r.productName.includes('پوستی'),
    },
    {
      id: 'wax-paper',
      label: 'کاغذ مومی ۴۰ گرم (چهار رنگ)',
      shortLabel: 'کاغذ مومی',
      predicate: (r) => r.productName.includes('مومی'),
    },
    {
      id: 'large-food-mats',
      label: 'سایزهای بزرگ (۳۵×۵۰ و A2)',
      shortLabel: 'سایز بزرگ ۳۵×۵۰ / A2',
      predicate: (r) =>
        r.size.includes('35*50') ||
        r.size.includes('A2') ||
        r.size.includes('33*70') ||
        r.size.includes('30*60'),
    },
  ],

  'محصولات ۶ ساعته': [
    {
      id: 'all',
      label: 'همه سفارش‌های فوری ۶ ساعته',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'six-hour-cards',
      label: 'کارت ویزیت ۶ ساعته',
      shortLabel: 'کارت ۶ ساعته',
      predicate: (r) =>
        r.productName.includes('سلفون') || r.productName.includes('کارت'),
    },
    {
      id: 'six-hour-tract',
      label: 'تراکت ۶ ساعته (گلاسه و تحریر)',
      shortLabel: 'تراکت ۶ ساعته',
      predicate: (r) => r.productName.includes('تراکت'),
    },
    {
      id: 'six-hour-label',
      label: 'لیبل ۶ ساعته سلفون براق',
      shortLabel: 'لیبل ۶ ساعته',
      predicate: (r) => r.productName.includes('لیبل'),
    },
  ],

  'محصولات سایز سفارشی': [
    {
      id: 'all',
      label: 'همه سفارش‌های سایز سفارشی',
      shortLabel: 'همه',
      predicate: () => true,
    },
    {
      id: 'custom-labels',
      label: 'لیبل سایز سفارشی',
      shortLabel: 'لیبل سفارشی',
      predicate: (r: PrintProductRow) => r.productName.includes('لیبل'),
    },
    {
      id: 'custom-glossy',
      label: 'گلاسه و کاتالوگ سفارشی',
      shortLabel: 'گلاسه سفارشی',
      predicate: (r: PrintProductRow) =>
        r.productName.includes('گلاسه') || r.productName.includes('کاتالوگ'),
    },
    {
      id: 'custom-cellophane',
      label: 'سلفون مات و بدون روکش',
      shortLabel: 'سلفون و بدون روکش',
      predicate: (r: PrintProductRow) =>
        r.productName.includes('سلفون') || r.productName.includes('بدون روکش'),
    },
  ],
};

/**
 * Normalizes search tokens for high-precision Persian matching.
 */
export function normalizeSearchTerm(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[يی]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[^\w\s\u0600-\u06FF*×]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches and scores products against a multi-term query.
 */
export function searchProducts(
  products: PrintProductRow[],
  query: string,
  categoryFilter?: PrintCategoryKey | 'all'
): PrintProductRow[] {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) {
    if (categoryFilter && categoryFilter !== 'all') {
      return products.filter((p) => p.category === categoryFilter);
    }
    return products;
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);

  const matched = products.filter((row) => {
    if (categoryFilter && categoryFilter !== 'all' && row.category !== categoryFilter) {
      return false;
    }

    const searchableText = normalizeSearchTerm(
      `${row.productName} ${row.category} ${row.size} ${row.sides} ${row.deliveryTime} ${row.dimensionLabel} ${row.quantity}`
    );

    // All search tokens must appear in the searchable text
    return tokens.every((token) => searchableText.includes(token));
  });

  // Sort matched results: exact prefix or exact title match ranks higher
  return matched.sort((a, b) => {
    const aNorm = normalizeSearchTerm(a.productName);
    const bNorm = normalizeSearchTerm(b.productName);
    const aStarts = aNorm.startsWith(normalizedQuery);
    const bStarts = bNorm.startsWith(normalizedQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.productName.length - b.productName.length;
  });
}
