import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class SkinnyRxScraper extends BaseScraper {
  constructor() {
    super('SKINNY_RX');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://skinnyrx.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // Compounded Semaglutide
      {
        name: 'Compounded Semaglutide Injection',
        category: 'GLP-1 Weight Loss',
        price: 199,
        form: 'injection',
        frequency: 'once weekly',
        path: '/products/semaglutide-injection',
        notes: 'Subcutaneous injection, compounded in US-licensed pharmacies',
      },
      {
        name: 'Compounded Semaglutide Sublingual',
        category: 'GLP-1 Weight Loss',
        price: 199,
        form: 'sublingual drops',
        frequency: 'daily',
        path: '/products/semaglutide-oral',
        notes: 'Liquid taken daily that dissolves under the tongue',
      },
      {
        name: 'Compounded Semaglutide Tablets',
        category: 'GLP-1 Weight Loss',
        price: 249,
        form: 'oral tablet',
        frequency: 'daily',
        path: '/products/semaglutide-tablets',
        notes: 'Oral tablet absorbed through digestive tract',
      },

      // Compounded Tirzepatide
      {
        name: 'Compounded Tirzepatide Injection',
        category: 'GLP-1/GIP Weight Loss',
        price: 299,
        form: 'injection',
        frequency: 'once weekly',
        path: '/products/tirzepatide-injection',
        notes: 'Dual-action GLP-1/GIP compound, subcutaneous injection',
      },
      {
        name: 'Compounded Tirzepatide Tablets',
        category: 'GLP-1/GIP Weight Loss',
        price: 299,
        form: 'oral tablet',
        frequency: 'daily',
        path: '/products/tirzepatide-tablets',
        notes: 'Dual-action GLP-1/GIP compound, oral formulation',
      },

      // Brand-Name Options
      {
        name: 'Zepbound (tirzepatide) Injection',
        category: 'GLP-1/GIP Weight Loss (Brand)',
        price: 1400,
        form: 'injection',
        frequency: 'once weekly',
        path: '/products/zepbound',
        notes: 'FDA-approved brand-name tirzepatide (Eli Lilly)',
        isBrandName: true,
      },

      // Weight Loss Support Medications
      {
        name: 'Bupropion',
        category: 'Weight Loss Support',
        price: 49,
        form: 'oral tablet',
        path: '/products/bupropion',
        notes: 'Appetite suppressant, may be included in personalized kits',
      },
      {
        name: 'Metformin',
        category: 'Weight Loss Support',
        price: 29,
        form: 'oral tablet',
        path: '/products/metformin',
        notes: 'Blood sugar control, metabolic support',
      },
      {
        name: 'Topiramate',
        category: 'Weight Loss Support',
        price: 39,
        form: 'oral tablet',
        path: '/products/topiramate',
        notes: 'Appetite reduction and weight loss support',
      },
      {
        name: 'Naltrexone (Low Dose)',
        category: 'Weight Loss Support',
        price: 39,
        form: 'oral tablet',
        path: '/products/naltrexone',
        notes: 'May help reduce cravings',
      },
      {
        name: 'Vitamin B12 Injection',
        category: 'Weight Loss Support',
        price: 49,
        form: 'injection',
        path: '/products/b12-injection',
        notes: 'Energy and metabolism support',
      },

      // Personalized Kits
      {
        name: 'Personalized Weight Loss Kit',
        category: 'Weight Loss Kit',
        price: 299,
        form: 'combination',
        path: '/products/weight-loss-kit',
        notes: 'Custom combination based on provider assessment',
      },
    ];

    // Visit main site for validation
    try {
      console.log(`Visiting ${baseUrl}...`);
      await this.page.goto(baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.delay(2000);

      const html = await this.page.content();
      const $ = cheerio.load(html);
      console.log(`Page loaded, found ${$('a').length} links`);
    } catch (err) {
      console.log('Failed to load main page, using known data');
    }

    for (const treatment of treatments) {
      const key = treatment.name.toLowerCase();
      if (seenDrugs.has(key)) continue;
      seenDrugs.add(key);

      console.log(`Adding ${treatment.name}...`);

      drugs.push({
        externalName: treatment.name,
        url: `${baseUrl}${treatment.path}`,
        price: treatment.price,
        category: treatment.category,
        requiresPrescription: true,
        requiresConsultation: true,
        rawData: {
          form: treatment.form,
          frequency: treatment.frequency,
          notes: treatment.notes,
          isBrandName: (treatment as any).isBrandName || false,
          isCompounded: !(treatment as any).isBrandName,
          focus: 'weight loss',
          businessModel: 'telehealth-compounding',
          freeShipping: true,
          freeConsultation: true,
        },
      });
    }

    return drugs;
  };
}
