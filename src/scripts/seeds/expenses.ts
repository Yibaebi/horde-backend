import { z } from 'zod';
import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';
import { createExpenseSchema } from '@/schemas/user/expense';

// Categories data
const categories = [
  {
    _id: '680512f2285a27d8d133233a',
    name: 'Transport' as const,
  },
  {
    _id: '68052e7d337c7490196db35a',
    name: 'Family' as const,
  },
  {
    _id: '68056e4f1f42d706470912aa',
    name: 'Rent' as const,
  },
  {
    _id: '68056e4f1f42d706470912ab',
    name: 'Groceries' as const,
  },
  {
    _id: '68056e4f1f42d706470912ac',
    name: 'Utilities' as const,
  },
  {
    _id: '68056e4f1f42d706470912ad',
    name: 'Travel' as const,
  },
  {
    _id: '68056e4f1f42d706470912ae',
    name: 'Health' as const,
  },
  {
    _id: '68056e4f1f42d706470912af',
    name: 'Entertainment' as const,
  },
  {
    _id: '68056e4f1f42d706470912b0',
    name: 'Savings' as const,
  },
  {
    _id: '68056e4f1f42d706470912b1',
    name: 'Education' as const,
  },
];

const budgetId = '68041b5dc44728267c140aa6';

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
};

// Amount ranges for each category (in cents)
const amountRanges = {
  Transport: { min: 1000, max: 25000 },
  Family: { min: 2000, max: 30000 },
  Rent: { min: 75000, max: 95000 },
  Groceries: { min: 2000, max: 15000 },
  Utilities: { min: 5000, max: 20000 },
  Travel: { min: 10000, max: 80000 },
  Health: { min: 2000, max: 25000 },
  Entertainment: { min: 1000, max: 15000 },
  Savings: { min: 5000, max: 20000 },
  Education: { min: 5000, max: 30000 },
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
function generateExpenses() {
  const expenses: z.infer<typeof createExpenseSchema>[] = [];

  categories.forEach((category) => {
    const numTransactions = faker.number.int({ min: 15, max: 40 });

    for (let i = 0; i < numTransactions; i++) {
      const templates = descriptionTemplates[category.name];
      const template = faker.helpers.arrayElement(templates);
      const amountRange = amountRanges[category.name];

      const expense = {
        amount: faker.number.int({ min: amountRange.min, max: amountRange.max }),
        description: fillTemplate(template),
        expenseDate: dayjs(
          faker.date
            .between({ from: '2025-01-01T00:00:00Z', to: '2025-04-20T23:59:59Z' })
            .toISOString()
        ).toDate(),
        budget: budgetId,
        category: category._id,
      };

      expenses.push(expense);
    }
  });

  return expenses;
}

export default generateExpenses;
