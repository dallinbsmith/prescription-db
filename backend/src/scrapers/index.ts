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
import { AltoPharmacyScraper } from './AltoPharmacyScraper.js';
import { BlinkHealthScraper } from './BlinkHealthScraper.js';
import { CerebralScraper } from './CerebralScraper.js';
import { EdenScraper } from './EdenScraper.js';
import { EvernowScraper } from './EvernowScraper.js';
import { HoneHealthScraper } from './HoneHealthScraper.js';
import { HelloCakeScraper } from './HelloCakeScraper.js';
import { HenryMedsScraper } from './HenryMedsScraper.js';
import { LemonaidScraper } from './LemonaidScraper.js';
import { AgelessRxScraper } from './AgelessRxScraper.js';
import { MaximusTribeScraper } from './MaximusTribeScraper.js';
import { NovoNordiskScraper } from './NovoNordiskScraper.js';
import { SkinnyRxScraper } from './SkinnyRxScraper.js';
import { AmazonPharmacyScraper } from './AmazonPharmacyScraper.js';
import { WalgreensScraper } from './WalgreensScraper.js';
import { RexMdScraper } from './RexMdScraper.js';

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
  ALTO_PHARMACY: () => new AltoPharmacyScraper(),
  BLINK_HEALTH: () => new BlinkHealthScraper(),
  CEREBRAL: () => new CerebralScraper(),
  EDEN: () => new EdenScraper(),
  EVERNOW: () => new EvernowScraper(),
  HONE_HEALTH: () => new HoneHealthScraper(),
  HELLO_CAKE: () => new HelloCakeScraper(),
  HENRY_MEDS: () => new HenryMedsScraper(),
  LEMONAID: () => new LemonaidScraper(),
  AGELESS_RX: () => new AgelessRxScraper(),
  MAXIMUS_TRIBE: () => new MaximusTribeScraper(),
  NOVO_NORDISK: () => new NovoNordiskScraper(),
  SKINNY_RX: () => new SkinnyRxScraper(),
  AMAZON_PHARMACY: () => new AmazonPharmacyScraper(),
  WALGREENS: () => new WalgreensScraper(),
  REX_MD: () => new RexMdScraper(),
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
