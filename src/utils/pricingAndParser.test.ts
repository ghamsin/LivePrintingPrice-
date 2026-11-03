import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFinalPrice,
  calculateUnitPrice,
  calculateNetProfit,
  isWasmEngineReady,
  runWasmPricingBenchmark,
} from './wasmPricingEngine';
import {
  parsePrintSheetCsv,
  extractQuantityFromProductName,
  normalizeSidesValue,
  extractSizeDimensions,
} from './sheetParser';
import { FALLBACK_SHEET_CSV } from '../data/fallbackCsv';

test('Rust/WebAssembly binary instantiates natively and is ready', () => {
  assert.equal(isWasmEngineReady(), true);
});

test('Dynamic Pricing Engine & Upward Rounding (Ceiling) matches prompt specification', () => {
  // Prompt example: 1,503,700 * 1.30 = 1,954,810 -> rounds UP to 1,955,000
  assert.equal(calculateFinalPrice(1503700, 30, 1000), 1955000);

  // Exact multiple should not over-round due to IEEE-754 float drift:
  // 2,530,000 * 1.30 = 3,289,000 -> remains 3,289,000
  assert.equal(calculateFinalPrice(2530000, 30, 1000), 3289000);

  // Upward rounding steps: 5,000 / 10,000 / 50,000
  // 1,954,810 rounded up to 5,000 -> 1,955,000
  assert.equal(calculateFinalPrice(1503700, 30, 5000), 1955000);
  // 1,954,810 rounded up to 10,000 -> 1,960,000
  assert.equal(calculateFinalPrice(1503700, 30, 10000), 1960000);
  // 1,954,810 rounded up to 50,000 -> 2,000,000
  assert.equal(calculateFinalPrice(1503700, 30, 50000), 2000000);

  // 0% margin returns base cost rounded up to step
  assert.equal(calculateFinalPrice(1503700, 0, 1000), 1504000);
});

test('Unit price and net profit calculations via WASM', () => {
  assert.equal(calculateUnitPrice(1955000, 1000), 1955);
  assert.equal(calculateUnitPrice(3505000, 500), 7010);
  assert.equal(calculateNetProfit(1955000, 1503700), 451300);
});

test('WASM pricing benchmark runs and returns valid throughput', () => {
  const result = runWasmPricingBenchmark(10000);
  assert.equal(result.isNativeWasm, true);
  assert.equal(result.iterations, 10000);
  assert.ok(result.opsPerSec > 0);
});

test('Stateful Forward-Fill Parser parses all 5 categories and handles merged cells', () => {
  const rows = parsePrintSheetCsv(FALLBACK_SHEET_CSV);
  assert.ok(rows.length > 180, `Expected > 180 rows, got ${rows.length}`);

  const categories = new Set(rows.map((r) => r.category));
  assert.deepEqual(
    Array.from(categories),
    ['جنس معمولی', 'فانتزی', 'pvc', 'فرم عمومی', 'پاکت']
  );

  // Rule 2: Check forward-fill on "گلاسه یووی" (Row 1 is یکرو, Row 2 is دورو with empty name/size/qty)
  const glossyUvRows = rows.filter(
    (r) => r.category === 'جنس معمولی' && r.productName === 'گلاسه یووی'
  );
  assert.equal(glossyUvRows.length, 2);
  assert.equal(glossyUvRows[0].sides, 'یک رو');
  assert.equal(glossyUvRows[0].size, '85*48');
  assert.equal(glossyUvRows[0].quantity, 1000);
  assert.equal(glossyUvRows[0].baseCost, 1503700);

  assert.equal(glossyUvRows[1].sides, 'دو رو');
  assert.equal(glossyUvRows[1].size, '85*48');
  assert.equal(glossyUvRows[1].quantity, 1000);
  assert.equal(glossyUvRows[1].baseCost, 1930500);
});

test('Rule 4: Missing Name Fix renames 60*60 under "لمینت برجسته مخملی" to "لمینت برجسته مخملی مربع"', () => {
  const rows = parsePrintSheetCsv(FALLBACK_SHEET_CSV);
  const velvetSquare = rows.find(
    (r) => r.category === 'فانتزی' && r.productName === 'لمینت برجسته مخملی مربع'
  );
  assert.ok(velvetSquare, 'Expected to find "لمینت برجسته مخملی مربع" in فانتزی');
  assert.equal(velvetSquare.size, '60*60');
  assert.equal(velvetSquare.quantity, 1000);
  assert.equal(velvetSquare.baseCost, 4506700);
  assert.equal(calculateFinalPrice(velvetSquare.baseCost, 30, 1000), 5859000);
});

test('Rule 3: Envelope ("پاکت") quantity extraction via Regex when col[6] is empty', () => {
  const rows = parsePrintSheetCsv(FALLBACK_SHEET_CSV);
  const envelopes = rows.filter((r) => r.category === 'پاکت');
  assert.ok(envelopes.length >= 30);

  const env1000 = envelopes.find((r) => r.productName.includes('1000'));
  const env2000 = envelopes.find((r) => r.productName.includes('2000'));
  const env5000 = envelopes.find((r) => r.productName.includes('5000'));

  assert.equal(env1000?.quantity, 1000);
  assert.equal(env2000?.quantity, 2000);
  assert.equal(env5000?.quantity, 5000);
  assert.equal(extractQuantityFromProductName('پاکت تحریر 80 گرم 2000 عددی'), 2000);
});

test('Sides normalization and Visual Cut & Aspect Ratio detection', () => {
  assert.equal(normalizeSidesValue('یکرو'), 'یک رو');
  assert.equal(normalizeSidesValue('یک رو'), 'یک رو');
  assert.equal(normalizeSidesValue('دورو'), 'دو رو');
  assert.equal(normalizeSidesValue('دو رو'), 'دو رو');

  const roundedDim = extractSizeDimensions('90*60', 'لمینت براق دورگرد 1000 عددی');
  assert.equal(roundedDim.widthMm, 90);
  assert.equal(roundedDim.heightMm, 60);
  assert.equal(roundedDim.isRoundedCorner, true);

  const squareDim = extractSizeDimensions('60*60', 'لمینت برجسته مخملی مربع');
  assert.equal(squareDim.widthMm, 60);
  assert.equal(squareDim.heightMm, 60);
  assert.equal(squareDim.isRoundedCorner, false);
});

import {
  hashAdminPassword,
  verifyAdminPassword,
  validatePasswordChange,
  DEFAULT_ADMIN_PASSWORD_HASH,
} from './security';

test('Admin panel salted password hashing and password change validation', () => {
  // Default hash matches '1234' and does not store plaintext
  assert.equal(DEFAULT_ADMIN_PASSWORD_HASH.length, 64);
  assert.equal(verifyAdminPassword('1234', DEFAULT_ADMIN_PASSWORD_HASH), true);
  assert.equal(verifyAdminPassword('9999', DEFAULT_ADMIN_PASSWORD_HASH), false);

  // Wrong current password fails
  const wrongCurrent = validatePasswordChange('0000', 'Almas2026!', 'Almas2026!', DEFAULT_ADMIN_PASSWORD_HASH);
  assert.equal(wrongCurrent.valid, false);

  // Mismatched confirmation fails
  const mismatch = validatePasswordChange('1234', 'Almas2026!', 'Almas2027!', DEFAULT_ADMIN_PASSWORD_HASH);
  assert.equal(mismatch.valid, false);

  // Valid password change produces a new salted hash and verifies cleanly
  const validChange = validatePasswordChange('1234', 'Almas2026!', 'Almas2026!', DEFAULT_ADMIN_PASSWORD_HASH);
  assert.equal(validChange.valid, true);
  assert.ok(validChange.nextHash);
  assert.notEqual(validChange.nextHash, DEFAULT_ADMIN_PASSWORD_HASH);
  assert.equal(verifyAdminPassword('Almas2026!', validChange.nextHash), true);
  assert.equal(verifyAdminPassword('1234', validChange.nextHash), false);
});

