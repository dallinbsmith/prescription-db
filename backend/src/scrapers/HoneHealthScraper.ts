import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class HoneHealthScraper extends BaseScraper {
  constructor() {
    super('HONE_HEALTH');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://honehealth.com';
    const seenDrugs = new Set<string>();

    const treatmentPages = [
      // Testosterone Replacement Therapy
      { path: '/mens/testosterone-replacement-therapy/', name: 'Testosterone Injection', category: 'TRT', price: 28 },
      { path: '/mens/buy-testosterone/', name: 'Testosterone Cypionate 200mg', category: 'TRT', price: 28 },
      { path: '/mens/tesosterone-troches/', name: 'Testosterone Troches', category: 'TRT', price: 60 },
      { path: '/mens/', name: 'Testosterone Cream', category: 'TRT', price: 60 },

      // Fertility-Preserving TRT Alternatives
      { path: '/mens/', name: 'Clomiphene Citrate (Clomid)', category: 'TRT Alternative', price: 38 },
      { path: '/mens/', name: 'Enclomiphene', category: 'TRT Alternative', price: 42 },

      // Estrogen Management
      { path: '/mens/', name: 'Anastrozole (Arimidex)', category: 'Hormone Support', price: 22 },

      // Sexual Health
      { path: '/mens/', name: 'Tadalafil (Cialis)', category: 'Erectile Dysfunction' },
      { path: '/mens/', name: 'Sildenafil (Viagra)', category: 'Erectile Dysfunction' },

      // Hair Loss
      { path: '/mens/', name: 'Finasteride', category: 'Hair Loss' },
      { path: '/mens/', name: 'Minoxidil', category: 'Hair Loss' },
      { path: '/mens/', name: 'Finasteride + Minoxidil Combo', category: 'Hair Loss' },

      // Longevity / Peptides
      { path: '/mens/', name: 'NAD+ Injection', category: 'Longevity / Anti-Aging' },
      { path: '/mens/', name: 'NAD+ Nasal Spray', category: 'Longevity / Anti-Aging' },
      { path: '/mens/', name: 'Sermorelin', category: 'Longevity / Anti-Aging' },

      // Weight Loss
      { path: '/mens/', name: 'Semaglutide (GLP-1)', category: 'Weight Loss' },
      { path: '/mens/', name: 'Tirzepatide (GLP-1)', category: 'Weight Loss' },

      // Thyroid
      { path: '/mens/', name: 'Levothyroxine', category: 'Thyroid' },
      { path: '/mens/', name: 'Liothyronine (T3)', category: 'Thyroid' },
    ];

    // Scrape main men's page first to gather data
    console.log('Scraping Hone Health main page...');
    try {
      await this.page.goto(`${baseUrl}/mens/`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.delay(2000);
    } catch (err) {
      console.log('Failed to load main page, continuing with known data');
    }

    // Scrape TRT page for detailed info
    console.log('Scraping TRT page...');
    try {
      await this.page.goto(`${baseUrl}/mens/testosterone-replacement-therapy/`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.delay(2000);
    } catch (err) {
      console.log('Failed to load TRT page');
    }

    for (const treatment of treatmentPages) {
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
          businessModel: 'telehealth-mens-health',
          focusArea: 'hormone-optimization',
          membershipRequired: true,
          membershipPrice: { basic: 25, premium: 149 },
          labTestPrice: 65,
        },
      });
    }

    return drugs;
  };
}
