import { v4 as uuidv4 } from 'uuid';

import { CurrencyOptions } from '@/types';
import currencySymbols from '@/constants/currency-symbols';

/**
 * Returns the symbol associated with a given currency code.
 *
 * @param {CurrencyOptions} currency - The currency code (e.g., 'USD', 'NGN').
 * @returns {string} The currency symbol (e.g., '$', '₦').
 */
export const getCurrencySymbol = (currency: CurrencyOptions): string => currencySymbols[currency];

/**
 * Generates a random UUID (Universally Unique Identifier).
 *
 * @returns {string} A randomly generated UUID.
 */
export const generateRandomUUID = (): string => uuidv4();
