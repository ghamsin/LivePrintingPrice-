import Papa from 'papaparse';
import { FALLBACK_PRODUCTS_ALL_11_SHEETS } from '../data/fallbackSheets';

export type PrintCategoryKey =
  | 'کارت ویزیت'
  | 'تراکت ، سربرگ ، پوستر'
  | 'پشت چسبدار (لیبل)'
  | 'پاکت'
  | 'انواع جعبه و بسته بندی'
  | 'محصولات تبلیغاتی'
  | 'محصولات اداری و تجاری'
  | 'فاکتور'
  | 'محصولات فست فود'
  | 'محصولات ۶ ساعته'
  | 'محصولات سایز سفارشی';

export type NormalizedSides = 'یک رو' | 'دو رو';

export interface CategoryMeta {
  key: PrintCategoryKey;
  gid: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  badgeText: string;
  iconName: string;
}

export const PRINT_CATEGORIES: CategoryMeta[] = [
  {
    key: 'کارت ویزیت',
    gid: '2076130864',
    title: 'انواع کارت ویزیت (عمومی، فانتزی، PVC)',
    shortTitle: 'کارت ویزیت',
    subtitle: 'سلفون مات و براق، لمینت برجسته، مخملی، طلاکارت، کتان و PVC ضدآب',
    badgeText: '۱۴۶ مدل متنوع',
    iconName: 'CreditCard',
  },
  {
    key: 'تراکت ، سربرگ ، پوستر',
    gid: '1900338465',
    title: 'تراکت، سربرگ و پوستر تبلیغاتی',
    shortTitle: 'تراکت و پوستر',
    subtitle: 'انواع تراکت گلاسه و تحریر، سربرگ اداری A4/A5، بروشور تاشده و پوستر',
    badgeText: '۲۶۰ مدل پرتیراژ',
    iconName: 'FileText',
  },
  {
    key: 'پشت چسبدار (لیبل)',
    gid: '1222527184',
    title: 'پشت‌چسبدار و انواع لیبل صنعتی',
    shortTitle: 'لیبل و برچسب',
    subtitle: 'لیبل سلفون، یووی، بدون روکش، متالایز، شیشه‌ای، طلاکوب و نیم‌تاغ',
    badgeText: '۱۱۱ مدل چسبی',
    iconName: 'Tag',
  },
  {
    key: 'پاکت',
    gid: '2093338645',
    title: 'انواع پاکت اداری، نامه و فانتزی',
    shortTitle: 'پاکت اداری',
    subtitle: 'پاکت ملخی (نامه)، پاکت کیسه‌ای A4، پاکت A5 و A3 تحریر، گلاسه و کتان',
    badgeText: '۱۰۲ مدل پاکت',
    iconName: 'Mail',
  },
  {
    key: 'انواع جعبه و بسته بندی',
    gid: '2006393519',
    title: 'انواع جعبه، پاکتشو و بسته‌بندی',
    shortTitle: 'جعبه و بسته‌بندی',
    subtitle: 'لیبل‌های دایره‌ای پلمپ، پاکتشو، جعبه مقوایی و ملزومات بسته‌بندی',
    badgeText: '۲۰۰ مدل بسته‌بندی',
    iconName: 'Package',
  },
  {
    key: 'محصولات تبلیغاتی',
    gid: '1045170615',
    title: 'محصولات و هدایای تبلیغاتی',
    shortTitle: 'تبلیغاتی و هدایا',
    subtitle: 'لیوان کاغذی بهداشتی، کارت‌های پروموشن، فولدر، ساک دستی و اقلام تشریفاتی',
    badgeText: '۴۸۹ محصول تبلیغی',
    iconName: 'Megaphone',
  },
  {
    key: 'محصولات اداری و تجاری',
    gid: '1518433362',
    title: 'محصولات اداری، سازمانی و ست تجاری',
    shortTitle: 'اداری و تجاری',
    subtitle: 'سربرگ‌های سایز واقعی، یادداشت اداری، فرم‌های اداری و ست اوراق',
    badgeText: '۲۳۴ محصول اداری',
    iconName: 'Briefcase',
  },
  {
    key: 'فاکتور',
    gid: '1047767151',
    title: 'انواع فاکتور رسمی و کاربن‌لس (NCR)',
    shortTitle: 'فاکتور و قبض',
    subtitle: 'فاکتورهای تک‌رنگ مشکی/سرمه‌ای، ۲ رنگ و ۴ رنگ در سایزهای A3، A4، A5 و B5',
    badgeText: '۸۳ مدل کاربن‌لس',
    iconName: 'Receipt',
  },
  {
    key: 'محصولات فست فود',
    gid: '1821825749',
    title: 'محصولات چاپی فست‌فود و رستوران',
    shortTitle: 'فست‌فود و رستوران',
    subtitle: 'زیربشقابی و زیرسینی (Table Mat) مومی و پوستی، منو، پاکت برگر و کاغذ غذا',
    badgeText: '۶۹ محصول رستورانی',
    iconName: 'Utensils',
  },
  {
    key: 'محصولات ۶ ساعته',
    gid: '1819354919',
    title: 'چاپ سوپر اکسپرس ۶ ساعته روزانه',
    shortTitle: 'فوری ۶ ساعته',
    subtitle: 'کارت ویزیت، تراکت گلاسه و تحریر، لیبل سلفون با تحویل قطعی در همان روز',
    badgeText: 'تحویل فوری روزانه',
    iconName: 'Zap',
  },
  {
    key: 'محصولات سایز سفارشی',
    gid: '1616408270',
    title: 'محصولات چاپی با سایز سفارشی و دلخواه',
    shortTitle: 'سایز سفارشی',
    subtitle: 'چاپ با ابعاد اختصاصی و برش گیوتینی آزاد برای گلاسه، تحریر و لیبل',
    badgeText: 'ابعاد آزاد و دلخواه',
    iconName: 'Sliders',
  },
];

export interface PrintProductRow {
  id: string;
  rowIndex: number;
  category: PrintCategoryKey;
  productName: string;
  quantity: number;
  size: string;
  normalizedSize: string;
  sides: NormalizedSides;
  rawSides: string;
  baseCost: number; // col[3]: قیمت پایه/همکار (NEVER exposed to regular customers)
  deliveryTime: string; // col[2]: تحویل
  sheetMarginPercent: number; // col[1]: درصد
  sheetFinalPrice: number; // col[0]: قیمت
  widthMm: number;
  heightMm: number;
  dimensionLabel: string;
  isRoundedCorner: boolean;
}

/**
 * Normalizes Persian digits (۰-۹) and Arabic digits (٠-٩) to English digits (0-9).
 */
export function toEnglishDigits(input: string): string {
  return String(input || '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Formats a number into Persian locale string with commas (e.g. ۱,۹۵۵,۰۰۰).
 */
export function formatPersianPrice(value: number): string {
  if (!Number.isFinite(value)) return '۰';
  return Math.round(value).toLocaleString('fa-IR');
}

/**
 * Parses integer from currency/numeric cell string (stripping commas, spaces, quotes).
 */
export function parseNumericCell(val: string | number | undefined): number {
  if (typeof val === 'number') return Math.round(val);
  if (!val) return 0;
  const cleaned = toEnglishDigits(String(val)).replace(/[^\d.-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Normalizes category header strings from col[7] to one of the 11 categories.
 */
export function normalizeCategoryHeader(rawHeader: string): PrintCategoryKey | null {
  const trimmed = String(rawHeader || '').trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed.includes('فاکتور')) return 'فاکتور';
  if (trimmed.includes('فست فود') || trimmed.includes('رستوران') || trimmed.includes('سینی') || trimmed.includes('بشقابی')) return 'محصولات فست فود';
  if (trimmed.includes('جعبه') || trimmed.includes('بسته بندی') || trimmed.includes('پاکتشو')) return 'انواع جعبه و بسته بندی';
  if (trimmed.includes('تبلیغاتی') || trimmed.includes('لیوان') || trimmed.includes('هدایا')) return 'محصولات تبلیغاتی';
  if (trimmed.includes('اداری') && (trimmed.includes('تجاری') || trimmed.includes('سربرگ اداری') || trimmed.includes('محصولات اداری'))) return 'محصولات اداری و تجاری';
  if (trimmed.includes('۶ ساعته') || trimmed.includes('6 ساعته')) return 'محصولات ۶ ساعته';
  if (trimmed.includes('سایز سفارشی') || trimmed.includes('سفارشی') || trimmed.includes('دلخواه')) return 'محصولات سایز سفارشی';
  if (trimmed.includes('پاکت')) return 'پاکت';
  if (trimmed.includes('لیبل') || trimmed.includes('برچسب') || trimmed.includes('چسبدار')) return 'پشت چسبدار (لیبل)';
  if (trimmed.includes('تراکت') || trimmed.includes('پوستر') || trimmed.includes('سربرگ') || trimmed.includes('فرم عمومی') || trimmed.includes('فرم')) return 'تراکت ، سربرگ ، پوستر';
  if (
    trimmed.includes('کارت ویزیت') ||
    trimmed.includes('کارت') ||
    trimmed.includes('معمولی') ||
    trimmed.includes('عمومی') ||
    trimmed.includes('فانتزی') ||
    trimmed.includes('pvc') ||
    trimmed.includes('پی وی سی')
  ) {
    return 'کارت ویزیت';
  }
  return null;
}

/**
 * Normalizes "یکرو", "یک رو", "دورو", "دو رو" into 'یک رو' | 'دو رو'.
 */
export function normalizeSidesValue(rawSides: string): NormalizedSides {
  const cleaned = String(rawSides || '').trim().replace(/\s+/g, '');
  if (cleaned.includes('دو') || cleaned.includes('2')) {
    return 'دو رو';
  }
  return 'یک رو';
}

/**
 * Extracts real aspect ratio dimensions (in millimeters) and rounded corner flag
 * for the interactive Visual Size & Cut Preview.
 */
export function extractSizeDimensions(
  rawSize: string,
  productName: string
): {
  widthMm: number;
  heightMm: number;
  dimensionLabel: string;
  isRoundedCorner: boolean;
} {
  const s = toEnglishDigits(String(rawSize || '').trim());
  const p = String(productName || '').trim();
  const isRoundedCorner = p.includes('دورگرد');

  // Check explicit numeric patterns like 85*48, 90*60, 60*60, 89 × 57
  const multMatch = s.match(/(\d+)\s*[*×xX]\s*(\d+)/);
  if (multMatch) {
    const d1 = parseInt(multMatch[1], 10);
    const d2 = parseInt(multMatch[2], 10);
    // Keep landscape orientation for business cards so preview is consistent, or square for 60*60
    const widthMm = Math.max(d1, d2);
    const heightMm = Math.min(d1, d2);
    const isSquare = widthMm === heightMm;
    const pW = widthMm.toLocaleString('fa-IR');
    const pH = heightMm.toLocaleString('fa-IR');
    return {
      widthMm,
      heightMm,
      dimensionLabel: isSquare
        ? `${pW} × ${pH} میلی‌متر (مربع)`
        : `${pW} × ${pH} میلی‌متر`,
      isRoundedCorner,
    };
  }

  const upper = s.toUpperCase();
  if (upper.includes('A3')) {
    return {
      widthMm: 297,
      heightMm: 420,
      dimensionLabel: '۲۹۷ × ۴۲۰ میلی‌متر (A3)',
      isRoundedCorner,
    };
  }
  if (upper.includes('A4')) {
    const isPocket = s.includes('پاکت');
    return {
      widthMm: isPocket ? 229 : 210,
      heightMm: isPocket ? 324 : 297,
      dimensionLabel: isPocket ? '۲۲۹ × ۳۲۴ میلی‌متر (پاکت A4/C4)' : '۲۱۰ × ۲۹۷ میلی‌متر (A4)',
      isRoundedCorner,
    };
  }
  if (upper.includes('A5')) {
    const isPocket = s.includes('پاکت');
    return {
      widthMm: isPocket ? 162 : 148,
      heightMm: isPocket ? 229 : 210,
      dimensionLabel: isPocket ? '۱۶۲ × ۲۲۹ میلی‌متر (پاکت A5/C5)' : '۱۴۸ × ۲۱۰ میلی‌متر (A5)',
      isRoundedCorner,
    };
  }
  if (upper.includes('A6')) {
    return {
      widthMm: 105,
      heightMm: 148,
      dimensionLabel: '۱۰۵ × ۱۴۸ میلی‌متر (A6)',
      isRoundedCorner,
    };
  }
  if (upper.includes('B4')) {
    return {
      widthMm: 250,
      heightMm: 353,
      dimensionLabel: '۲۵۰ × ۳۵۳ میلی‌متر (B4)',
      isRoundedCorner,
    };
  }
  if (upper.includes('B5')) {
    return {
      widthMm: 176,
      heightMm: 250,
      dimensionLabel: '۱۷۶ × ۲۵۰ میلی‌متر (B5)',
      isRoundedCorner,
    };
  }
  if (upper.includes('B6')) {
    return {
      widthMm: 125,
      heightMm: 176,
      dimensionLabel: '۱۲۵ × ۱۷۶ میلی‌متر (B6)',
      isRoundedCorner,
    };
  }
  if (s.includes('پاکت نامه')) {
    return {
      widthMm: 220,
      heightMm: 110,
      dimensionLabel: '۲۲۰ × ۱۱۰ میلی‌متر (پاکت ملخی اداری)',
      isRoundedCorner,
    };
  }
  if (s.includes('1 لتی') || s.includes('تک لتی')) {
    return {
      widthMm: 100,
      heightMm: 200,
      dimensionLabel: '۱۰۰ × ۲۰۰ میلی‌متر (تراکت ۱ لتی)',
      isRoundedCorner,
    };
  }
  if (s.includes('2 لتی') || s.includes('دو لتی')) {
    return {
      widthMm: 200,
      heightMm: 200,
      dimensionLabel: '۲۰۰ × ۲۰۰ میلی‌متر (تراکت ۲ لتی)',
      isRoundedCorner,
    };
  }

  // Diameter (circles) like قطر 2, قطر 2.5, قطر 3, قطر 4.5, قطر 5
  const diameterMatch = s.match(/قطر\s*([\d.]+)/);
  if (diameterMatch) {
    const dVal = parseFloat(diameterMatch[1]);
    const dMm = dVal <= 10 ? Math.round(dVal * 10) : Math.round(dVal);
    const pD = dVal.toLocaleString('fa-IR');
    return {
      widthMm: dMm,
      heightMm: dMm,
      dimensionLabel: `قطر ${pD} سانتی‌متر (برش دایره‌ای)`,
      isRoundedCorner: true,
    };
  }

  // A2 size
  if (upper.includes('A2')) {
    return {
      widthMm: 420,
      heightMm: 594,
      dimensionLabel: '۴۲۰ × ۵۹۴ میلی‌متر (A2)',
      isRoundedCorner,
    };
  }

  return {
    widthMm: 85,
    heightMm: 55,
    dimensionLabel: s || '۸۵ × ۵۵ میلی‌متر',
    isRoundedCorner,
  };
}

/**
 * Extracts circulation quantity from Envelope ("پاکت") product names via Regex
 * when col[6] is empty (e.g., "پاکت تحریر 80 گرم 1000 عددی" -> 1000).
 */
export function extractQuantityFromProductName(productName: string): number {
  const normalized = toEnglishDigits(productName);
  // Match e.g. "1000 عددی", "2000 عدد", "5000 عددی"
  const explicitCount = normalized.match(/(\d[\d,]*)\s*(?:عددی|عدد)/);
  if (explicitCount) {
    return parseNumericCell(explicitCount[1]);
  }
  // Fallback: match standard print quantities (250, 500, 1000, 2000, 4000, 5000, 10000)
  const fallbackMatch = normalized.match(/\b(250|500|1000|2000|3000|4000|5000|10000)\b/);
  if (fallbackMatch) {
    return parseInt(fallbackMatch[1], 10);
  }
  return 1000;
}

/**
 * Stateful Forward-Fill Parser for the Persian Printing Studio Google Sheet CSV.
 *
 * Columns (Right-to-Left, Index 7 down to Index 0):
 * - col[7] (Col H): Product Name OR Section Header ("جنس معمولی", "فانتزی", "pvc", "فرم عمومی", "پاکت")
 * - col[6] (Col G): Quantity / Circulation ("تیراژ")
 * - col[5] (Col F): Size ("سایز")
 * - col[4] (Col E): Sides ("یک رو دورو")
 * - col[3] (Col D): BASE COST ("قیمت پایه/همکار")
 * - col[2] (Col C): Delivery Time ("تحویل")
 * - col[1] (Col B): Default Sheet Margin % ("درصد")
 * - col[0] (Col A): Sheet Final Price ("قیمت")
 */
export function parsePrintSheetRows(
  rawRows: string[][],
  defaultCategory: PrintCategoryKey = 'کارت ویزیت'
): PrintProductRow[] {
  const results: PrintProductRow[] = [];

  let activeCategory: PrintCategoryKey = defaultCategory;
  let lastProductName = '';
  let lastQuantity = 0;
  let lastSize = '';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length < 4) continue;

    const col0 = String(row[0] ?? '').trim();
    const col1 = String(row[1] ?? '').trim();
    const col2 = String(row[2] ?? '').trim();
    const col3 = String(row[3] ?? '').trim();
    const col4 = String(row[4] ?? '').trim();
    const col5 = String(row[5] ?? '').trim();
    const col6 = String(row[6] ?? '').trim();
    const col7 = String(row[7] ?? '').trim();

    // Rule 1: Category Detection
    if (col0 === 'قیمت' || col2 === 'تحویل') {
      const detectedCategory = normalizeCategoryHeader(col7);
      if (detectedCategory) {
        activeCategory = detectedCategory;
      }
      lastProductName = '';
      lastQuantity = 0;
      lastSize = '';
      continue;
    }

    // Parse baseCost from col[3]
    const baseCost = parseNumericCell(col3);
    if (baseCost <= 0) {
      continue;
    }

    // Rule 4: Missing Name Fix
    let currentProductName = col7;
    if (
      activeCategory === 'کارت ویزیت' &&
      !currentProductName &&
      col5 === '60*60' &&
      lastProductName.includes('لمینت برجسته مخملی')
    ) {
      currentProductName = 'لمینت برجسته مخملی مربع';
    }

    // Rule 2: Forward-Fill Merged Cells
    if (currentProductName) {
      lastProductName = currentProductName;
    } else {
      currentProductName = lastProductName;
    }

    let currentSize = col5;
    if (currentSize) {
      lastSize = currentSize;
    } else {
      currentSize = lastSize;
    }

    let currentQuantity = parseNumericCell(col6);
    if (currentQuantity > 0) {
      lastQuantity = currentQuantity;
    } else if (activeCategory === 'پاکت' || currentProductName.includes('عددی')) {
      // Rule 3: Envelope Quantity Extraction
      currentQuantity = extractQuantityFromProductName(currentProductName);
      lastQuantity = currentQuantity;
    } else if (lastQuantity > 0) {
      currentQuantity = lastQuantity;
    } else {
      currentQuantity = extractQuantityFromProductName(currentProductName);
      lastQuantity = currentQuantity;
    }

    const normalizedSides = normalizeSidesValue(col4);
    const sheetMarginPercent = parseNumericCell(col1) || 30;
    const sheetFinalPrice = parseNumericCell(col0);
    const deliveryTime = col2 || '۲ روز';

    const { widthMm, heightMm, dimensionLabel, isRoundedCorner } = extractSizeDimensions(
      currentSize,
      currentProductName
    );

    results.push({
      id: `${activeCategory}-${i}-${currentProductName}-${currentSize}-${currentQuantity}-${normalizedSides}`,
      rowIndex: i + 1,
      category: activeCategory,
      productName: currentProductName,
      quantity: currentQuantity,
      size: currentSize,
      normalizedSize: currentSize.replace(/\s+/g, ' ').trim(),
      sides: normalizedSides,
      rawSides: col4,
      baseCost,
      deliveryTime,
      sheetMarginPercent,
      sheetFinalPrice,
      widthMm,
      heightMm,
      dimensionLabel,
      isRoundedCorner,
    });
  }

  return results;
}

/**
 * Parses a raw CSV string into structured PrintProductRow items using PapaParse.
 */
export function parsePrintSheetCsv(
  csvText: string,
  defaultCategory: PrintCategoryKey = 'کارت ویزیت'
): PrintProductRow[] {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });
  return parsePrintSheetRows(parsed.data || [], defaultCategory);
}

/**
 * Transforms raw item from fallback JSON into full PrintProductRow.
 */
export function getBundledFallbackProducts(): PrintProductRow[] {
  return FALLBACK_PRODUCTS_ALL_11_SHEETS.map((item, idx) => {
    const normalizedSides = normalizeSidesValue(item.rawSides);
    const { widthMm, heightMm, dimensionLabel, isRoundedCorner } = extractSizeDimensions(
      item.size,
      item.productName
    );
    return {
      id: item.id || `fb-${idx}`,
      rowIndex: item.rowIndex || idx + 1,
      category: item.category as PrintCategoryKey,
      productName: item.productName,
      quantity: item.quantity,
      size: item.size,
      normalizedSize: item.size.replace(/\s+/g, ' ').trim(),
      sides: normalizedSides,
      rawSides: item.rawSides,
      baseCost: item.baseCost,
      deliveryTime: item.deliveryTime,
      sheetMarginPercent: item.sheetMarginPercent,
      sheetFinalPrice: item.sheetFinalPrice,
      widthMm,
      heightMm,
      dimensionLabel,
      isRoundedCorner,
    };
  });
}

/**
 * Fetches all 11 published sheets from Google Sheets in parallel and merges results.
 */
export async function fetchAndParseAllPublishedSheets(
  onProgress?: (loaded: number, total: number) => void
): Promise<PrintProductRow[]> {
  const totalSheets = PRINT_CATEGORIES.length;
  let loadedSheets = 0;

  const fetchPromises = PRINT_CATEGORIES.map(async (catMeta) => {
    const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSCtS_8qGEMTduYU06zG5vpW4tSHCGKyJygOnX9mQiTfD_XI895ghJghhTHGhzDag/pub?gid=${catMeta.gid}&single=true&output=csv`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
      const rows = parsePrintSheetRows(parsed.data || [], catMeta.key);
      loadedSheets++;
      if (onProgress) onProgress(loadedSheets, totalSheets);
      return rows;
    } catch (err) {
      console.warn(`Failed to fetch sheet ${catMeta.title} (gid: ${catMeta.gid}):`, err);
      loadedSheets++;
      if (onProgress) onProgress(loadedSheets, totalSheets);
      return getBundledFallbackProducts().filter((p) => p.category === catMeta.key);
    }
  });

  const allResults = await Promise.all(fetchPromises);
  const flattened = allResults.flat();
  return flattened.length > 0 ? flattened : getBundledFallbackProducts();
}
