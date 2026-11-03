import React, { useState, useEffect } from 'react';
import { Printer, MessageCircle, Copy, Check, X, Trash2, Plus, Minus, FileSpreadsheet } from 'lucide-react';
import { QuoteCartItem } from '../types/studio';
import { formatPersianPrice } from '../utils/sheetParser';

interface PreInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: QuoteCartItem[];
  onUpdateSeries: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  storeName: string;
  invoiceTitle: string;
  defaultStudioWhatsapp: string;
  invoiceFooterNote: string;
}

export const PreInvoiceModal: React.FC<PreInvoiceModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateSeries,
  onRemoveItem,
  onClearCart,
  storeName,
  invoiceTitle,
  defaultStudioWhatsapp,
  invoiceFooterNote,
}) => {
  const [customerName, setCustomerName] = useState('شرکت / مشتری گرامی');
  const [customerPhone, setCustomerPhone] = useState('');
  const [studioPhone, setStudioPhone] = useState(defaultStudioWhatsapp || '989120000000');
  const [orderNotes, setOrderNotes] = useState('');
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  useEffect(() => {
    if (defaultStudioWhatsapp) {
      setStudioPhone(defaultStudioWhatsapp);
    }
  }, [defaultStudioWhatsapp]);

  if (!isOpen) return null;

  const grandTotal = items.reduce((acc, item) => acc + item.totalCustomerPrice, 0);
  const totalQuantityPieces = items.reduce(
    (acc, item) => acc + item.product.quantity * item.seriesCount,
    0
  );

  const invoiceDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const invoiceSerial = `INV-${String(new Date().getTime()).slice(-6)}`;

  const effectiveStoreName = storeName.trim() || 'استودیو چاپ و گرافیک نقش‌نگار';
  const effectiveInvoiceTitle =
    invoiceTitle.trim() || 'پیش‌فاکتور رسمی خدمات لیتوگرافی، چاپ افست و دیجیتال';

  const buildWhatsappText = (): string => {
    const lines: string[] = [
      `📋 *${effectiveInvoiceTitle} - ${effectiveStoreName}*`,
      `شماره پیش‌فاکتور: ${invoiceSerial}`,
      `تاریخ: ${invoiceDate}`,
      `نام سفارش‌دهنده: ${customerName || 'مشتری گرامی'}`,
      customerPhone ? `شماره تماس: ${customerPhone}` : '',
      `────────────────────`,
    ].filter(Boolean);

    items.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. *${item.product.productName}*` +
          (item.customTitle ? ` (${item.customTitle})` : '') +
          `\n   • سایز: ${item.product.size} | ${item.product.sides} | تیراژ: ${formatPersianPrice(item.product.quantity)} عدد × ${item.seriesCount.toLocaleString('fa-IR')} سری` +
          `\n   • تحویل: ${item.product.deliveryTime} | مبلغ: *${formatPersianPrice(item.totalCustomerPrice)} تومان*`
      );
    });

    lines.push(`────────────────────`);
    lines.push(`💰 *جمع کل قابل پرداخت: ${formatPersianPrice(grandTotal)} تومان*`);
    if (orderNotes.trim()) {
      lines.push(`📝 توضیحات سفارش: ${orderNotes.trim()}`);
    }
    return lines.join('\n');
  };

  const handleCopyWhatsappText = () => {
    const text = buildWhatsappText();
    navigator.clipboard?.writeText(text);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2200);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const cleanPhone = studioPhone.replace(/[^\d]/g, '') || '989120000000';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(buildWhatsappText())}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="پیش‌فاکتور رسمی و سبد سفارش چاپ"
    >
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        {/* Top Modal Action Bar (Hidden when printing) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {effectiveInvoiceTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف همه اقلام</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن پیش‌فاکتور"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customer Info Inputs (Hidden when printing) */}
        <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
          <div>
            <label htmlFor="invoice-customer-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              نام خریدار / شرکت سفارش‌دهنده
            </label>
            <input
              id="invoice-customer-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="مثلاً: شرکت توسعه نگار"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="invoice-customer-phone" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              شماره تماس سفارش‌دهنده
            </label>
            <input
              id="invoice-customer-phone"
              type="text"
              dir="ltr"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="0912..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono-num"
            />
          </div>
          <div>
            <label htmlFor="invoice-studio-whatsapp" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              شماره واتساپ واحد فروش چاپخانه
            </label>
            <input
              id="invoice-studio-whatsapp"
              type="text"
              dir="ltr"
              value={studioPhone}
              onChange={(e) => setStudioPhone(e.target.value)}
              placeholder="989120000000"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono-num"
            />
          </div>
        </div>

        {/* Printable Formal Pre-Invoice Area */}
        <div
          id="printable-preinvoice"
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
        >
          {/* Invoice Official Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b-2 border-slate-900 dark:border-slate-200">
            <div>
              <h3
                data-testid="invoice-store-name"
                className="text-xl font-extrabold text-slate-900 dark:text-slate-100"
              >
                {effectiveStoreName}
              </h3>
              <p
                data-testid="invoice-title-text"
                className="text-xs text-slate-500 dark:text-slate-400 mt-1"
              >
                {effectiveInvoiceTitle}
              </p>
            </div>
            <div className="text-xs space-y-1 text-left font-mono-num">
              <div>
                <span className="text-slate-500 dark:text-slate-400">شماره پیش‌فاکتور: </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{invoiceSerial}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">تاریخ صدور: </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{invoiceDate}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">خریدار: </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{customerName}</span>
                {customerPhone ? ` (${customerPhone})` : ''}
              </div>
            </div>
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                سبد پیش‌فاکتور شما در حال حاضر خالی است. از بخش ماشین‌حساب یا جدول تعرفه‌ها اقلام چاپی مورد نظر را اضافه کنید.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-right text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60">
                    <th className="py-2.5 px-3 font-semibold">ردیف</th>
                    <th className="py-2.5 px-3 font-semibold">شرح محصول و مشخصات فنی چاپ</th>
                    <th className="py-2.5 px-3 font-semibold">سایز و رو</th>
                    <th className="py-2.5 px-3 font-semibold">تیراژ هر سری</th>
                    <th className="py-2.5 px-3 font-semibold">تعداد سری</th>
                    <th className="py-2.5 px-3 font-semibold">تحویل</th>
                    <th className="py-2.5 px-3 font-semibold">فی هر سری (تومان)</th>
                    <th className="py-2.5 px-3 font-semibold">مبلغ کل (تومان)</th>
                    <th className="py-2.5 px-2 font-semibold no-print">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={item.cartItemId}>
                      <td className="py-3 px-3 font-mono-num text-xs text-slate-500">
                        {(idx + 1).toLocaleString('fa-IR')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.product.productName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          دسته: {item.product.category}
                          {item.customTitle ? ` · عنوان طرح: ${item.customTitle}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs font-mono-num whitespace-nowrap">
                        <span dir="ltr" className="inline-block">{item.product.size}</span> · {item.product.sides}
                      </td>
                      <td className="py-3 px-3 font-mono-num whitespace-nowrap">
                        {formatPersianPrice(item.product.quantity)} عدد
                      </td>
                      <td className="py-3 px-3 font-mono-num whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateSeries(item.cartItemId, -1)}
                            aria-label={`کاهش سری ${item.product.productName}`}
                            className="no-print p-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold px-1.5">
                            {item.seriesCount.toLocaleString('fa-IR')}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateSeries(item.cartItemId, 1)}
                            aria-label={`افزایش سری ${item.product.productName}`}
                            className="no-print p-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs whitespace-nowrap">{item.product.deliveryTime}</td>
                      <td className="py-3 px-3 font-mono-num text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatPersianPrice(item.unitCustomerPrice)}
                      </td>
                      <td className="py-3 px-3 font-mono-num font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatPersianPrice(item.totalCustomerPrice)}
                      </td>
                      <td className="py-3 px-2 no-print">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartItemId)}
                          aria-label={`حذف ${item.product.productName} از پیش‌فاکتور`}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Footer */}
              <div className="mt-6 pt-4 border-t-2 border-slate-900 dark:border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div>
                    تعداد کل اقلام چاپی: <strong className="font-mono-num">{items.length.toLocaleString('fa-IR')} ردیف</strong> · مجموع کل تیراژ: <strong className="font-mono-num">{formatPersianPrice(totalQuantityPieces)} برگ/عدد</strong>
                  </div>
                  <div>{invoiceFooterNote}</div>
                </div>

                <div className="text-left">
                  <div className="text-xs text-slate-500 dark:text-slate-400">جمع کل قابل پرداخت:</div>
                  <div
                    data-testid="preinvoice-grand-total"
                    className="text-2xl font-extrabold font-mono-num text-amber-600 dark:text-amber-400"
                  >
                    {formatPersianPrice(grandTotal)} <span className="text-sm font-normal">تومان</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Note & Bottom Export Buttons (Hidden when printing) */}
        {items.length > 0 && (
          <div className="no-print mt-5 space-y-4">
            <div>
              <label htmlFor="invoice-order-notes" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                توضیحات تکمیلی سفارش (مثلاً: شماره فایل تلگرام/واتساپ، نوع خط تا، یا خدمات تکمیلی)
              </label>
              <input
                id="invoice-order-notes"
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="توضیحات اختیاری برای واحد لیتوگرافی..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyWhatsappText}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copiedWhatsapp ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>متن پیش‌فاکتور کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>کپی متن سفارش</span>
                  </>
                )}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>ارسال مستقیم سفارش در واتساپ</span>
              </a>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ / ذخیره PDF پیش‌فاکتور</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
