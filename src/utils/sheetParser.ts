import Papa from 'papaparse';

export type PrintCategoryKey = 'جنس معمولی' | 'فانتزی' | 'pvc' | 'فرم عمومی' | 'پاکت';

export type NormalizedSides = 'یک رو' | 'دو رو';

export interface CategoryMeta {
  key: PrintCategoryKey;
  title: string;
  shortTitle: string;
  subtitle: string;
  badgeText: string;
}

export const PRINT_CATEGORIES: CategoryMeta[] = [
  {
    key: 'جنس معمولی',
    title: 'کارت ویزیت عمومی',
    shortTitle: 'جنس معمولی',
    subtitle: 'گلاسه، سلفون مات و براق، کتان امباس و کاتالوگ',
    badgeText: 'تحویل ۱ تا ۲ روزه',
  },
  {
    key: 'فانتزی',
    title: 'کارت ویزیت فانتزی و لوکس',
    shortTitle: 'فانتزی',
    subtitle: 'لمینت برجسته، مخملی، طلاکارت، طرح موج و دورگرد',
    badgeText: 'کیفیت ویژه برندینگ',
  },
  {
    key: 'pvc',
    title: 'کارتهای PVC',
    shortTitle: 'PVC',
    subtitle: 'کارت‌های پرسنلی، باشگاهی و بانکی ۳۰۰ تا ۷۶۰ میکرون',
    badgeText: 'مقاوم و ضدآب',
  },
  {
    key: 'فرم عمومی',
    title: 'تراکت و سربرگ',
    shortTitle: 'فرم عمومی',
    subtitle: 'انواع تراکت گلاسه و تحریر، سربرگ تحریر، کتان و کارتی',
    badgeText: 'فرم‌های شیت عمومی',
  },
  {
    key: 'پاکت',
    title: 'انواع پاکت نامه و اداری',
    shortTitle: 'پاکت',
    subtitle: 'پاکت ملخی، کیسه‌ای و کیفی در سایزهای A3، A4 و A5',
    badgeText: 'ست اداری و مکاتبات',
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
 * Normalizes category header strings from col[7].
 */
export function normalizeCategoryHeader(rawHeader: string): PrintCategoryKey | null {
  const trimmed = String(rawHeader || '').trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.includes('جنس معمولی') || trimmed.includes('معمولی')) return 'جنس معمولی';
  if (trimmed.includes('فانتزی')) return 'فانتزی';
  if (trimmed.includes('pvc') || trimmed.includes('پی وی سی')) return 'pvc';
  if (trimmed.includes('فرم عمومی') || trimmed.includes('تراکت')) return 'فرم عمومی';
  if (trimmed.includes('پاکت')) return 'پاکت';
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
export function parsePrintSheetRows(rawRows: string[][]): PrintProductRow[] {
  const results: PrintProductRow[] = [];

  let activeCategory: PrintCategoryKey = 'جنس معمولی';
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
    // Whenever a row has col[0] === "قیمت" or col[2].trim() === "تحویل", treat col[7] as the new active Category
    if (col0 === 'قیمت' || col2 === 'تحویل') {
      const detectedCategory = normalizeCategoryHeader(col7);
      if (detectedCategory) {
        activeCategory = detectedCategory;
      }
      // Reset forward-fill state when entering a new category block
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
    // If a row in "فانتزی" has size "60*60" right under "لمینت برجسته مخملی" with an empty name,
    // name it "لمینت برجسته مخملی مربع"
    let currentProductName = col7;
    if (
      activeCategory === 'فانتزی' &&
      !currentProductName &&
      col5 === '60*60' &&
      lastProductName === 'لمینت برجسته مخملی'
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
    } else if (activeCategory === 'پاکت') {
      // Rule 3: Envelope Quantity Extraction
      // In the "پاکت" category, col[6] is empty; extract the quantity (1000, 2000, 5000) automatically from lastProductName via Regex
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
export function parsePrintSheetCsv(csvText: string): PrintProductRow[] {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });
  return parsePrintSheetRows(parsed.data || []);
}
