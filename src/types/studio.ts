import { PrintCategoryKey, PrintProductRow } from '../utils/sheetParser';
import { DEFAULT_ADMIN_PASSWORD_HASH } from '../utils/security';

export type RoundingStepOption = 1000 | 5000 | 10000 | 50000;

export interface AdminSettings {
  // Store & Pre-Invoice Branding
  storeName: string;
  invoiceTitle: string;
  storeWhatsapp: string;
  invoiceFooterNote: string;

  // Security (Salted SHA-256 Digest)
  adminPasswordHash: string;
  hasChangedDefaultPassword: boolean;

  // Pricing Engine & Margin
  globalMarginPercent: number;
  useCategoryMargins: boolean;
  categoryMargins: Record<PrintCategoryKey, number>;
  roundingStep: RoundingStepOption;
  showBaseCostInTable: boolean;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  storeName: 'چاپ رامین',
  invoiceTitle: 'پیش‌فاکتور رسمی خدمات لیتوگرافی، چاپ افست و دیجیتال',
  storeWhatsapp: '989120000000',
  invoiceFooterNote:
    'اعتبار پیش‌فاکتور: ۴۸ ساعت پس از صدور · زمان تحویل از زمان تایید نهایی فایل چاپی محاسبه می‌گردد.',
  adminPasswordHash: DEFAULT_ADMIN_PASSWORD_HASH,
  hasChangedDefaultPassword: false,
  globalMarginPercent: 30,
  useCategoryMargins: false,
  categoryMargins: {
    'کارت ویزیت': 30,
    'تراکت ، سربرگ ، پوستر': 30,
    'پشت چسبدار (لیبل)': 30,
    'پاکت': 30,
    'انواع جعبه و بسته بندی': 30,
    'محصولات تبلیغاتی': 30,
    'محصولات اداری و تجاری': 30,
    'فاکتور': 30,
    'محصولات فست فود': 30,
    'محصولات ۶ ساعته': 30,
    'محصولات سایز سفارشی': 30,
  },
  roundingStep: 1000,
  showBaseCostInTable: false,
};

export interface QuoteCartItem {
  cartItemId: string;
  product: PrintProductRow;
  seriesCount: number; // تعداد سری (default 1)
  customTitle: string; // عنوان طرح یا توضیح سفارش
  appliedMarginPercent: number;
  appliedRoundingStep: RoundingStepOption;
  unitCustomerPrice: number; // قیمت هر ۱ سری
  singlePiecePrice: number; // قیمت هر ۱ برگ/کارت
  totalCustomerPrice: number; // قیمت کل (seriesCount * unitCustomerPrice)
}
