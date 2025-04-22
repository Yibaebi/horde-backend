import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

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

/**
 * Checks if two strings are equal, ignoring case and whitespace.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns True if equal, false otherwise.
 */
export const isSameText = (strA: string, strB: string): boolean =>
  strA.toLowerCase().trim() === strB.toLowerCase().trim();

/**
 * Get Budget category key
 *
 * @param year - Year of budget creation.
 * @param month - Month of budget Creation.
 * @param catName - Category name.
 * @returns True if equal, false otherwise.
 */
export const constructBudgetCatKey = (year: number, month: number, catName: string): string =>
  `${year}_${month}_${catName.split(' ').join(':')}`;

/**
 * Convert an string ID to a mongoose ObjectId type
 *
 * @param id - A valid string ID
 * @returns {mongoose.Types.ObjectId} A mongoose ObjectId type
 */
export const convertIdToObjectId = (id: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(id);
