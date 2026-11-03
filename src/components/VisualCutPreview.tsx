import React, { useState } from 'react';
import { Maximize2, Scissors, ShieldCheck, Layers } from 'lucide-react';
import { PrintProductRow, toEnglishDigits } from '../utils/sheetParser';

interface VisualCutPreviewProps {
  product: PrintProductRow | null;
}

export const VisualCutPreview: React.FC<VisualCutPreviewProps> = ({ product }) => {
  const [showBleed, setShowBleed] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-6 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          جهت مشاهده شبیه‌ساز ابعاد و خط برش، یک محصول را انتخاب نمایید.
        </p>
      </div>
    );
  }

  const { widthMm, heightMm, isRoundedCorner, dimensionLabel, productName, sides, size } = product;

  // Calculate scaled visual container size (fitting nicely within a 240x190 viewport box)
  const maxBoxWidth = 220;
  const maxBoxHeight = 165;
  const ratio = widthMm / heightMm;

  let displayW = maxBoxWidth;
  let displayH = Math.round(maxBoxWidth / ratio);

  if (displayH > maxBoxHeight) {
    displayH = maxBoxHeight;
    displayW = Math.round(maxBoxHeight * ratio);
  }

  // Ensure minimum readable dimensions
  displayW = Math.max(84, displayW);
  displayH = Math.max(64, displayH);

  // Calculate 300 DPI pixel equivalents for prepress designers
  const pxWidth = Math.round(((widthMm + 4) / 25.4) * 300);
  const pxHeight = Math.round(((heightMm + 4) / 25.4) * 300);

  const persianW = widthMm.toLocaleString('fa-IR');
  const persianH = heightMm.toLocaleString('fa-IR');
  const isPvc = product.category === 'pvc';
  const hasRounded = isRoundedCorner || isPvc;

  return (
    <div
      data-testid="visual-cut-preview"
      className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5"
    >
      {/* Top Header & Guide Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Maximize2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>شبیه‌ساز زنده سایز و خط برش</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dimensionLabel} · {hasRounded ? 'گوشه دورگرد (شعاع ۳mm)' : 'گوشه تیز (برش صاف گیوتینی)'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowBleed((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showBleed
                ? 'bg-rose-600 text-white'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            خط برش (2mm)
          </button>
          <button
            type="button"
            onClick={() => setShowSafeZone((prev) => !prev)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showSafeZone
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            حاشیه امن (3mm)
          </button>
        </div>
      </div>

      {/* Interactive Proportional Blueprint Stage */}
      <div className="relative flex items-center justify-center my-4 min-h-[205px] rounded-lg bg-slate-100 dark:bg-slate-950/90 border border-slate-200/60 dark:border-slate-800/80 overflow-hidden p-6">
        {/* Top Dimension Ruler Label */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
          عرض: {persianW} میلی‌متر
        </div>

        {/* Right Dimension Ruler Label */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-mono-num text-slate-500 dark:text-slate-400 whitespace-nowrap">
          ارتفاع: {persianH} میلی‌متر
        </div>

        {/* Outer Bleed Area (+2mm each side) */}
        <div
          style={{
            width: `${displayW + (showBleed ? 14 : 0)}px`,
            height: `${displayH + (showBleed ? 14 : 0)}px`,
          }}
          className={`relative flex items-center justify-center transition-transform duration-150 ${
            showBleed
              ? 'border border-dashed border-rose-500/80 bg-rose-500/5'
              : ''
          } ${hasRounded ? 'rounded-2xl' : 'rounded-none'}`}
        >
          {/* Actual Trim / Cut Box */}
          <div
            data-testid="cut-preview-box"
            data-rounded={hasRounded ? 'true' : 'false'}
            style={{
              width: `${displayW}px`,
              height: `${displayH}px`,
            }}
            className={`relative flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-slate-800 dark:border-slate-200 shadow-sm transition-colors duration-150 ${
              hasRounded ? 'rounded-2xl' : 'rounded-none'
            }`}
          >
            {/* Safe Margin Zone (-3mm inside cut line) */}
            {showSafeZone && (
              <div
                className={` inset-2.5 absolute border border-dashed border-emerald-500/85 pointer-events-none ${
                  hasRounded ? 'rounded-xl' : 'rounded-none'
                }`}
              />
            )}

            {/* Center Spec Information inside the simulated sheet/card */}
            <div className="px-2 text-center z-10 select-none">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[170px]">
                {productName}
              </div>
              <div className="text-[11px] font-mono-num text-slate-500 dark:text-slate-400 mt-0.5">
                {toEnglishDigits(size)} · {sides}
              </div>
              {isRoundedCorner && (
                <div className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  قالب دورگرد فابریک
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Technical Prepress Metadata Strip (Unboxed zero-pill discipline) */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Scissors className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>سایز با برش:</span>
          <span dir="ltr" className="inline-block font-mono-num font-semibold text-slate-900 dark:text-slate-200">
            {widthMm + 4} × {heightMm + 4} mm
          </span>
        </div>
        <span aria-hidden="true">·</span>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>رزولوشن (300 DPI):</span>
          <span dir="ltr" className="inline-block font-mono-num font-semibold text-slate-900 dark:text-slate-200">
            {pxWidth} × {pxHeight} px
          </span>
        </div>
        <span aria-hidden="true">·</span>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>مد رنگی CMYK</span>
        </div>
      </div>
    </div>
  );
};
