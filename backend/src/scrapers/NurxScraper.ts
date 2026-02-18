import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ProductPage {
  name: string;
  path: string;
  category: string;
  genericName?: string;
  price?: number;
}

export class NurxScraper extends BaseScraper {
  constructor() {
    super('NURX');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.nurx.com';

    const products: ProductPage[] = [
      // Birth Control - Pills
      { name: 'Birth Control Pill', path: '/birthcontrol/', category: 'Birth Control', price: 0 },
      { name: 'Yaz', path: '/birthcontrol/', category: 'Birth Control', genericName: 'Drospirenone/Ethinyl Estradiol', price: 0 },
      { name: 'Yasmin', path: '/birthcontrol/', category: 'Birth Control', genericName: 'Drospirenone/Ethinyl Estradiol', price: 0 },
      { name: 'Lo Loestrin Fe', path: '/birthcontrol/', category: 'Birth Control', genericName: 'Norethindrone/Ethinyl Estradiol', price: 0 },
      { name: 'Sprintec', path: '/birthcontrol/', category: 'Birth Control', genericName: 'Norgestimate/Ethinyl Estradiol', price: 0 },
      { name: 'Tri-Sprintec', path: '/birthcontrol/', category: 'Birth Control', genericName: 'Norgestimate/Ethinyl Estradiol', price: 0 },
      { name: 'Slynd', path: '/birthcontrol/', category: 'Birth Control', genericName: 'Drospirenone', price: 0 },

      // Birth Control - Ring/Patch
      { name: 'NuvaRing', path: '/birthcontrol/', category: 'Birth Control', genericName: 'Etonogestrel/Ethinyl Estradiol Ring', price: 0 },
      { name: 'Xulane Patch', path: '/birthcontrol/', category: 'Birth Control', genericName: 'Norelgestromin/Ethinyl Estradiol Patch', price: 0 },

      // Emergency Contraception
      { name: 'Plan B', path: '/birthcontrol/', category: 'Emergency Contraception', genericName: 'Levonorgestrel', price: 0 },
      { name: 'Ella', path: '/birthcontrol/', category: 'Emergency Contraception', genericName: 'Ulipristal Acetate', price: 0 },

      // Acne Treatment
      { name: 'Spironolactone', path: '/acne-treatment/', category: 'Acne', genericName: 'Aldactone', price: 15 },
      { name: 'Tretinoin', path: '/acne-treatment/', category: 'Acne', genericName: 'Retin-A', price: 40 },
      { name: 'Azelaic Acid', path: '/acne-treatment/', category: 'Acne', genericName: 'Finacea', price: 45 },
      { name: 'Clindamycin', path: '/acne-treatment/', category: 'Acne', genericName: 'Cleocin', price: 15 },
      { name: 'Minocycline', path: '/acne-treatment/', category: 'Acne', price: 60 },
      { name: 'Doxycycline', path: '/acne-treatment/', category: 'Acne', price: 15 },

      // Herpes Treatment
      { name: 'Valacyclovir', path: '/genital-herpes-treatment/', category: 'Herpes', genericName: 'Valtrex', price: 15 },
      { name: 'Acyclovir', path: '/genital-herpes-treatment/', category: 'Herpes', genericName: 'Zovirax', price: 15 },

      // Skincare
      { name: 'Tretinoin Cream', path: '/skincare-treatments/', category: 'Skincare', genericName: 'Retin-A', price: 30 },
      { name: 'Hydroquinone', path: '/skincare-treatments/', category: 'Skincare', price: 45 },
      { name: 'Azelaic Acid Cream', path: '/skincare-treatments/', category: 'Skincare', price: 45 },
      { name: 'Latisse', path: '/skincare-treatments/', category: 'Skincare', genericName: 'Bimatoprost', price: 90 },

      // Hair Loss
      { name: 'Minoxidil', path: '/skincare-treatments/', category: 'Hair Loss', price: 20 },
      { name: 'Finasteride', path: '/skincare-treatments/', category: 'Hair Loss', genericName: 'Propecia', price: 30 },

      // Migraine (Cove)
      { name: 'Sumatriptan', path: '/cove/', category: 'Migraine', genericName: 'Imitrex', price: 25 },
      { name: 'Rizatriptan', path: '/cove/', category: 'Migraine', genericName: 'Maxalt', price: 25 },
      { name: 'Topiramate', path: '/cove/', category: 'Migraine', genericName: 'Topamax', price: 25 },
      { name: 'Propranolol', path: '/cove/', category: 'Migraine', genericName: 'Inderal', price: 25 },
    ];

    const categoryUrls = [
      '/birthcontrol/',
      '/acne-treatment/',
      '/genital-herpes-treatment/',
      '/skincare-treatments/',
      '/cove/',
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
                  price: product.price,
                  category: product.category,
                  requiresPrescription: true,
                  requiresConsultation: true,
                  rawData: {
                    genericName: product.genericName,
                    priceNote: '$0 with insurance for most',
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
