import { model, Schema } from 'mongoose';
import dayjs from 'dayjs';
import _ from 'lodash';

import { getCurrencySymbol } from '@/utils/helpers';
import { CurrencyOptions, type IBudgetProps } from '@/types';
import { BadRequestError } from '@/config/error';

import type {
  IBudgetCategoryDocument,
  IBudgetDocument,
  IBudgetIncomeSourceDocument,
} from '@/types';

import { categorySchema } from './category';
import { incomeSourceSchema } from './income-source';

// Important list props in Budget Schema
type IBudgetListDocumentProps = IBudgetCategoryDocument | IBudgetIncomeSourceDocument;

// Budget Schema
const budgetSchema = new Schema<IBudgetProps>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currency: { type: String, default: CurrencyOptions.NGN },
    id: { type: String, select: false },
    year: {
      type: Number,
      required: true,
      default: () => dayjs().year(),
    },
    month: {
      type: Number,
      required: true,
      default: () => dayjs().month(),
    },
    currencySym: {
      type: String,
      default: getCurrencySymbol(CurrencyOptions.NGN),
    },
    categories: {
      type: [categorySchema],
      validate: {
        validator: function (array: IBudgetCategoryDocument[]) {
          return array && array.length > 0;
        },
        message: 'A budget must have at least one category',
      },
    },
    budgetSources: {
      type: [incomeSourceSchema],
      validate: {
        validator: function (array: IBudgetIncomeSourceDocument[]) {
          return array && array.length > 0;
        },
        message: 'A budget must have at least one income source',
      },
    },
  },
  { timestamps: true, toObject: { virtuals: true } }
);

// Computed budget props
budgetSchema.virtual('amountSpent').get(function () {
  return this.categories.reduce((total, cat) => total + cat.amountSpent, 0);
});

budgetSchema.virtual('budgetVariance').get(function () {
  return this.amountBudgeted - this.amountSpent;
});

budgetSchema.virtual('amountBudgeted').get(function () {
  return this.budgetSources.reduce((total, source) => total + source.amount, 0);
});

// Category methods
budgetSchema.method('findCategory', function (id: string) {
  return _.find(this.categories, (cat) => cat._id.toString() === id);
});

budgetSchema.method('deleteCategory', function (this: IBudgetDocument, id: string) {
  if (this.categories.length === 1) {
    throw new BadRequestError('You need atleast one atleast one category.');
  }

  this.categories = _.filter(this.categories, (cat) => cat._id.toString() !== id);
});

budgetSchema.method('validateCategory', function (this: IBudgetDocument, catId: string) {
  const category = this.findCategory(catId);

  if (!category) {
    throw new BadRequestError('No category found with specified ID.');
  }

  return category;
});

budgetSchema.method('refreshCategoryStats', async function () {
  const refreshPromises = this.categories.map((cat) => {
    return cat.recomputeExpensesStats();
  });

  await Promise.all(refreshPromises);
  await this.save();

  return this;
});

// Income source methods
budgetSchema.method('findIncomeSource', function (this: IBudgetDocument, id: string) {
  return _.find(this.budgetSources, (source) => source._id.toString() === id);
});

budgetSchema.method('deleteIncomeSource', function (this: IBudgetDocument, id: string) {
  if (this.budgetSources.length === 1) {
    throw new BadRequestError('You need atleast one atleast one source of income.');
  }

  this.budgetSources = _.filter(this.budgetSources, (source) => source._id.toString() !== id);
});

budgetSchema.method('validateSource', function (this: IBudgetDocument, sourceId: string) {
  const source = this.findIncomeSource(sourceId);

  if (!source) {
    throw new BadRequestError('No income source found with specified ID.');
  }

  return source;
});

budgetSchema.method(
  'doExistingNameCheckInListAndUpdate',
  function (
    this: IBudgetDocument,
    data: {
      listKey: 'categories' | 'budgetSources';
      docId: string;
      oldDoc: IBudgetListDocumentProps;
      propsToUpdate: { name?: string; key?: string };
    }
  ) {
    const { listKey, oldDoc, docId, propsToUpdate } = data;
    const list = this[listKey] as IBudgetListDocumentProps[];

    // Find the document to update
    const docIndex = _.findIndex(
      list,
      (item) => item.id === docId || item._id.toString() === docId
    );

    if (docIndex === -1) {
      throw new BadRequestError(`Document with ID ${docId} not found in ${listKey}`);
    }

    // Check if a similar name already exists
    if (propsToUpdate?.name) {
      const nameRegex = new RegExp(`^${_.escapeRegExp(propsToUpdate.name)}$`, 'i');

      const existingDoc = _.find(
        list,
        (item) => (item.id || item._id.toString()) !== docId && nameRegex.test(item.name || '')
      );

      if (existingDoc) {
        const entityType = listKey === 'categories' ? 'Category' : 'Budget source';

        throw new BadRequestError(
          `${entityType} with name - "${propsToUpdate.name}", already exists.`,
          { existingDoc }
        );
      }
    }

    // Create the updated document without modifying the original list
    const updatedDoc = _.merge(oldDoc, propsToUpdate, { updatedAt: dayjs().toISOString() });

    return [docIndex, updatedDoc];
  }
);

// Budget model
const Budget = model<IBudgetProps>('Budget', budgetSchema);

export default Budget;
