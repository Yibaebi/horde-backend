import { CurrencyOptions } from '@/types';

/**
 * Maps currency codes to their corresponding symbol representations.
 *
 * @example
 * // Get the symbol for USD
 * const usdSymbol = CurrencySymbols[CurrencyOptions.USD]; // Returns '$'
 *
 * @example
 * // Display a formatted price with the correct currency symbol
 * const formatPrice = (amount, currency) => `${CurrencySymbols[currency]}${amount}`;
 * formatPrice(10.99, CurrencyOptions.EUR); // Returns '€10.99'
 *
 * @type {Object.<CurrencyOptions, string>}
 */
export default {
  [CurrencyOptions.NGN]: '₦',
  [CurrencyOptions.USD]: '$',
  [CurrencyOptions.EUR]: '€',
  [CurrencyOptions.GBP]: '£',
};
