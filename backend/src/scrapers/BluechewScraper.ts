import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ProductPage {
  name: string;
  path: string;
  category: string;
  genericName?: string;
  price?: number;
  dosage?: string;
}

export class BluechewScraper extends BaseScraper {
  constructor() {
    super('BLUECHEW');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://bluechew.com';

    // BlueChew products - chewable ED medications
    const products: ProductPage[] = [
      // Sildenafil (Generic Viagra)
      { name: 'Sildenafil Chewable 30mg', path: '/sildenafil', category: 'Erectile Dysfunction', genericName: 'Generic Viagra', price: 20, dosage: '30mg' },
      { name: 'Sildenafil Chewable 45mg', path: '/sildenafil', category: 'Erectile Dysfunction', genericName: 'Generic Viagra', price: 20, dosage: '45mg' },

      // Tadalafil (Generic Cialis)
      { name: 'Tadalafil Chewable 6mg', path: '/tadalafil', category: 'Erectile Dysfunction', genericName: 'Generic Cialis', price: 20, dosage: '6mg' },
      { name: 'Tadalafil Chewable 9mg', path: '/tadalafil', category: 'Erectile Dysfunction', genericName: 'Generic Cialis', price: 20, dosage: '9mg' },

      // Vardenafil (Generic Levitra)
      { name: 'Vardenafil Chewable 8mg', path: '/plans?s=var', category: 'Erectile Dysfunction', genericName: 'Generic Levitra', price: 25, dosage: '8mg' },

      // Combo products
      { name: 'MAX (Sildenafil + Tadalafil)', path: '/plans?s=stx', category: 'Erectile Dysfunction', genericName: 'Sildenafil 45mg + Tadalafil 18mg', price: 90 },
      { name: 'VMAX (Vardenafil + Tadalafil)', path: '/plans?s=vtx', category: 'Erectile Dysfunction', genericName: 'Vardenafil 14mg + Tadalafil 18mg', price: 90 },

      // Daily/Special
      { name: 'DailyTAD + Multivitamin', path: '/plans?s=tmv', category: 'Erectile Dysfunction', genericName: 'Tadalafil 9mg + Vitamins', price: 40 },
      { name: 'GOLD (Sildenafil 100mg)', path: '/plans?s=bcg', category: 'Erectile Dysfunction', genericName: 'Sildenafil High Dose', price: 30 },
      { name: 'ENERGY', path: '/plans?s=bce', category: 'Erectile Dysfunction', price: 30 },
    ];

    const productUrls = [
      '/sildenafil',
      '/tadalafil',
      '/plans',
    ];

    for (const productPath of productUrls) {
      try {
        console.log(`Scraping: ${productPath}...`);

        await this.page.goto(`${baseUrl}${productPath}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const $ = cheerio.load(content);
        const pageText = $('body').text().toLowerCase();

        for (const product of products) {
          const productNameLower = product.name.toLowerCase();
          const pathMatch = product.path === productPath || product.path.startsWith(productPath);
          const isOnPage = pageText.includes(productNameLower.split(' ')[0]) || pathMatch;

          if (isOnPage || pathMatch) {
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
                  dosage: product.dosage,
                  form: 'Chewable tablet',
                  scrapedAt: new Date().toISOString(),
                },
              });
              console.log(`  Added: ${product.name} - $${product.price ?? 'N/A'}`);
            }
          }
        }

        await this.delay(1500);
      } catch (error) {
        console.error(`Error scraping ${productPath}:`, error);
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
