import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import { CurrencyOptions } from '@/types';

export type DBSeedCategoryKeyTypes =
  | 'Transport'
  | 'Family'
  | 'Rent'
  | 'Groceries'
  | 'Utilities'
  | 'Travel'
  | 'Health'
  | 'Entertainment'
  | 'Savings'
  | 'Education';

/**
 * Generates realistic budget data with random future dates
 * @param {Object} options - Options for customizing the generated budget
 * @param {string} options.currency - Currency code (default: 'NGN')
 * @param {number} options.minSources - Minimum number of budget sources (default: 1)
 * @param {number} options.maxSources - Maximum number of budget sources (default: 4)
 * @param {number} options.minCategories - Minimum number of categories (default: 3)
 * @param {number} options.maxCategories - Maximum number of categories (default: 8)
 * @returns {Object} A budget data object
 */
function generateBudgetData(
  options: Partial<{
    currency: CurrencyOptions;
    minSources: number;
    maxSources: number;
    minCategories: number;
    maxCategories: number;
    year: number;
    month: number;
  }> = {}
): object {
  const {
    currency = CurrencyOptions.NGN,
    minSources = 2,
    maxSources = 5,
    minCategories = 3,
    maxCategories = 8,
    year,
    month,
  } = options;

  // Generate a random future date (between 20 and 30 years in the future)
  const currentDate = dayjs();
  const futureDate = dayjs(currentDate.add(faker.number.int({ min: 50, max: 70 }), 'year'));

  // Common income sources for realistic data
  const commonIncomeSources = [
    'Salary',
    'Freelance',
    'Consulting',
    'Investments',
    'Side Business',
    'Rental Income',
    'Dividends',
    'Contract Work',
    'Commission',
    'Royalties',
    'Bonus',
  ];

  // Common expense categories for realistic data
  const commonCategories = [
    'Transport',
    'Family',
    'Rent',
    'Groceries',
    'Utilities',
    'Travel',
    'Health',
    'Entertainment',
    'Savings',
    'Education',
  ] as const;

  // Generate random budget sources
  const numSources = faker.number.int({ min: minSources, max: maxSources });

  const budgetSources = Array.from({ length: numSources }, () => {
    const sourceName = faker.helpers.arrayElement(commonIncomeSources);
    const frequency = faker.helpers.arrayElement(['monthly', 'one-time']);

    // Generate realistic amount based on the source and currency
    let amount;
    if (currency === 'NGN') {
      // Nigerian Naira - higher nominal values
      amount = faker.number.int({ min: 50000, max: 1000000 });
      // Round to nearest thousand
      amount = Math.round(amount / 1000) * 1000;
    } else if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
      // Western currencies - lower nominal values
      amount = faker.number.int({ min: 1000, max: 15000 });
      // Round to nearest hundred
      amount = Math.round(amount / 100) * 100;
    } else {
      // Default case
      amount = faker.number.int({ min: 5000, max: 50000 });
    }

    // Generate realistic descriptions based on the source
    let description;
    switch (sourceName) {
      case 'Salary':
        description = faker.helpers.arrayElement([
          'Monthly salary',
          'Base compensation',
          `Salary from ${faker.company.name()}`,
          'Regular income',
        ]);

        break;

      case 'Freelance':
        description = faker.helpers.arrayElement([
          `${faker.word.adjective()} project payment`,
          `${faker.company.buzzNoun()} development`,
          `${faker.company.name()} gig`,
          'Contract work',
        ]);

        break;

      case 'Investments':
        description = faker.helpers.arrayElement([
          'Stock dividends',
          'Investment returns',
          'Portfolio income',
          `${faker.finance.transactionType()} earnings`,
        ]);

        break;

      default:
        description = `Income from ${sourceName.toLowerCase()} work`;
    }

    return {
      name: sourceName,
      amount,
      description,
      frequency,
    };
  });

  // Generate random expense categories
  const numCategories = faker.number.int({ min: minCategories, max: maxCategories });

  // Select unique categories
  const selectedCategories = faker.helpers.arrayElements(commonCategories, numCategories);

  // Calculate total income (focusing on monthly equivalent)
  const totalMonthlyIncome = budgetSources.reduce((total, source) => {
    let monthlyEquivalent = source.amount;

    // Convert different frequencies to monthly equivalent
    switch (source.frequency) {
      case 'monthly':
        break;
      case 'one-time':
        monthlyEquivalent /= 6;
        break;
    }

    return total + monthlyEquivalent;
  }, 0);

  // Allocate budget across categories
  const totalBudgetPercentage = 0.7; // Use 70% of income for budgeting
  const totalBudget = totalMonthlyIncome * totalBudgetPercentage;

  // Create categories with realistic allocations
  const categories = selectedCategories.map((categoryName) => {
    // Generate a weight for allocation
    const weight = faker.number.float({ min: 0.5, max: 3, fractionDigits: 1 });
    return { name: categoryName, weight };
  });

  // Calculate total weight
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);

  // Assign budget amounts based on weights
  const budgetCategories = categories.map((category) => {
    // Calculate proportional budget amount
    let amountBudgeted = Math.round((category.weight / totalWeight) * totalBudget);

    // Round to appropriate denomination based on currency
    if (currency === CurrencyOptions.NGN) {
      amountBudgeted = Math.round(amountBudgeted / 500) * 10000; // Round to nearest 500 Naira
    } else {
      amountBudgeted = Math.round(amountBudgeted / 10) * 1000; // Round to nearest 10 dollar/euro/etc.
    }

    return {
      name: category.name,
      amountBudgeted,
    };
  });

  return {
    currency,
    year: year ?? futureDate.year(),
    month: month ?? futureDate.month(),
    budgetSources,
    categories: budgetCategories,
  };
}

export default generateBudgetData;
