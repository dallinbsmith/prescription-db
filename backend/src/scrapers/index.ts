import { BaseScraper } from './BaseScraper.js';
import { CostPlusDrugsScraper } from './CostPlusDrugsScraper.js';
import { HimsScraper } from './HimsScraper.js';
import { FridaysScraper } from './FridaysScraper.js';
import { DefyMedicalScraper } from './DefyMedicalScraper.js';
import { RoScraper } from './RoScraper.js';
import { TwentyeightHealthScraper } from './TwentyeightHealthScraper.js';
import { NurxScraper } from './NurxScraper.js';
import { HersScraper } from './HersScraper.js';
import { WispScraper } from './WispScraper.js';
import { KeepsScraper } from './KeepsScraper.js';
import { BluechewScraper } from './BluechewScraper.js';
import { GoodRxScraper } from './GoodRxScraper.js';

export const scrapers: Record<string, () => BaseScraper> = {
  COST_PLUS_DRUGS: () => new CostPlusDrugsScraper(),
  HIMS: () => new HimsScraper(),
  FRIDAYS: () => new FridaysScraper(),
  DEFY_MEDICAL: () => new DefyMedicalScraper(),
  RO: () => new RoScraper(),
  TWENTYEIGHT_HEALTH: () => new TwentyeightHealthScraper(),
  NURX: () => new NurxScraper(),
  HERS: () => new HersScraper(),
  WISP: () => new WispScraper(),
  KEEPS: () => new KeepsScraper(),
  BLUECHEW: () => new BluechewScraper(),
  GOODRX: () => new GoodRxScraper(),
};

export const runScraper = async (competitorName: string) => {
  const scraperFactory = scrapers[competitorName];
  if (!scraperFactory) {
    throw new Error(`Unknown scraper: ${competitorName}`);
  }

  const scraper = scraperFactory();
  return scraper.run();
};

export const getAvailableScrapers = () => Object.keys(scrapers);

export { BaseScraper } from './BaseScraper.js';
