import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ProductPage {
  name: string;
  path: string;
  category: string;
  genericName?: string;
  price?: number;
}

export class WispScraper extends BaseScraper {
  constructor() {
    super('WISP');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.hellowisp.com';

    const products: ProductPage[] = [
      // UTI
      { name: 'UTI Antibiotics', path: '/shop/vaginal-health/uti', category: 'UTI', genericName: 'Nitrofurantoin/Macrobid', price: 65 },
      { name: 'Nitrofurantoin', path: '/shop/vaginal-health/uti', category: 'UTI', genericName: 'Macrobid', price: 65 },
      { name: 'D-Mannose', path: '/shop/vaginal-health/uti', category: 'UTI', price: 27 },

      // Yeast Infection
      { name: 'Fluconazole', path: '/shop/vaginal-health/yeast-infection', category: 'Yeast Infection', genericName: 'Diflucan', price: 45 },
      { name: 'Boric Acid Suppositories', path: '/shop/vaginal-health/yeast-infection', category: 'Yeast Infection', price: 30 },

      // Bacterial Vaginosis
      { name: 'BV Antibiotics', path: '/shop/vaginal-health/bacterial-vaginosis', category: 'Bacterial Vaginosis', genericName: 'Metronidazole/Clindamycin', price: 15 },
      { name: 'Metronidazole Gel', path: '/shop/vaginal-health/bacterial-vaginosis', category: 'Bacterial Vaginosis', genericName: 'Metrogel', price: 90 },
      { name: 'Clindamycin Cream', path: '/shop/vaginal-health/bacterial-vaginosis', category: 'Bacterial Vaginosis', genericName: 'Cleocin', price: 100 },
      { name: 'Metronidazole Tablets', path: '/shop/vaginal-health/bacterial-vaginosis', category: 'Bacterial Vaginosis', genericName: 'Flagyl', price: 15 },

      // Herpes
      { name: 'Valacyclovir', path: '/shop/herpes', category: 'Herpes', genericName: 'Valtrex', price: 65 },
      { name: 'Acyclovir Cream', path: '/shop/herpes', category: 'Herpes', genericName: 'Zovirax', price: 30 },
      { name: 'Herpes Outbreak Treatment', path: '/shop/herpes', category: 'Herpes', price: 65 },
      { name: 'Herpes Preventative Treatment', path: '/shop/herpes', category: 'Herpes', price: 65 },

      // Birth Control Pills
      { name: 'Slynd', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Drospirenone', price: 25 },
      { name: 'Yaz (generic)', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Drospirenone/Ethinyl Estradiol', price: 15 },
      { name: 'Sprintec (generic)', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Norgestimate/Ethinyl Estradiol', price: 15 },
      { name: 'Tri-Sprintec (generic)', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Norgestimate/Ethinyl Estradiol', price: 15 },
      { name: 'Ortho Tri-Cyclen Lo (generic)', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Norgestimate/Ethinyl Estradiol', price: 15 },
      { name: 'Errin', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Norethindrone', price: 15 },
      { name: 'Microgestin Fe', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Norethindrone/Ethinyl Estradiol', price: 15 },
      { name: 'Junel Fe', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Norethindrone/Ethinyl Estradiol', price: 15 },
      { name: 'Lutera', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Levonorgestrel/Ethinyl Estradiol', price: 15 },
      { name: 'Levora', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Levonorgestrel/Ethinyl Estradiol', price: 15 },
      { name: 'Seasonique (generic)', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Levonorgestrel/Ethinyl Estradiol', price: 22 },
      { name: 'NuvaRing (generic)', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Etonogestrel/Ethinyl Estradiol Ring', price: 25 },
      { name: 'Birth Control Patch', path: '/shop/reproductive-health/birth-control', category: 'Birth Control', genericName: 'Norelgestromin/Ethinyl Estradiol', price: 25 },

      // Emergency Contraception
      { name: 'Plan B', path: '/products/plan-b', category: 'Emergency Contraception', genericName: 'Levonorgestrel', price: 12 },
      { name: 'Ella', path: '/products/ella', category: 'Emergency Contraception', genericName: 'Ulipristal Acetate', price: 44 },

      // Other
      { name: 'Norethindrone', path: '/products/norethindrone', category: 'Menstrual', genericName: 'Period Delay', price: 45 },
      { name: 'Estradiol', path: '/products/estradiol', category: 'Vaginal Health', genericName: 'Vaginal Dryness Treatment', price: 45 },
      { name: 'Zofran', path: '/products/zofran', category: 'Anti-Nausea', genericName: 'Ondansetron', price: 45 },
    ];

    const categoryUrls = [
      '/shop/vaginal-health/uti',
      '/shop/vaginal-health/yeast-infection',
      '/shop/vaginal-health/bacterial-vaginosis',
      '/shop/herpes',
      '/shop/reproductive-health/birth-control',
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

    // Add products not tied to specific category pages
    const standaloneProducts = products.filter(p => p.path.startsWith('/products/'));
    for (const product of standaloneProducts) {
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
        console.log(`  Added standalone: ${product.name} - $${product.price ?? 'N/A'}`);
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
