import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class EdenScraper extends BaseScraper {
  constructor() {
    super('EDEN');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.tryeden.com';
    const seenDrugs = new Set<string>();

    const treatmentPages = [
      // Weight Loss - GLP-1s
      { path: '/treatment/glp-1-treatments', name: 'GLP-1 Treatments', category: 'Weight Loss' },
      { path: '/treatment/ozempic', name: 'Ozempic (Semaglutide)', category: 'Weight Loss' },
      { path: '/treatment/wegovy', name: 'Wegovy (Semaglutide)', category: 'Weight Loss' },
      { path: '/treatment/zepbound', name: 'Zepbound (Tirzepatide)', category: 'Weight Loss' },
      { path: '/treatment/mounjaro', name: 'Mounjaro (Tirzepatide)', category: 'Weight Loss' },
      { path: '/getting-started/compounded-semaglutide', name: 'Compounded Semaglutide', category: 'Weight Loss' },
      { path: '/getting-started/compounded-tirzepatide', name: 'Compounded Tirzepatide', category: 'Weight Loss' },
      { path: '/getting-started/compounded-liraglutide', name: 'Compounded Liraglutide', category: 'Weight Loss' },
      { path: '/getting-started/oral-semaglutide', name: 'Oral Semaglutide', category: 'Weight Loss' },

      // Erectile Dysfunction
      { path: '/treatment/vardenafil-tadalafil', name: 'Vardenafil + Tadalafil', category: 'Erectile Dysfunction' },

      // Hair Loss - Men
      { path: '/treatment/finasteride-for-men', name: 'Finasteride (Men)', category: 'Hair Loss' },
      { path: '/treatment/minoxidil-for-men', name: 'Minoxidil (Men)', category: 'Hair Loss' },
      { path: '/treatment/hair-growth-kits-for-men', name: 'Hair Growth Kit (Men)', category: 'Hair Loss' },
      { path: '/treatment/ghk-cu-for-men', name: 'GHK-Cu Foam (Men)', category: 'Hair Loss' },

      // Hair Loss - Women
      { path: '/treatment/minoxidil-for-women', name: 'Minoxidil (Women)', category: 'Hair Loss' },
      { path: '/treatment/hair-growth-kits-for-women', name: 'Hair Growth Kit (Women)', category: 'Hair Loss' },
      { path: '/treatment/ghk-cu-for-women', name: 'GHK-Cu Foam (Women)', category: 'Hair Loss' },

      // Peptides / Anti-Aging
      { path: '/treatment/sermorelin', name: 'Sermorelin Injection', category: 'Peptides / Anti-Aging' },
      { path: '/treatment/sermorelin-odt', name: 'Sermorelin ODT (Tablets)', category: 'Peptides / Anti-Aging' },
      { path: '/treatment/nad', name: 'NAD+ Injection', category: 'Peptides / Anti-Aging' },
      { path: '/treatment/nad-nasal-spray', name: 'NAD+ Nasal Spray', category: 'Peptides / Anti-Aging' },
      { path: '/treatment/nad-facial-cream', name: 'NAD+ Facial Cream', category: 'Peptides / Anti-Aging' },
      { path: '/treatment/glutathione', name: 'Glutathione', category: 'Peptides / Anti-Aging' },

      // Energy / Mood
      { path: '/treatment/mic-b12', name: 'MIC + B12 Injection', category: 'Energy / Mood' },
      { path: '/treatment/methylene-blue', name: 'Methylene Blue', category: 'Energy / Mood' },

      // Women's Health
      { path: '/treatment/hormone-kit-for-women', name: 'Hormone Kit (Women)', category: 'Women\'s Health' },
    ];

    for (const treatment of treatmentPages) {
      const key = treatment.name.toLowerCase();
      if (seenDrugs.has(key)) continue;
      seenDrugs.add(key);

      const url = `${baseUrl}${treatment.path}`;
      console.log(`Scraping ${treatment.name}...`);

      try {
        await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const extractedData = this.extractTreatmentData(content);

        drugs.push({
          externalName: treatment.name,
          url,
          price: extractedData.price,
          category: treatment.category,
          requiresPrescription: true,
          requiresConsultation: true,
          rawData: {
            ...extractedData,
            businessModel: 'telehealth-compounding',
          },
        });
      } catch (err) {
        console.log(`Failed to scrape ${treatment.name}, using fallback`);
        drugs.push({
          externalName: treatment.name,
          url,
          category: treatment.category,
          requiresPrescription: true,
          requiresConsultation: true,
          rawData: {
            businessModel: 'telehealth-compounding',
            source: 'fallback',
          },
        });
      }
    }

    return drugs;
  };

  private extractTreatmentData = (html: string): Record<string, any> => {
    const $ = cheerio.load(html);
    const data: Record<string, any> = {};

    const priceSelectors = [
      '[data-price]',
      '.price',
      '[class*="price"]',
      'span:contains("$")',
      'div:contains("$")',
    ];

    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text();
      const priceMatch = priceText.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        data.price = parseFloat(priceMatch[1]);
        break;
      }
    }

    const description = $('meta[name="description"]').attr('content') ||
                        $('p').first().text().trim().slice(0, 300);
    if (description) {
      data.description = description;
    }

    const pageText = $('body').text();

    const monthlyMatch = pageText.match(/\$(\d+)(?:\/mo|\/month| per month| first month)/i);
    if (monthlyMatch && !data.price) {
      data.price = parseFloat(monthlyMatch[1]);
      data.priceType = 'monthly';
    }

    if (pageText.toLowerCase().includes('compounded')) {
      data.isCompounded = true;
    }

    return data;
  };
}
