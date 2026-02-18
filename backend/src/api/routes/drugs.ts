import { Router } from 'express';
import { query } from 'express-validator';
import { DrugModel } from '../../models/Drug.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

export const drugsRouter = Router();

drugsRouter.use(authenticate);

drugsRouter.get(
  '/',
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('offset').optional().isInt({ min: 0 }),
  asyncHandler(async (req, res) => {
    const params = {
      search: req.query.search as string | undefined,
      rx_otc: req.query.rx_otc as string | undefined,
      dea_schedule: req.query.dea_schedule as string | undefined,
      species: req.query.species as string | undefined,
      dosage_form: req.query.dosage_form as string | undefined,
      manufacturer: req.query.manufacturer as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    };

    const result = await DrugModel.search(params);
    res.json(result);
  })
);

drugsRouter.get(
  '/filters/:field',
  asyncHandler(async (req, res) => {
    const values = await DrugModel.getDistinctValues(req.params.field);
    res.json(values);
  })
);

drugsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const drug = await DrugModel.findById(req.params.id);
    if (!drug) {
      throw new AppError(404, 'Drug not found');
    }
    res.json(drug);
  })
);

drugsRouter.get(
  '/ndc/:ndc',
  asyncHandler(async (req, res) => {
    const drug = await DrugModel.findByNdc(req.params.ndc);
    if (!drug) {
      throw new AppError(404, 'Drug not found');
    }
    res.json(drug);
  })
);
