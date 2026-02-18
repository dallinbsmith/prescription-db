import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { StateRegulationModel } from '../../models/StateRegulation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

export const stateRegulationsRouter = Router();

stateRegulationsRouter.use(authenticate);

stateRegulationsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const regulations = await StateRegulationModel.findAll();
    res.json(regulations);
  })
);

stateRegulationsRouter.get(
  '/states',
  asyncHandler(async (_req, res) => {
    const states = await StateRegulationModel.getDistinctStates();
    res.json(states);
  })
);

stateRegulationsRouter.get(
  '/state/:stateCode',
  asyncHandler(async (req, res) => {
    const regulations = await StateRegulationModel.findByState(req.params.stateCode.toUpperCase());
    res.json(regulations);
  })
);

stateRegulationsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const regulation = await StateRegulationModel.findById(req.params.id);
    if (!regulation) {
      throw new AppError(404, 'Regulation not found');
    }
    res.json(regulation);
  })
);

stateRegulationsRouter.post(
  '/',
  requireAdmin,
  body('state_code').isString().isLength({ min: 2, max: 2 }),
  body('regulation_type').isString().notEmpty(),
  body('applies_to').isString().notEmpty(),
  body('description').optional().isString(),
  body('source_url').optional().isURL(),
  body('notes').optional().isString(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const regulation = await StateRegulationModel.create({
      state_code: req.body.state_code.toUpperCase(),
      regulation_type: req.body.regulation_type,
      applies_to: req.body.applies_to,
      description: req.body.description,
      source_url: req.body.source_url,
      notes: req.body.notes,
    });

    res.status(201).json(regulation);
  })
);

stateRegulationsRouter.patch(
  '/:id',
  requireAdmin,
  body('state_code').optional().isString().isLength({ min: 2, max: 2 }),
  body('regulation_type').optional().isString().notEmpty(),
  body('applies_to').optional().isString().notEmpty(),
  body('description').optional().isString(),
  body('source_url').optional().isURL(),
  body('notes').optional().isString(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const updates = { ...req.body };
    if (updates.state_code) {
      updates.state_code = updates.state_code.toUpperCase();
    }

    const regulation = await StateRegulationModel.update(req.params.id, updates);
    if (!regulation) {
      throw new AppError(404, 'Regulation not found');
    }
    res.json(regulation);
  })
);

stateRegulationsRouter.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await StateRegulationModel.delete(req.params.id);
    if (!deleted) {
      throw new AppError(404, 'Regulation not found');
    }
    res.status(204).send();
  })
);
