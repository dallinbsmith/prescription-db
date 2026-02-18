import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { CompetitorDrugModel } from '../../models/CompetitorDrug.js';
import { ScrapeLogModel } from '../../models/ScrapeLog.js';
import { runScraper, getAvailableScrapers } from '../../scrapers/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getString, getInt } from '../../utils/queryParams.js';

export const competitorsRouter = Router();

competitorsRouter.use(authenticate);

competitorsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const competitors = await CompetitorDrugModel.getCompetitors();
    const latestScrapes = await ScrapeLogModel.getLatestByCompetitor();

    const result = competitors.map(c => ({
      ...c,
      latestScrape: latestScrapes.get(c.competitor) || null,
    }));

    res.json(result);
  })
);

competitorsRouter.get(
  '/drugs',
  query('competitor').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('offset').optional().isInt({ min: 0 }),
  query('search').optional().isString(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const result = await CompetitorDrugModel.findByCompetitor(
      req.query.competitor as string,
      req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      req.query.search as string | undefined
    );

    res.json(result);
  })
);

competitorsRouter.get(
  '/drugs/unmatched',
  query('competitor').optional().isString(),
  asyncHandler(async (req, res) => {
    const drugs = await CompetitorDrugModel.findUnmatched(req.query.competitor as string | undefined);
    res.json(drugs);
  })
);

competitorsRouter.get(
  '/drugs/:id',
  asyncHandler(async (req, res) => {
    const drug = await CompetitorDrugModel.findById(req.params.id);
    if (!drug) {
      throw new AppError(404, 'Competitor drug not found');
    }
    res.json(drug);
  })
);

competitorsRouter.patch(
  '/drugs/:id/match',
  requireAdmin,
  body('drug_id').optional({ nullable: true }).isUUID(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Invalid input');
    }

    const drug = await CompetitorDrugModel.updateMatch(req.params.id, req.body.drug_id);
    if (!drug) {
      throw new AppError(404, 'Competitor drug not found');
    }
    res.json(drug);
  })
);

competitorsRouter.get(
  '/logs',
  query('competitor').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    if (req.query.competitor) {
      const logs = await ScrapeLogModel.findByCompetitor(req.query.competitor as string, limit);
      return res.json(logs);
    }

    const logs = await ScrapeLogModel.findRecent(limit);
    res.json(logs);
  })
);

competitorsRouter.delete(
  '/drugs/:competitor',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const count = await CompetitorDrugModel.deleteByCompetitor(req.params.competitor);
    res.json({ deleted: count });
  })
);

competitorsRouter.get(
  '/scrapers',
  asyncHandler(async (_req, res) => {
    const scrapers = getAvailableScrapers();
    res.json(scrapers);
  })
);

competitorsRouter.post(
  '/scrape/:competitor',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const competitor = req.params.competitor.toUpperCase();
    const available = getAvailableScrapers();

    if (!available.includes(competitor)) {
      throw new AppError(400, `Unknown scraper: ${competitor}. Available: ${available.join(', ')}`);
    }

    const result = await runScraper(competitor);
    res.json(result);
  })
);
