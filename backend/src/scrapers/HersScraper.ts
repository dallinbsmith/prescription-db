import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ProductPage {
  name: string;
  path: string;
  category: string;
  genericName?: string;
  price?: number;
}

export class HersScraper extends BaseScraper {
  constructor() {
    super('HERS');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.forhers.com';

    const products: ProductPage[] = [
      // Weight Loss
      { name: 'Compounded Semaglutide', path: '/weight-loss', category: 'Weight Loss', genericName: 'GLP-1 Agonist', price: 199 },
      { name: 'Oral Weight Loss Medication Kit', path: '/weight-loss/oral-weight-loss-medication-kits', category: 'Weight Loss', price: 69 },

      // Hair Loss
      { name: 'Oral Minoxidil', path: '/hair-loss/oral-minoxidil', category: 'Hair Loss', price: 30 },
      { name: 'Minoxidil 2% Solution', path: '/hair-loss/minoxidil', category: 'Hair Loss', price: 15 },
      { name: 'Minoxidil 5%', path: '/hair-loss/minoxidil-women', category: 'Hair Loss', price: 15 },
      { name: 'Hair Vitamins + Minoxidil', path: '/hair-loss/minoxidil-hair-vitamin', category: 'Hair Loss', price: 35 },
      { name: 'Biotin + Minoxidil Gummy', path: '/hair-loss/minoxidil-biotin-hair-gummy', category: 'Hair Loss', price: 29 },
      { name: 'Biotin + Minoxidil Chew', path: '/hair-loss/minoxidil-biotin-chew', category: 'Hair Loss', price: 29 },
      { name: 'Hair Blends Serum', path: '/hair-loss/blends-solutions', category: 'Hair Loss', genericName: 'Minoxidil + Finasteride', price: 25 },
      { name: 'Hair Blends Postmeno Serum', path: '/hair-loss/blends-postmeno-serum', category: 'Hair Loss', price: 25 },
      { name: 'Latisse', path: '/hair-loss/latisse', category: 'Hair Loss', genericName: 'Bimatoprost', price: 179 },
      { name: 'Spironolactone', path: '/hair-loss', category: 'Hair Loss', genericName: 'Aldactone', price: 29 },

      // Skincare
      { name: 'Anti-Aging Rx Cream', path: '/skin-care/anti-aging', category: 'Skincare', genericName: 'Tretinoin + Niacinamide + Azelaic Acid', price: 25 },
      { name: 'Tretinoin Cream', path: '/skin-care', category: 'Skincare', genericName: 'Retin-A', price: 25 },
      { name: 'Acne Cream', path: '/skin-care', category: 'Skincare', genericName: 'Tretinoin + Clindamycin + Azelaic Acid', price: 25 },
      { name: 'Niacinamide Serum', path: '/skin-care', category: 'Skincare', price: 24 },
      { name: 'Hydroquinone Cream', path: '/skin-care', category: 'Skincare', price: 29 },

      // Sexual Health
      { name: 'Birth Control', path: '/sexual-health', category: 'Sexual Health', price: 0 },
      { name: 'Valacyclovir', path: '/sexual-health', category: 'Sexual Health', genericName: 'Valtrex', price: 15 },
      { name: 'Genital Herpes Treatment', path: '/sexual-health', category: 'Sexual Health', genericName: 'Valacyclovir', price: 15 },
      { name: 'Cold Sore Kit', path: '/sexual-health', category: 'Sexual Health', genericName: 'Valacyclovir', price: 45 },
      { name: 'Fluconazole', path: '/sexual-health', category: 'Sexual Health', genericName: 'Diflucan', price: 15 },

      // Mental Health
      { name: 'Lexapro', path: '/mental-health', category: 'Mental Health', genericName: 'Escitalopram', price: 49 },
      { name: 'Zoloft', path: '/mental-health', category: 'Mental Health', genericName: 'Sertraline', price: 49 },
      { name: 'Prozac', path: '/mental-health', category: 'Mental Health', genericName: 'Fluoxetine', price: 49 },
      { name: 'Wellbutrin', path: '/mental-health', category: 'Mental Health', genericName: 'Bupropion', price: 49 },
      { name: 'Buspar', path: '/mental-health', category: 'Mental Health', genericName: 'Buspirone', price: 49 },
    ];

    const categoryUrls = [
      '/weight-loss',
      '/hair-loss',
      '/skin-care',
      '/sexual-health',
      '/mental-health',
    ];

    for (const catPath of categoryUrls) {
      try {
        console.log(`Scraping: ${catPath}...`);

        await this.page.goto(`${baseUrl}${catPath}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const $ = cheerio.load(content);
        const pageText = $('body').text().toLowerCase();

        for (const product of products) {
          if (product.path.startsWith(catPath) || product.path === catPath) {
            const productNameLower = product.name.toLowerCase();
            const isOnPage = pageText.includes(productNameLower) ||
                            (product.genericName && pageText.includes(product.genericName.toLowerCase()));

            if (isOnPage) {
              const exists = drugs.some(d => d.externalName === product.name);
              if (!exists) {
                drugs.push({
                  externalName: product.name,
                  url: `${baseUrl}${product.path}`,
                  price: product.price,
                  category: product.category,
                  requiresPrescription: true,
                  requiresConsultation: true,
                  rawData: {
                    genericName: product.genericName,
                    scrapedAt: new Date().toISOString(),
                  },
                });
                console.log(`  Added: ${product.name} - $${product.price ?? 'N/A'}`);
              }
            }
          }
        }

        await this.delay(1500);
      } catch (error) {
        console.error(`Error scraping ${catPath}:`, error);
      }
    }

    const seen = new Set<string>();
    const uniqueDrugs = drugs.filter(d => {
      const key = d.externalName.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`\nTotal unique drugs found: ${uniqueDrugs.length}`);
    return uniqueDrugs;
  }
}
