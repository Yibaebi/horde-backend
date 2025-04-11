import { CurrencyOptions } from '@/types/models';
import currencySymbols from '@/constants/currency-symbols';

/**
 * Returns the symbol associated with a given currency code.
 *
 * @param {CurrencyOptions} currency - The currency code (e.g., 'USD', 'NGN').
 * @returns {string} The currency symbol (e.g., '$', '₦').
 */
export const getCurrencySymbol = (currency: CurrencyOptions): string => currencySymbols[currency];
