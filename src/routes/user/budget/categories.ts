import { Router } from 'express';
import _ from 'lodash';

import {
  validateRequesParams,
  validateRequestBody,
  validateRequestID,
} from '@/middlewares/validate-request';

import {
  budgetCategoriesSchema,
  editBudgetCatSchema,
  editBudgetCatSchemaParams,
} from '@/schemas/user';

import { constructBudgetCatKey, isSameText } from '@/utils/helpers';
import { validateBudgetById } from '@/services/user';
import { BadRequestError } from '@/config/error';
import { formatSuccessResponse } from '@/utils/response';
import ExpenseModel from '@/models/expense';
import Category from '@/models/category';
import type { IBudgetCategoryDocument } from '@/types';

const userBudgetCategoryRouter = Router();

// Add Category
userBudgetCategoryRouter.post(
  '/:id/category',
  validateRequestID,
  validateRequestBody(budgetCategoriesSchema),
  async (req, res) => {
    const budgetId = req.params.id;
    const newCategories = budgetCategoriesSchema.parse(req.body);

    const budget = await validateBudgetById(budgetId);
    const categories = budget.categories;

    const catIntersectionByName = _.intersectionWith(categories, newCategories, (eCat, newcat) =>
      isSameText(eCat.name, newcat.name)
    );

    if (catIntersectionByName.length > 0) {
      throw new BadRequestError('Found categories(s) with existing names.', {
        count: catIntersectionByName.length,
        categories: catIntersectionByName,
      });
    }

    // Create category documents from new list
    const newCategoriesDocs = newCategories.map(
      (cDoc) =>
        new Category({
          ...cDoc,
          key: constructBudgetCatKey(budget.year, budget.month, cDoc.name),
        })
    ) as unknown as IBudgetCategoryDocument[];

    budget.categories = [...categories, ...newCategoriesDocs];

    await budget.save();

    res.send(
      formatSuccessResponse({
        message: 'Categories added successfully.',
        data: newCategoriesDocs,
      })
    );
  }
);

// Update Category
userBudgetCategoryRouter.put(
  '/:id/category/:catId',
  validateRequesParams(editBudgetCatSchemaParams),
  validateRequestBody(editBudgetCatSchema),
  async (req, res) => {
    const budgetId = req.params.id;
    const catId = req.params.catId;
    const catUpdateProps = editBudgetCatSchema.parse(req.body);

    const budget = await validateBudgetById(budgetId);
    const category = budget.validateCategory(catId);

    const [catIndex, updatedCat] = budget.doExistingNameCheckInListAndUpdate({
      listKey: 'categories',
      docId: catId,
      oldDoc: category,
      propsToUpdate: {
        ...catUpdateProps,
        ...(catUpdateProps.name
          ? { key: constructBudgetCatKey(budget.year, budget.month, catUpdateProps.name) }
          : {}),
      },
    });

    budget.categories[catIndex] = updatedCat as IBudgetCategoryDocument;
    await budget.save();

    res.send(
      formatSuccessResponse({
        message: 'Category updated successfully.',
        data: updatedCat,
      })
    );
  }
);

// Delete a Category
userBudgetCategoryRouter.delete(
  '/:id/category/:catId',
  validateRequesParams(editBudgetCatSchemaParams),
  async (req, res) => {
    const budgetId = req.params.id;
    const catId = req.params.catId;

    const budget = await validateBudgetById(budgetId);
    const category = budget.validateCategory(catId);

    budget.deleteCategory(catId);

    // Add remove all related expenses
    await ExpenseModel.deleteMany({ category: catId });
    await budget.save();

    res.send(
      formatSuccessResponse({
        message: 'Category deleted successfully.',
        data: category,
      })
    );
  }
);

export default userBudgetCategoryRouter;
