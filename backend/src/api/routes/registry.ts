import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { RegistryModel } from '../../models/Registry.js';
import { DrugModel } from '../../models/Drug.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

export const registryRouter = Router();

registryRouter.use(authenticate);

registryRouter.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 'default-user';
    const entries = await RegistryModel.findByUser(userId);
    res.json(entries);
  })
);

registryRouter.get(
  '/check/:drugId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 'default-user';
    const entry = await RegistryModel.findByUserAndDrug(userId, req.params.drugId);
    res.json({ inRegistry: !!entry, entry });
  })
);

registryRouter.post(
  '/',
  body('drugId').isUUID(),
  body('notes').optional().isString(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const userId = req.user?.id || 'default-user';
    const { drugId, notes } = req.body;

    const drug = await DrugModel.findById(drugId);
    if (!drug) {
      throw new AppError(404, 'Drug not found');
    }

    const entry = await RegistryModel.add(userId, drugId, notes);
    res.status(201).json(entry);
  })
);

registryRouter.delete(
  '/:drugId',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || 'default-user';
    const removed = await RegistryModel.remove(userId, req.params.drugId);

    if (!removed) {
      throw new AppError(404, 'Registry entry not found');
    }

    res.json({ success: true });
  })
);

registryRouter.patch(
  '/:drugId',
  body('notes').isString(),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const userId = req.user?.id || 'default-user';
    const entry = await RegistryModel.updateNotes(userId, req.params.drugId, req.body.notes);

    if (!entry) {
      throw new AppError(404, 'Registry entry not found');
    }

    res.json(entry);
  })
);
