import puppeteer, { Browser, Page } from 'puppeteer';
import { config } from '../config/index.js';
import { CompetitorDrugModel, CompetitorDrug } from '../models/CompetitorDrug.js';
import { ScrapeLogModel } from '../models/ScrapeLog.js';

export interface ScrapedDrug {
  externalName: string;
  url?: string;
  price?: number;
  category?: string;
  requiresPrescription?: boolean;
  requiresConsultation?: boolean;
  rawData?: object;
}

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected competitorName: string;

  constructor(competitorName: string) {
    this.competitorName = competitorName;
  }

  protected async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();

    await this.page.setUserAgent(config.scraping.userAgent);
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  protected async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  protected async delay(ms?: number): Promise<void> {
    const delayMs = ms || config.scraping.delayMs;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  protected abstract scrape(): Promise<ScrapedDrug[]>;

  async run(): Promise<{ success: boolean; drugsFound: number; error?: string }> {
    const startTime = Date.now();
    let drugsFound = 0;
    let error: string | undefined;

    try {
      await this.init();
      const drugs = await this.scrape();
      drugsFound = drugs.length;

      const scrapedAt = new Date();
      for (const drug of drugs) {
        await CompetitorDrugModel.create({
          competitor: this.competitorName,
          drug_id: null,
          external_name: drug.externalName,
          url: drug.url || null,
          price: drug.price || null,
          category: drug.category || null,
          requires_prescription: drug.requiresPrescription ?? null,
          requires_consultation: drug.requiresConsultation ?? null,
          raw_data: drug.rawData || null,
          scraped_at: scrapedAt,
        });
      }

      await ScrapeLogModel.create({
        competitor: this.competitorName,
        status: 'SUCCESS',
        drugs_found: drugsFound,
        error_message: null,
        duration_ms: Date.now() - startTime,
      });

      return { success: true, drugsFound };
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);

      await ScrapeLogModel.create({
        competitor: this.competitorName,
        status: 'FAILED',
        drugs_found: drugsFound,
        error_message: error,
        duration_ms: Date.now() - startTime,
      });

      return { success: false, drugsFound, error };
    } finally {
      await this.cleanup();
    }
  }
}
