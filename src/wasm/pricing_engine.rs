//! Rust + WebAssembly Dynamic Print Cost & Upward Rounding Engine
//! Target: `wasm32-unknown-unknown`
//! Compile command:
//! `rustc --target wasm32-unknown-unknown -O --crate-type=cdylib pricing_engine.rs -o pricing_engine.wasm`

#![no_std]

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

/// Calculates the final customer price from `base_cost` (col[3]),
/// applying `profit_margin_percent` and strict upward ceiling rounding (`rounding_step`).
///
/// Formula:
/// `raw_price = (base_cost * (100.0 + profit_margin_percent)) / 100.0`
/// `final_price = ceil(raw_price / rounding_step) * rounding_step`
#[no_mangle]
pub extern "C" fn calc_final_price(
    base_cost: f64,
    profit_margin_percent: f64,
    rounding_step: f64,
) -> f64 {
    if base_cost <= 0.0 {
        return 0.0;
    }
    let step = if rounding_step <= 0.0 { 1000.0 } else { rounding_step };
    // Multiply by (100.0 + margin) then divide by 100.0 to avoid IEEE-754 binary fraction drift on 1.30
    let raw_price = (base_cost * (100.0 + profit_margin_percent)) / 100.0;
    // Subtract tiny epsilon (1e-7) before ceil to prevent float representation noise on exact multiples
    let scaled = (raw_price - 1e-7) / step;
    libm_ceil(scaled) * step
}

/// Calculates the unit price per single item/sheet (`final_price / quantity`), rounded to integer.
#[no_mangle]
pub extern "C" fn calc_unit_price(final_price: f64, quantity: f64) -> f64 {
    if quantity <= 0.0 || final_price <= 0.0 {
        return 0.0;
    }
    libm_ceil((final_price / quantity) - 1e-7)
}

/// Calculates net studio profit (`final_price - base_cost`).
#[no_mangle]
pub extern "C" fn calc_profit(final_price: f64, base_cost: f64) -> f64 {
    let diff = final_price - base_cost;
    if diff < 0.0 { 0.0 } else { diff }
}

#[inline(always)]
fn libm_ceil(x: f64) -> f64 {
    // Compiled directly to the WebAssembly `f64.ceil` (0x9b) instruction
    unsafe { core::intrinsics::ceilf64(x) }
}
