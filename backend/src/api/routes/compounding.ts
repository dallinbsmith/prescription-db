import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { BulkIngredientModel } from '../../models/BulkIngredient.js';
import { CompoundingFormulaModel } from '../../models/CompoundingFormula.js';
import { CompoundingRegulationModel } from '../../models/CompoundingRegulation.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

export const compoundingRouter = Router();

compoundingRouter.use(authenticate);

// Bulk Ingredients
compoundingRouter.get(
  '/ingredients',
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('offset').optional().isInt({ min: 0 }),
  asyncHandler(async (req, res) => {
    const result = await BulkIngredientModel.search({
      search: req.query.search as string | undefined,
      fda_bulk_list: req.query.fda_bulk_list as string | undefined,
      category: req.query.category as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    });
    res.json(result);
  })
);

compoundingRouter.get(
  '/ingredients/categories',
  asyncHandler(async (_req, res) => {
    const categories = await BulkIngredientModel.getCategories();
    res.json(categories);
  })
);

compoundingRouter.get(
  '/ingredients/:id',
  asyncHandler(async (req, res) => {
    const ingredient = await BulkIngredientModel.findById(req.params.id);
    if (!ingredient) {
      throw new AppError(404, 'Ingredient not found');
    }
    res.json(ingredient);
  })
);

compoundingRouter.post(
  '/ingredients',
  requireAdmin,
  body('name').isString().notEmpty(),
  body('cas_number').optional().isString(),
  body('usp_nf_status').isBoolean(),
  body('fda_bulk_list').isIn(['503A_POSITIVE', '503B_POSITIVE', 'NOT_LISTED', 'WITHDRAWN']),
  body('category').optional().isString(),
  body('storage_requirements').optional().isString(),
  body('notes').optional().isString(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const ingredient = await BulkIngredientModel.create(req.body);
    res.status(201).json(ingredient);
  })
);

compoundingRouter.patch(
  '/ingredients/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ingredient = await BulkIngredientModel.update(req.params.id, req.body);
    if (!ingredient) {
      throw new AppError(404, 'Ingredient not found');
    }
    res.json(ingredient);
  })
);

compoundingRouter.delete(
  '/ingredients/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await BulkIngredientModel.delete(req.params.id);
    if (!deleted) {
      throw new AppError(404, 'Ingredient not found');
    }
    res.status(204).send();
  })
);

// Formulas
compoundingRouter.get(
  '/formulas',
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('offset').optional().isInt({ min: 0 }),
  asyncHandler(async (req, res) => {
    const result = await CompoundingFormulaModel.search({
      search: req.query.search as string | undefined,
      formula_type: req.query.formula_type as string | undefined,
      status: req.query.status as string | undefined,
      species: req.query.species as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    });
    res.json(result);
  })
);

compoundingRouter.get(
  '/formulas/:id',
  asyncHandler(async (req, res) => {
    const formula = await CompoundingFormulaModel.findById(req.params.id);
    if (!formula) {
      throw new AppError(404, 'Formula not found');
    }
    res.json(formula);
  })
);

compoundingRouter.post(
  '/formulas',
  requireAdmin,
  body('name').isString().notEmpty(),
  body('drug_id').optional({ nullable: true }).isUUID(),
  body('dosage_form').optional().isString(),
  body('route').optional().isString(),
  body('species').isIn(['HUMAN', 'ANIMAL', 'BOTH']),
  body('beyond_use_date').optional().isString(),
  body('formula_type').isIn(['503A', '503B']),
  body('status').isIn(['DRAFT', 'APPROVED', 'DISCONTINUED']),
  body('notes').optional().isString(),
  body('ingredients').optional().isArray(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const { ingredients, ...formulaData } = req.body;
    const formula = await CompoundingFormulaModel.create(formulaData, ingredients);
    res.status(201).json(formula);
  })
);

compoundingRouter.patch(
  '/formulas/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const formula = await CompoundingFormulaModel.update(req.params.id, req.body);
    if (!formula) {
      throw new AppError(404, 'Formula not found');
    }
    res.json(formula);
  })
);

compoundingRouter.put(
  '/formulas/:id/ingredients',
  requireAdmin,
  body().isArray(),
  asyncHandler(async (req, res) => {
    const ingredients = await CompoundingFormulaModel.updateIngredients(req.params.id, req.body);
    res.json(ingredients);
  })
);

compoundingRouter.delete(
  '/formulas/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await CompoundingFormulaModel.delete(req.params.id);
    if (!deleted) {
      throw new AppError(404, 'Formula not found');
    }
    res.status(204).send();
  })
);

// Regulations
compoundingRouter.get(
  '/regulations',
  asyncHandler(async (_req, res) => {
    const regulations = await CompoundingRegulationModel.findAll();
    res.json(regulations);
  })
);

compoundingRouter.get(
  '/regulations/type/:type',
  asyncHandler(async (req, res) => {
    const regulations = await CompoundingRegulationModel.findByType(req.params.type);
    res.json(regulations);
  })
);

compoundingRouter.get(
  '/regulations/state/:stateCode',
  asyncHandler(async (req, res) => {
    const regulations = await CompoundingRegulationModel.findByState(req.params.stateCode.toUpperCase());
    res.json(regulations);
  })
);

compoundingRouter.get(
  '/regulations/:id',
  asyncHandler(async (req, res) => {
    const regulation = await CompoundingRegulationModel.findById(req.params.id);
    if (!regulation) {
      throw new AppError(404, 'Regulation not found');
    }
    res.json(regulation);
  })
);

compoundingRouter.post(
  '/regulations',
  requireAdmin,
  body('regulation_type').isIn(['503A', '503B', 'STATE', 'USP']),
  body('state_code').optional({ nullable: true }).isString().isLength({ min: 2, max: 2 }),
  body('title').isString().notEmpty(),
  body('description').optional().isString(),
  body('requirements').optional().isObject(),
  body('source_url').optional().isURL(),
  body('effective_date').optional().isISO8601(),
  body('notes').optional().isString(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const regulation = await CompoundingRegulationModel.create({
      ...req.body,
      state_code: req.body.state_code?.toUpperCase() || null,
    });
    res.status(201).json(regulation);
  })
);

compoundingRouter.patch(
  '/regulations/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    if (updates.state_code) {
      updates.state_code = updates.state_code.toUpperCase();
    }

    const regulation = await CompoundingRegulationModel.update(req.params.id, updates);
    if (!regulation) {
      throw new AppError(404, 'Regulation not found');
    }
    res.json(regulation);
  })
);

compoundingRouter.delete(
  '/regulations/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const deleted = await CompoundingRegulationModel.delete(req.params.id);
    if (!deleted) {
      throw new AppError(404, 'Regulation not found');
    }
    res.status(204).send();
  })
);
