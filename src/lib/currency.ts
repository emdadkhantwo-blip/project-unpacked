/**
 * Currency formatting utilities for BDT (Bangladeshi Taka)
 */

export const CURRENCY_SYMBOL = '৳';
export const CURRENCY_CODE = 'BDT';

/**
 * Format a number as BDT currency
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the ৳ symbol (default true)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
}

/**
 * Format currency with explicit decimals
 * @param amount - The amount to format
 * @returns Formatted currency string with 2 decimal places
 */
export function formatCurrencyExact(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}
