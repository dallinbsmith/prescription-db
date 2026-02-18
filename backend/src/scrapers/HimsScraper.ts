import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class HimsScraper extends BaseScraper {
  constructor() {
    super('HIMS');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.hims.com';

    const categories = [
      { path: '/erectile-dysfunction', name: 'Erectile Dysfunction' },
      { path: '/hair-loss', name: 'Hair Loss' },
      { path: '/weight-loss', name: 'Weight Loss' },
      { path: '/mental-health', name: 'Mental Health' },
      { path: '/skin-care', name: 'Skincare' },
    ];

    // Known drugs to look for on HIMS
    const knownDrugs: Record<string, string[]> = {
      'Erectile Dysfunction': ['Sildenafil', 'Tadalafil', 'Vardenafil', 'ED Hard Mints'],
      'Hair Loss': ['Finasteride', 'Minoxidil', 'Topical Finasteride'],
      'Weight Loss': ['Semaglutide', 'Tirzepatide', 'Weight Loss Kit'],
      'Mental Health': ['Sertraline', 'Escitalopram', 'Bupropion', 'Lexapro', 'Zoloft'],
      'Skincare': ['Tretinoin', 'Anti-Aging Cream', 'Acne Cream'],
    };

    for (const category of categories) {
      try {
        console.log(`Scraping ${category.name}...`);

        await this.page.goto(`${baseUrl}${category.path}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(3000);

        const content = await this.page.content();
        const $ = cheerio.load(content);
        const pageText = $('body').text().toLowerCase();

        // Find prices on the page
        const priceMatches = pageText.match(/\$\d+(?:\.\d{2})?/g) || [];
        const prices = priceMatches.map(p => parseFloat(p.replace('$', '')));
        const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : undefined;

        // Check for known drugs
        const categoryDrugs = knownDrugs[category.name] || [];
        for (const drugName of categoryDrugs) {
          if (pageText.includes(drugName.toLowerCase())) {
            // Avoid duplicates
            const exists = drugs.some(d => d.externalName === drugName && d.category === category.name);
            if (!exists) {
              drugs.push({
                externalName: drugName,
                url: `${baseUrl}${category.path}`,
                price: avgPrice,
                category: category.name,
                requiresPrescription: true,
                requiresConsultation: true,
                rawData: {
                  categoryUrl: `${baseUrl}${category.path}`,
                  scrapedAt: new Date().toISOString(),
                  pricesFound: prices.slice(0, 5),
                },
              });
              console.log(`  Found: ${drugName}`);
            }
          }
        }

        // Also look for links to specific drug pages
        $('a[href*="/sildenafil"], a[href*="/tadalafil"], a[href*="/finasteride"], a[href*="/minoxidil"], a[href*="/tretinoin"], a[href*="/semaglutide"]').each((_, el) => {
          const href = $(el).attr('href') || '';
          const linkText = $(el).text().trim();

          if (linkText && linkText.length > 2 && linkText.length < 50) {
            const exists = drugs.some(d => d.externalName === linkText);
            if (!exists) {
              drugs.push({
                externalName: linkText,
                url: href.startsWith('http') ? href : `${baseUrl}${href}`,
                price: undefined,
                category: category.name,
                requiresPrescription: true,
                requiresConsultation: true,
                rawData: {
                  sourceHref: href,
                  scrapedAt: new Date().toISOString(),
                },
              });
              console.log(`  Found via link: ${linkText}`);
            }
          }
        });

        console.log(`  Category total: ${drugs.filter(d => d.category === category.name).length} drugs`);
        await this.delay();

      } catch (error) {
        console.error(`Error scraping ${category.name}:`, error);
      }
    }

    return drugs;
  }
}
