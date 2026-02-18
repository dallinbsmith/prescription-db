import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class FridaysScraper extends BaseScraper {
  constructor() {
    super('FRIDAYS');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://getfridays.com';

    const categories = [
      { name: 'Erectile Dysfunction', path: '/ed' },
      { name: 'Hair Loss', path: '/hair-loss' },
      { name: 'Weight Loss', path: '/weight-loss' },
      { name: 'Mental Health', path: '/mental-health' },
    ];

    for (const category of categories) {
      try {
        await this.page.goto(`${baseUrl}${category.path}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(3000);

        const content = await this.page.content();
        const $ = cheerio.load(content);

        // Extract all text content that looks like drug names
        const allText = $('body').text();

        // Look for common drug keywords in the page
        const knownDrugs: { [key: string]: { name: string; generic?: string } } = {
          'sildenafil': { name: 'Sildenafil', generic: 'Viagra' },
          'tadalafil': { name: 'Tadalafil', generic: 'Cialis' },
          'finasteride': { name: 'Finasteride', generic: 'Propecia' },
          'minoxidil': { name: 'Minoxidil', generic: 'Rogaine' },
          'semaglutide': { name: 'Semaglutide', generic: 'Ozempic/Wegovy' },
          'tirzepatide': { name: 'Tirzepatide', generic: 'Mounjaro' },
          'sertraline': { name: 'Sertraline', generic: 'Zoloft' },
          'escitalopram': { name: 'Escitalopram', generic: 'Lexapro' },
          'bupropion': { name: 'Bupropion', generic: 'Wellbutrin' },
        };

        const textLower = allText.toLowerCase();

        for (const [drug, info] of Object.entries(knownDrugs)) {
          if (textLower.includes(drug)) {
            // Check if we already have this drug for this category
            const exists = drugs.some(d =>
              d.externalName.toLowerCase().includes(drug) &&
              d.category === category.name
            );

            if (!exists) {
              drugs.push({
                externalName: info.name,
                url: `${baseUrl}${category.path}`,
                price: undefined,
                category: category.name,
                requiresPrescription: true,
                requiresConsultation: true,
                rawData: {
                  genericEquivalent: info.generic,
                  categoryUrl: `${baseUrl}${category.path}`,
                  scrapedAt: new Date().toISOString(),
                  extractionMethod: 'keyword-search',
                },
              });
              console.log(`  Found: ${info.name} in ${category.name}`);
            }
          }
        }

        // Also try to extract from headings and links
        $('h1, h2, h3, a').each((_, el) => {
          const text = $(el).text().trim();
          const href = $(el).attr('href') || '';

          // Look for product-like text
          if (text.length > 3 && text.length < 100) {
            for (const [drug, info] of Object.entries(knownDrugs)) {
              if (text.toLowerCase().includes(drug)) {
                const exists = drugs.some(d =>
                  d.externalName === text && d.category === category.name
                );
                if (!exists && text !== info.name) {
                  // Add the specific product name if different from generic
                  drugs.push({
                    externalName: text,
                    url: href.startsWith('http') ? href : (href ? `${baseUrl}${href}` : `${baseUrl}${category.path}`),
                    price: undefined,
                    category: category.name,
                    requiresPrescription: true,
                    requiresConsultation: true,
                    rawData: {
                      baseDrug: info.name,
                      categoryUrl: `${baseUrl}${category.path}`,
                      scrapedAt: new Date().toISOString(),
                      extractionMethod: 'heading-extraction',
                    },
                  });
                }
              }
            }
          }
        });

        // Extract prices if visible
        const pricePattern = /\$(\d+(?:\.\d{2})?)/g;
        const prices = allText.match(pricePattern);
        if (prices && prices.length > 0) {
          console.log(`  Price mentions found: ${prices.slice(0, 3).join(', ')}`);
        }

        console.log(`Category ${category.name}: found ${drugs.filter(d => d.category === category.name).length} drugs`);
        await this.delay();

      } catch (error) {
        console.error(`Error scraping ${category.name}:`, error);
      }
    }

    return drugs;
  }
}
