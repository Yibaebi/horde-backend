import { z } from 'zod';
import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';

import { createExpenseSchema } from '@/schemas/user/expense';
import { IBudgetCategoryDocument } from '@/types';
import { DBSeedCategoryKeyTypes } from './budget';

type DBSeedFormattedCategories = { _id: string; name: DBSeedCategoryKeyTypes };

/**
 * Transforms category data from a detailed structure to a simplified format
 *
 * @param {Array<IBudgetCategoryProps>} categories - Array of category objects with detailed information
 * @returns {Array<FormattedCategories>} Array of simplified category objects with only _id and name
 */
export function transformCategories(
  categories: IBudgetCategoryDocument[]
): Array<DBSeedFormattedCategories> {
  return categories.map((category) => ({
    _id: category._id.toString(),
    name: `${category.name}` as DBSeedCategoryKeyTypes,
  }));
}

// Description templates for each category
const descriptionTemplates = {
  Transport: [
    'Uber ride to {destination}',
    'Taxi fare to {destination}',
    'Monthly transit pass',
    'Car fuel refill',
    'Parking fee at {location}',
    'Car maintenance - {service}',
    'Train ticket to {destination}',
    'Bus fare',
  ],
  Family: [
    'Toys for kids',
    'Babysitter payment',
    'Family dinner at {restaurant}',
    "Children's clothing",
    'Family movie night',
    'Birthday gift for {familyMember}',
    'Family outing to {location}',
    'School supplies for kids',
  ],
  Rent: [
    'Monthly rent payment',
    'Rental deposit',
    'Apartment maintenance fee',
    'Property tax',
    'Rental insurance premium',
    'Extra utility fee',
    'Late payment fee',
    'Security deposit',
  ],
  Groceries: [
    'Weekly grocery shopping at {store}',
    'Fresh produce from farmers market',
    'Bulk food purchase',
    'Specialty ingredients from {store}',
    'Household supplies',
    'Pantry restocking',
    'Quick grocery run for {items}',
    'Online grocery delivery',
  ],
  Utilities: [
    'Electricity bill',
    'Water bill',
    'Internet service payment',
    'Gas bill',
    'Phone bill',
    'Cable TV subscription',
    'Garbage disposal fee',
    'Sewage service bill',
  ],
  Travel: [
    'Flight to {destination}',
    'Hotel stay in {location}',
    'Travel insurance',
    'Car rental in {location}',
    'Vacation activities in {location}',
    'Resort booking',
    'Cruise payment',
    'Tour guide fee in {location}',
  ],
  Health: [
    "Doctor's appointment",
    'Prescription medication',
    'Health insurance premium',
    'Gym membership fee',
    'Dental checkup',
    'Eye examination',
    'Therapy session',
    'Vitamins and supplements',
  ],
  Entertainment: [
    'Movie tickets',
    'Concert tickets for {artist}',
    'Streaming service subscription',
    'Video game purchase',
    'Theme park tickets',
    'Book purchase',
    'Music streaming subscription',
    'Hobby supplies',
  ],
  Savings: [
    'Monthly savings deposit',
    'Emergency fund contribution',
    'Investment account deposit',
    'Retirement fund contribution',
    'Certificate of deposit',
    'Treasury bond purchase',
    'Stock market investment',
    "Children's education fund",
  ],
  Education: [
    'Tuition payment',
    'Textbook purchase',
    'Online course subscription',
    'School fee',
    'Language learning app subscription',
    'Professional certification cost',
    'Workshop registration fee',
    'Educational supplies',
  ],
  Other: [
    'Miscellaneous',
    'Donation',
    'Charity',
    'Gift',
    'Other',
    'Unknown',
    'Refund',
    'Credit Card Payment',
    'Bank Transfer',
    'Cash',
    'Check',
    'Credit',
    'Debit',
  ],
};

// Helper function to fill in template variables
function fillTemplate(template: string) {
  let filledTemplate = template;

  if (template.includes('{destination}')) {
    filledTemplate = filledTemplate.replace('{destination}', faker.location.city());
  }

  if (template.includes('{location}')) {
    filledTemplate = filledTemplate.replace('{location}', faker.location.streetAddress());
  }

  if (template.includes('{restaurant}')) {
    filledTemplate = filledTemplate.replace('{restaurant}', faker.company.name() + ' Restaurant');
  }

  if (template.includes('{familyMember}')) {
    filledTemplate = filledTemplate.replace('{familyMember}', faker.person.firstName());
  }

  if (template.includes('{store}')) {
    filledTemplate = filledTemplate.replace('{store}', faker.company.name());
  }

  if (template.includes('{items}')) {
    filledTemplate = filledTemplate.replace('{items}', faker.commerce.product());
  }

  if (template.includes('{service}')) {
    filledTemplate = filledTemplate.replace('{service}', faker.commerce.productName());
  }

  if (template.includes('{artist}')) {
    filledTemplate = filledTemplate.replace('{artist}', faker.person.fullName());
  }

  return filledTemplate;
}

// Generate random expenses for each category
function generateExpenses(
  userId: string,
  budgetId: string,
  year: number,
  month: number,
  categories: DBSeedFormattedCategories[]
) {
  const expenses: z.infer<typeof createExpenseSchema>[] = [];

  categories.forEach((category) => {
    const numTransactions = faker.number.int({ min: 15, max: 50 });

    for (let i = 0; i < numTransactions; i++) {
      const templates = descriptionTemplates[category.name] ?? descriptionTemplates.Other;
      const template = faker.helpers.arrayElement(templates);

      const minAmount = faker.number.int({ min: 10000, max: 100000 });
      const maxAmount = faker.number.int({ min: minAmount, max: minAmount + 100000 });
      const amount = faker.number.int({ min: minAmount, max: maxAmount });

      console.log(
        'amount',
        dayjs()
          .month(month)
          .year(year)
          .day(faker.number.int({ min: 1, max: 28 }))
          .toDate()
      );

      const expense = {
        amount,
        description: fillTemplate(template),
        expenseDate: dayjs()
          .month(month)
          .year(year)
          .day(faker.number.int({ min: 1, max: 28 }))
          .toDate(),
        user: userId,
        year,
        month,
        category: category._id,
        budget: budgetId,
      };

      expenses.push(expense);
    }
  });

  return expenses;
}

export default generateExpenses;
