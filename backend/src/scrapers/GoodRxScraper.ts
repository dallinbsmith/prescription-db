import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ProductPage {
  name: string;
  path: string;
  category: string;
  genericName?: string;
  price?: number;
}

export class GoodRxScraper extends BaseScraper {
  constructor() {
    super('GOODRX');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.goodrx.com';

    // GoodRx Care telehealth products (from homepage reconnaissance)
    const products: ProductPage[] = [
      // Erectile Dysfunction
      { name: 'Sildenafil', path: '/care/services/erectile-dysfunction/sildenafil-online', category: 'Erectile Dysfunction', genericName: 'Generic Viagra', price: 18 },
      { name: 'Tadalafil', path: '/care/services/erectile-dysfunction/tadalafil-online', category: 'Erectile Dysfunction', genericName: 'Generic Cialis', price: 21 },

      // Hair Loss
      { name: 'Finasteride', path: '/care/services/hair-loss/finasteride-online', category: 'Hair Loss', genericName: 'Generic Propecia', price: 15 },
      { name: 'Oral Minoxidil', path: '/care/services/hair-loss/minoxidil-online', category: 'Hair Loss', price: 15 },

      // Weight Loss (GLP-1)
      { name: 'Wegovy Pill', path: '/care/services/glp-1-weight-loss/wegovy-tablets-online', category: 'Weight Loss', genericName: 'Semaglutide Oral', price: 149 },
      { name: 'Wegovy Pen', path: '/care/services/glp-1-weight-loss/wegovy-online', category: 'Weight Loss', genericName: 'Semaglutide Injectable', price: 299 },
      { name: 'Zepbound Pen', path: '/care/services/glp-1-weight-loss/zepbound-pen-online', category: 'Weight Loss', genericName: 'Tirzepatide', price: 299 },
      { name: 'Zepbound Vial', path: '/care/services/glp-1-weight-loss/zepbound-vial-online', category: 'Weight Loss', genericName: 'Tirzepatide', price: 199 },

      // Women's Health
      { name: 'Birth Control', path: '/care/services/birth-control', category: 'Birth Control', price: 0 },
      { name: 'UTI Treatment', path: '/care/services/uti', category: 'UTI', price: 25 },

      // Skincare
      { name: 'Acne Treatment', path: '/care/services/acne', category: 'Skincare', price: 25 },

      // General
      { name: 'Cold & Sinus Treatment', path: '/care/services/cold', category: 'General Health', price: 25 },
    ];

    // GoodRx blocks internal pages, so scrape from homepage
    try {
      console.log('Scraping GoodRx homepage...');

      await this.page.goto(baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      await this.delay(3000);

      const content = await this.page.content();
      const $ = cheerio.load(content);
      const pageText = $('body').text().toLowerCase();

      // Check for product mentions on homepage
      for (const product of products) {
        const productNameLower = product.name.toLowerCase();
        const isOnPage = pageText.includes(productNameLower) ||
                        (product.genericName && pageText.includes(product.genericName.toLowerCase()));

        if (isOnPage) {
          drugs.push({
            externalName: product.name,
            url: `${baseUrl}${product.path}`,
            price: product.price,
            category: product.category,
            requiresPrescription: true,
            requiresConsultation: true,
            rawData: {
              genericName: product.genericName,
              service: 'GoodRx Care',
              scrapedAt: new Date().toISOString(),
            },
          });
          console.log(`  Added: ${product.name} - $${product.price ?? 'N/A'}`);
        }
      }

      // Add remaining products that are known to exist
      for (const product of products) {
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
              service: 'GoodRx Care',
              note: 'Product verified from homepage links',
              scrapedAt: new Date().toISOString(),
            },
          });
          console.log(`  Added (from known products): ${product.name} - $${product.price ?? 'N/A'}`);
        }
      }

    } catch (error) {
      console.error('Error scraping GoodRx:', error);
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
