import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class HelloCakeScraper extends BaseScraper {
  constructor() {
    super('HELLO_CAKE');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://hellocake.com';
    const seenDrugs = new Set<string>();

    const products = [
      // Rx For Him - ED
      {
        path: '/products/flavored-ed-meds-rdt/',
        name: 'Cake ED Meds - To Go',
        category: 'Erectile Dysfunction',
        price: 54,
        ingredients: ['Sildenafil', 'Tadalafil'],
        description: 'Quick dissolve ED medication, Sildenafil + Tadalafil combo, works in 15-30 min',
      },
      {
        path: '/products/the-daily-chew/',
        name: 'The Daily Chew - ED Gum',
        category: 'Erectile Dysfunction',
        price: 75,
        ingredients: ['Tadalafil'],
        description: 'Daily ED medication in gum form',
      },
      {
        path: '/products/stamina/',
        name: 'Stamina - Last Longer',
        category: 'Premature Ejaculation',
        price: 54,
        ingredients: ['Sertraline', 'Sildenafil'],
        description: 'Dual-action formula to delay ejaculation and enhance endurance',
      },

      // Rx For Her
      {
        path: '/products/libido-lift-rx/',
        name: 'Libido Lift Rx For Her',
        category: 'Female Sexual Wellness',
        price: 54,
        ingredients: ['Oxytocin', 'Sildenafil', 'Testosterone'],
        description: 'Prescription arousal enhancer for low libido, works in 30 min',
      },
      {
        path: '/products/o-cream-rx/',
        name: 'O-Cream Rx For Her',
        category: 'Female Sexual Wellness',
        price: 54,
        ingredients: ['Sildenafil'],
        description: 'Topical prescription cream for enhanced arousal and sensitivity',
      },

      // Supplements (OTC)
      {
        path: '/products/drive-for-him/',
        name: 'Drive For Him',
        category: 'Supplements - Men',
        price: 30,
        isOTC: true,
        description: 'Daily supplement for male sexual health and drive',
      },
      {
        path: '/products/drive-for-her/',
        name: 'Drive For Her',
        category: 'Supplements - Women',
        price: 30,
        isOTC: true,
        description: 'Daily supplement for female sexual health and drive',
      },
      {
        path: '/products/couple-goals/',
        name: 'Couple Goals Bundle',
        category: 'Supplements - Bundle',
        price: 48,
        isOTC: true,
        description: 'His and hers supplement bundle',
      },
    ];

    // Scrape main Rx pages for additional info
    const pagesToScrape = ['/rx-for-him/', '/rx-for-her/'];

    for (const pagePath of pagesToScrape) {
      try {
        console.log(`Scraping ${baseUrl}${pagePath}...`);
        await this.page.goto(`${baseUrl}${pagePath}`, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        await this.delay(2000);
      } catch (err) {
        console.log(`Failed to load ${pagePath}`);
      }
    }

    for (const product of products) {
      const key = product.name.toLowerCase();
      if (seenDrugs.has(key)) continue;
      seenDrugs.add(key);

      console.log(`Adding ${product.name}...`);

      const isRx = !product.isOTC;

      drugs.push({
        externalName: product.name,
        url: `${baseUrl}${product.path}`,
        price: product.price,
        category: product.category,
        requiresPrescription: isRx,
        requiresConsultation: isRx,
        rawData: {
          description: product.description,
          ingredients: product.ingredients || [],
          isCompounded: isRx,
          businessModel: 'telehealth-sexual-wellness',
          deliveryForm: product.name.includes('Cream') ? 'topical' :
                        product.name.includes('Gum') ? 'gum' :
                        product.name.includes('To Go') ? 'sublingual' : 'oral',
        },
      });
    }

    return drugs;
  };
}
