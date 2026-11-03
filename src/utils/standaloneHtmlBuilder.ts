import { FALLBACK_SHEET_CSV, LIVE_GOOGLE_SHEET_CSV_URL } from '../data/fallbackCsv';

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

import { AdminSettings } from '../types/studio';

/**
 * Generates a complete, self-contained, single-file HTML5 application
 * (HTML5 + TailwindCSS CDN + Lucide Icons + PapaParse + SheetJS + Embedded Rust/WASM Pricing Engine)
 * that can be saved and opened anywhere offline or hosted as a single `.html` file.
 */
export function buildStandaloneSingleFileHtml(settings?: Partial<AdminSettings>): string {
  const escapedCsv = JSON.stringify(FALLBACK_SHEET_CSV);
  const storeName = settings?.storeName || 'استودیو چاپ و گرافیک نقش‌نگار';
  const invoiceTitle = settings?.invoiceTitle || 'پیش‌فاکتور رسمی خدمات لیتوگرافی، چاپ افست و دیجیتال';
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${storeName} | سامانه هوشمند استعلام قیمت و سفارش چاپ</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Vazirmatn', sans-serif; direction: rtl; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">
  <div class="max-w-7xl mx-auto p-4 md:p-6">
    <header class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
      <div>
        <h1 class="text-xl font-extrabold text-slate-900">${storeName}</h1>
        <p class="text-xs text-slate-500 mt-1">${invoiceTitle}</p>
      </div>
      <div class="flex items-center gap-2 no-print">
        <button onclick="syncLiveSheet()" class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800">بروزرسانی زنده قیمتها</button>
        <button onclick="toggleAdmin()" class="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100">پنل مدیریت</button>
      </div>
    </header>

    <div id="admin-box" class="hidden my-4 p-4 rounded-xl border border-amber-300 bg-amber-50/70 no-print">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-xs font-bold mb-1">درصد سود (Margin %)</label>
          <input id="adm-margin" type="number" min="0" max="100" value="30" onchange="updateSettings()" class="w-full px-3 py-1.5 rounded border border-slate-300 bg-white text-sm" />
        </div>
        <div>
          <label class="block text-xs font-bold mb-1">پله گرد کردن به بالا (Ceiling)</label>
          <select id="adm-step" onchange="updateSettings()" class="w-full px-3 py-1.5 rounded border border-slate-300 bg-white text-sm">
            <option value="1000">۱,۰۰۰ تومان</option>
            <option value="5000">۵,۰۰۰ تومان</option>
            <option value="10000">۱۰,۰۰۰ تومان</option>
            <option value="50000">۵۰,۰۰۰ تومان</option>
          </select>
        </div>
        <div>
          <label class="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input id="adm-show-base" type="checkbox" onchange="updateSettings()" />
            <span>نمایش قیمت خرید در جدول (ویژه مدیر)</span>
          </label>
        </div>
        <div>
          <label class="block text-xs font-bold mb-1">بارگذاری اکسل/CSV آفلاین</label>
          <input type="file" accept=".csv,.xlsx,.xls" onchange="handleFileUpload(event)" class="text-xs" />
        </div>
      </div>
    </div>

    <div id="cat-tabs" class="flex flex-wrap gap-2 my-5 no-print"></div>

    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table class="w-full text-right text-sm">
        <thead class="bg-slate-100 text-xs text-slate-600 border-b border-slate-200">
          <tr id="table-head"></tr>
        </thead>
        <tbody id="table-body" class="divide-y divide-slate-200"></tbody>
      </table>
    </div>
  </div>

  <script>
    const SHEET_URL = "${LIVE_GOOGLE_SHEET_CSV_URL}";
    const FALLBACK_CSV = ${escapedCsv};

    // Embedded Rust -> WebAssembly Binary (calc_final_price, calc_unit_price, calc_profit)
    const WASM_BYTES = new Uint8Array([
      0x00,0x61,0x73,0x6d,0x01,0x00,0x00,0x00,0x01,0x0e,0x02,0x60,0x03,0x7c,0x7c,0x7c,0x01,0x7c,0x60,0x02,0x7c,0x7c,0x01,0x7c,
      0x03,0x04,0x03,0x00,0x01,0x01,0x07,0x34,0x03,0x10,0x63,0x61,0x6c,0x63,0x5f,0x66,0x69,0x6e,0x61,0x6c,0x5f,0x70,0x72,0x69,0x63,0x65,0x00,0x00,
      0x0f,0x63,0x61,0x6c,0x63,0x5f,0x75,0x6e,0x69,0x74,0x5f,0x70,0x72,0x69,0x63,0x65,0x00,0x01,0x0b,0x63,0x61,0x6c,0x63,0x5f,0x70,0x72,0x6f,0x66,0x69,0x74,0x00,0x02,
      0x0a,0x49,0x03,0x2c,0x00,0x20,0x00,0x44,0x00,0x00,0x00,0x00,0x00,0x00,0x59,0x40,0x20,0x01,0xa0,0xa2,0x44,0x00,0x00,0x00,0x00,0x00,0x00,0x59,0x40,0xa3,
      0x44,0x95,0xbf,0xd6,0xc7,0xdd,0xb2,0x7a,0x3e,0xa1,0x20,0x02,0xa3,0x9b,0x20,0x02,0xa2,0x0b,0x12,0x00,0x20,0x00,0x20,0x01,0xa3,
      0x44,0x95,0xbf,0xd6,0xc7,0xdd,0xb2,0x7a,0x3e,0xa1,0x9b,0x0b,0x07,0x00,0x20,0x00,0x20,0x01,0xa1,0x0b
    ]);
    const wasmMod = new WebAssembly.Module(WASM_BYTES);
    const wasmInst = new WebAssembly.Instance(wasmMod, {}).exports;

    let allRows = [];
    let activeCat = "جنس معمولی";
    let state = { margin: 30, step: 1000, showBase: false, unlocked: false };

    function calcPrice(baseCost) {
      return Math.round(wasmInst.calc_final_price(baseCost, state.margin, state.step));
    }

    function parseSheet(rows) {
      const out = [];
      let cat = "جنس معمولی", lastProd = "", lastQty = 0, lastSize = "";
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 4) continue;
        const c0 = String(r[0]||"").trim(), c2 = String(r[2]||"").trim(), c7 = String(r[7]||"").trim();
        if (c0 === "قیمت" || c2 === "تحویل") {
          if (c7.includes("معمولی")) cat = "جنس معمولی";
          else if (c7.includes("فانتزی")) cat = "فانتزی";
          else if (c7.toLowerCase().includes("pvc")) cat = "pvc";
          else if (c7.includes("فرم")) cat = "فرم عمومی";
          else if (c7.includes("پاکت")) cat = "پاکت";
          lastProd = ""; lastQty = 0; lastSize = "";
          continue;
        }
        const baseCost = parseInt(String(r[3]||"").replace(/[^\\d]/g, ""), 10);
        if (!baseCost) continue;
        let prod = c7;
        if (cat === "فانتزی" && !prod && String(r[5]||"").trim() === "60*60" && lastProd === "لمینت برجسته مخملی") {
          prod = "لمینت برجسته مخملی مربع";
        }
        if (prod) lastProd = prod; else prod = lastProd;
        let sz = String(r[5]||"").trim();
        if (sz) lastSize = sz; else sz = lastSize;
        let qty = parseInt(String(r[6]||"").replace(/[^\\d]/g, ""), 10);
        if (qty > 0) lastQty = qty;
        else if (cat === "پاکت") {
          const m = prod.match(/(\\d+)\\s*عددی/) || prod.match(/\\b(1000|2000|5000)\\b/);
          qty = m ? parseInt(m[1], 10) : 1000;
          lastQty = qty;
        } else qty = lastQty || 1000;
        const sides = String(r[4]||"").includes("دو") ? "دو رو" : "یک رو";
        out.push({ cat, prod, sz, qty, sides, baseCost, delivery: c2 });
      }
      return out;
    }

    function render() {
      const cats = ["جنس معمولی", "فانتزی", "pvc", "فرم عمومی", "پاکت"];
      document.getElementById("cat-tabs").innerHTML = cats.map(c =>
        \`<button onclick="activeCat='\${c}';render()" class="px-4 py-2 text-xs font-bold rounded-lg \${activeCat===c?'bg-amber-500 text-slate-950':'bg-white border border-slate-200'}">\${c}</button>\`
      ).join("");

      document.getElementById("table-head").innerHTML = \`
        <th class="p-3">نام محصول</th><th class="p-3">سایز</th><th class="p-3">تیراژ</th><th class="p-3">رو</th><th class="p-3">تحویل</th>
        \${state.showBase ? '<th class="p-3 text-rose-600">قیمت خرید همکار</th>' : ''}
        <th class="p-3">قیمت هر عدد</th><th class="p-3">قیمت نهایی (تومان)</th>
      \`;

      const filtered = allRows.filter(r => r.cat === activeCat);
      document.getElementById("table-body").innerHTML = filtered.map(r => {
        const finalP = calcPrice(r.baseCost);
        const unitP = Math.round(wasmInst.calc_unit_price(finalP, r.qty));
        return \`<tr class="hover:bg-slate-50">
          <td class="p-3 font-bold">\${r.prod}</td>
          <td class="p-3 tabular-nums">\${r.sz}</td>
          <td class="p-3 tabular-nums">\${r.qty.toLocaleString('fa-IR')}</td>
          <td class="p-3">\${r.sides}</td>
          <td class="p-3">\${r.delivery}</td>
          \${state.showBase ? \`<td class="p-3 tabular-nums text-rose-600 font-bold">\${r.baseCost.toLocaleString('fa-IR')}</td>\` : ''}
          <td class="p-3 tabular-nums">\${unitP.toLocaleString('fa-IR')}</td>
          <td class="p-3 tabular-nums font-extrabold text-amber-700">\${finalP.toLocaleString('fa-IR')}</td>
        </tr>\`;
      }).join("");
    }

    function toggleAdmin() {
      if (!state.unlocked) {
        const pin = prompt("رمز پنل مدیریت را وارد کنید (پیش‌فرض: 1234):", "");
        if (pin !== "1234") return;
        state.unlocked = true;
      }
      document.getElementById("admin-box").classList.toggle("hidden");
    }

    function updateSettings() {
      state.margin = parseFloat(document.getElementById("adm-margin").value) || 0;
      state.step = parseInt(document.getElementById("adm-step").value, 10) || 1000;
      state.showBase = document.getElementById("adm-show-base").checked;
      render();
    }

    function handleFileUpload(e) {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      if (f.name.endsWith(".csv")) {
        reader.onload = ev => { allRows = parseSheet(Papa.parse(ev.target.result, {skipEmptyLines:true}).data); render(); };
        reader.readAsText(f);
      } else {
        reader.onload = ev => {
          const wb = XLSX.read(ev.target.result, {type:"array"});
          const ws = wb.Sheets[wb.SheetNames[0]];
          allRows = parseSheet(XLSX.utils.sheet_to_json(ws, {header:1}));
          render();
        };
        reader.readAsArrayBuffer(f);
      }
    }

    async function syncLiveSheet() {
      try {
        const res = await fetch(SHEET_URL);
        const txt = await res.text();
        allRows = parseSheet(Papa.parse(txt, {skipEmptyLines:true}).data);
      } catch {
        allRows = parseSheet(Papa.parse(FALLBACK_CSV, {skipEmptyLines:true}).data);
      }
      render();
    }

    syncLiveSheet();
  </script>
</body>
</html>`;
}
