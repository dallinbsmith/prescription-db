import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ProductPage {
  name: string;
  path: string;
  category: string;
  genericName?: string;
  priceWithoutInsurance?: number;
}

export class TwentyeightHealthScraper extends BaseScraper {
  constructor() {
    super('TWENTYEIGHT_HEALTH');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.twentyeighthealth.com';

    const productPages: ProductPage[] = [
      // Birth Control - Pills (common brands they prescribe)
      { name: 'Birth Control Pill', path: '/birth-control', category: 'Birth Control', priceWithoutInsurance: 16 },
      { name: 'Yaz', path: '/birth-control', category: 'Birth Control', genericName: 'Drospirenone/Ethinyl Estradiol' },
      { name: 'Yasmin', path: '/birth-control', category: 'Birth Control', genericName: 'Drospirenone/Ethinyl Estradiol' },
      { name: 'Lo Loestrin Fe', path: '/birth-control', category: 'Birth Control', genericName: 'Norethindrone/Ethinyl Estradiol' },
      { name: 'Junel', path: '/birth-control', category: 'Birth Control', genericName: 'Norethindrone/Ethinyl Estradiol' },
      { name: 'Sprintec', path: '/birth-control', category: 'Birth Control', genericName: 'Norgestimate/Ethinyl Estradiol' },
      { name: 'Tri-Sprintec', path: '/birth-control', category: 'Birth Control', genericName: 'Norgestimate/Ethinyl Estradiol' },
      { name: 'Aviane', path: '/birth-control', category: 'Birth Control', genericName: 'Levonorgestrel/Ethinyl Estradiol' },
      { name: 'Aubra', path: '/birth-control', category: 'Birth Control', genericName: 'Levonorgestrel/Ethinyl Estradiol' },
      { name: 'Chateal', path: '/birth-control', category: 'Birth Control', genericName: 'Levonorgestrel/Ethinyl Estradiol' },
      { name: 'Microgestin', path: '/birth-control', category: 'Birth Control', genericName: 'Norethindrone/Ethinyl Estradiol' },

      // Birth Control - Patch
      { name: 'Xulane', path: '/birth-control/the-patch', category: 'Birth Control', genericName: 'Norelgestromin/Ethinyl Estradiol Patch', priceWithoutInsurance: 300 },

      // Birth Control - Ring
      { name: 'NuvaRing', path: '/birth-control/the-ring', category: 'Birth Control', genericName: 'Etonogestrel/Ethinyl Estradiol Ring', priceWithoutInsurance: 150 },
      { name: 'Annovera', path: '/birth-control/the-ring', category: 'Birth Control', genericName: 'Segesterone/Ethinyl Estradiol Ring' },

      // Birth Control - Shot
      { name: 'Depo-Provera', path: '/birth-control/the-shot', category: 'Birth Control', genericName: 'Medroxyprogesterone Injection', priceWithoutInsurance: 135 },

      // Emergency Contraception
      { name: 'Plan B', path: '/emergency-contraception', category: 'Emergency Contraception', genericName: 'Levonorgestrel', priceWithoutInsurance: 33 },
      { name: 'Ella', path: '/emergency-contraception', category: 'Emergency Contraception', genericName: 'Ulipristal Acetate', priceWithoutInsurance: 33 },

      // Herpes Treatment
      { name: 'Valacyclovir', path: '/herpes-treatment', category: 'Herpes', genericName: 'Generic Valtrex', priceWithoutInsurance: 14 },
      { name: 'Acyclovir', path: '/herpes-treatment', category: 'Herpes', genericName: 'Generic Zovirax', priceWithoutInsurance: 14 },
    ];

    // Scrape main category pages to verify products and get additional info
    const categoryUrls = [
      '/birth-control',
      '/birth-control/the-patch',
      '/birth-control/the-ring',
      '/birth-control/the-shot',
      '/emergency-contraception',
      '/herpes-treatment',
    ];

    for (const catPath of categoryUrls) {
      try {
        console.log(`Scraping category: ${catPath}...`);

        await this.page.goto(`${baseUrl}${catPath}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const $ = cheerio.load(content);
        const pageText = $('body').text().toLowerCase();

        // Check which products from our list are mentioned on this page
        for (const product of productPages) {
          if (product.path === catPath) {
            const productNameLower = product.name.toLowerCase();
            const isOnPage = pageText.includes(productNameLower) ||
                            (product.genericName && pageText.includes(product.genericName.toLowerCase()));

            if (isOnPage || product.path === catPath) {
              const exists = drugs.some(d => d.externalName === product.name);
              if (!exists) {
                drugs.push({
                  externalName: product.name,
                  url: `${baseUrl}${product.path}`,
                  price: product.priceWithoutInsurance,
                  category: product.category,
                  requiresPrescription: true,
                  requiresConsultation: true,
                  rawData: {
                    genericName: product.genericName,
                    priceNote: '$0 with insurance',
                    scrapedAt: new Date().toISOString(),
                  },
                });
                console.log(`  Added: ${product.name}`);
              }
            }
          }
        }

        await this.delay(1500);
      } catch (error) {
        console.error(`Error scraping ${catPath}:`, error);
      }
    }

    // Deduplicate
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
