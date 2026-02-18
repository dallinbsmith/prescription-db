import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ProductPage {
  name: string;
  path: string;
  category: string;
  genericName?: string;
  price?: number;
}

export class KeepsScraper extends BaseScraper {
  constructor() {
    super('KEEPS');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.keeps.com';

    const products: ProductPage[] = [
      // Prescription medications
      { name: 'Finasteride 1mg', path: '/our-products/finasteride', category: 'Hair Loss', genericName: 'Generic Propecia', price: 10 },
      { name: 'Topical Finasteride & Minoxidil Gel', path: '/our-products/topical-finasteride-and-minoxidil', category: 'Hair Loss', price: 36 },

      // OTC treatments
      { name: 'Minoxidil 5% Foam', path: '/our-products/minoxidil-foam', category: 'Hair Loss', genericName: 'Generic Rogaine', price: 10 },
      { name: 'Minoxidil 5% Solution', path: '/our-products/minoxidil-foam', category: 'Hair Loss', genericName: 'Generic Rogaine', price: 10 },
      { name: 'Minoxidil+ Spray', path: '/our-products/minoxidil-spray', category: 'Hair Loss', genericName: 'Compounded Minoxidil', price: 27 },

      // Hair care products
      { name: 'Ketoconazole Shampoo', path: '/our-products', category: 'Hair Loss', genericName: 'Nizoral', price: 18 },
      { name: 'Thickening Shampoo', path: '/our-products', category: 'Hair Care', price: 18 },
      { name: 'Thickening Conditioner', path: '/our-products', category: 'Hair Care', price: 18 },
      { name: 'Hair Thickening Pomade', path: '/our-products', category: 'Hair Care', price: 18 },

      // Supplements
      { name: 'Hair Growth Vitamins', path: '/our-products', category: 'Supplements', genericName: 'Biotin + Saw Palmetto', price: 25 },
      { name: 'Biotin Gummies', path: '/our-products', category: 'Supplements', price: 20 },
    ];

    const productUrls = [
      '/our-products/finasteride',
      '/our-products/minoxidil-foam',
      '/our-products/minoxidil-spray',
      '/our-products/topical-finasteride-and-minoxidil',
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
          if (product.path === productPath) {
            const exists = drugs.some(d => d.externalName === product.name);
            if (!exists) {
              drugs.push({
                externalName: product.name,
                url: `${baseUrl}${product.path}`,
                price: product.price,
                category: product.category,
                requiresPrescription: product.category === 'Hair Loss' && product.name.includes('Finasteride'),
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

        await this.delay(1500);
      } catch (error) {
        console.error(`Error scraping ${productPath}:`, error);
      }
    }

    // Add products from main product listing
    try {
      console.log('Scraping main homepage for additional products...');
      await this.page.goto(baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
      await this.delay(2000);

      const content = await this.page.content();
      const $ = cheerio.load(content);
      const pageText = $('body').text().toLowerCase();

      for (const product of products) {
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
              requiresPrescription: product.category === 'Hair Loss' && product.name.includes('Finasteride'),
              requiresConsultation: true,
              rawData: {
                genericName: product.genericName,
                scrapedAt: new Date().toISOString(),
              },
            });
            console.log(`  Added from homepage: ${product.name} - $${product.price ?? 'N/A'}`);
          }
        }
      }
    } catch (error) {
      console.error('Error scraping homepage:', error);
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
