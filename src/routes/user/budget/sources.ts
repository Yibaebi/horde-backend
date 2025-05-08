import { Router } from 'express';
import _ from 'lodash';

import {
  validateRequestParams,
  validateRequestBody,
  validateRequestID,
} from '@/middlewares/validate-request';

import { validateBudgetById } from '@/services/user';
import { BadRequestError } from '@/config/error';
import { formatSuccessResponse } from '@/utils/response';
import { isSameText } from '@/utils/helpers';
import { budgetISSchema, editBudgetISSchema, editBudgetISParamsSchema } from '@/schemas/user';
import IncomeSource from '@/models/income-source';
import type { IBudgetIncomeSourceDocument } from '@/types';

const userBudgetISourcesRouter = Router();

// Add Income Source
userBudgetISourcesRouter.post(
  '/:id/source',
  validateRequestID,
  validateRequestBody(budgetISSchema),
  async (req, res) => {
    const budgetId = req.params.id;
    const newIncomeSources = budgetISSchema.parse(req.body);

    const budget = await validateBudgetById(budgetId);
    const { budgetSources } = budget;

    const existingSourcesWithSimilarName = _.intersectionWith(
      budgetSources,
      newIncomeSources,
      (eSource, newSource) => isSameText(eSource.name, newSource.name)
    );

    if (existingSourcesWithSimilarName.length > 0) {
      throw new BadRequestError('Found income source(s) with existing names.', {
        count: existingSourcesWithSimilarName.length,
        incomeSources: existingSourcesWithSimilarName,
      });
    }

    // Create income source documents from new list
    const newBudgetSourceDocs = newIncomeSources.map((bDoc) => new IncomeSource(bDoc));
    budget.budgetSources = [...budgetSources, ...newBudgetSourceDocs];

    await budget.save();

    res.send(
      formatSuccessResponse({
        message: 'Sources added successfully.',
        data: newBudgetSourceDocs,
      })
    );
  }
);

// Update income source
userBudgetISourcesRouter.put(
  '/:id/source/:sourceId',
  validateRequestParams(editBudgetISParamsSchema),
  validateRequestBody(editBudgetISSchema),
  async (req, res) => {
    const budgetId = req.params.id;
    const sourceId = req.params.sourceId;
    const sourceData = editBudgetISSchema.parse(req.body);

    const budget = await validateBudgetById(budgetId);
    const source = budget.validateSource(sourceId);

    const [sourceIndex, updatedSource] = budget.doExistingNameCheckInListAndUpdate({
      listKey: 'budgetSources',
      docId: sourceId,
      oldDoc: source,
      propsToUpdate: sourceData,
    });

    budget.budgetSources[sourceIndex] = updatedSource as IBudgetIncomeSourceDocument;
    await budget.save();

    res.send(
      formatSuccessResponse({
        message: 'Source updated successfully.',
        data: updatedSource,
      })
    );
  }
);

// Delete an income source
userBudgetISourcesRouter.delete(
  '/:id/source/:sourceId',
  validateRequestParams(editBudgetISParamsSchema),
  async (req, res) => {
    const budgetId = req.params.id;
    const sourceId = req.params.sourceId;

    const budget = await validateBudgetById(budgetId);
    const source = budget.validateSource(sourceId);

    budget.deleteIncomeSource(sourceId);

    await budget.save();

    res.send(
      formatSuccessResponse({
        message: 'Source deleted successfully.',
        data: source,
      })
    );
  }
);

export default userBudgetISourcesRouter;
