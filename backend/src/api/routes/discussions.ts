import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { DiscussionModel } from '../../models/Discussion.js';
import { DrugModel } from '../../models/Drug.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

export const discussionsRouter = Router();

discussionsRouter.use(authenticate);

discussionsRouter.get(
  '/drug/:drugId',
  asyncHandler(async (req, res) => {
    const drug = await DrugModel.findById(req.params.drugId);
    if (!drug) {
      throw new AppError(404, 'Drug not found');
    }

    const discussions = await DiscussionModel.findByDrug(req.params.drugId);
    res.json(discussions);
  })
);

discussionsRouter.post(
  '/',
  body('drug_id').isUUID(),
  body('content').isString().notEmpty(),
  body('parent_id').optional().isUUID(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const drug = await DrugModel.findById(req.body.drug_id);
    if (!drug) {
      throw new AppError(404, 'Drug not found');
    }

    if (req.body.parent_id) {
      const parent = await DiscussionModel.findById(req.body.parent_id);
      if (!parent || parent.drug_id !== req.body.drug_id) {
        throw new AppError(400, 'Invalid parent discussion');
      }
    }

    const discussion = await DiscussionModel.create({
      drug_id: req.body.drug_id,
      user_id: req.user!.id,
      content: req.body.content,
      parent_id: req.body.parent_id,
    });

    res.status(201).json(discussion);
  })
);

discussionsRouter.patch(
  '/:id',
  body('content').isString().notEmpty(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const discussion = await DiscussionModel.update(
      req.params.id,
      req.user!.id,
      req.body.content
    );

    if (!discussion) {
      throw new AppError(404, 'Discussion not found or not authorized');
    }

    res.json(discussion);
  })
);

discussionsRouter.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const isAdmin = req.user!.role === 'ADMIN';
    const deleted = await DiscussionModel.delete(req.params.id, req.user!.id, isAdmin);

    if (!deleted) {
      throw new AppError(404, 'Discussion not found or not authorized');
    }

    res.status(204).send();
  })
);
