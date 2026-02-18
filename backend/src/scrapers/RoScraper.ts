import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ProductPage {
  name: string;
  path: string;
  category: string;
  genericName?: string;
}

export class RoScraper extends BaseScraper {
  constructor() {
    super('RO');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://ro.co';

    // Product pages discovered during reconnaissance
    const productPages: ProductPage[] = [
      // Erectile Dysfunction
      { name: 'Ro Sparks', path: '/erectile-dysfunction/sparks/', category: 'Erectile Dysfunction', genericName: 'Sildenafil + Tadalafil' },
      { name: 'Daily Rise Gummies', path: '/erectile-dysfunction/daily-rise-gummies/', category: 'Erectile Dysfunction', genericName: 'Tadalafil' },
      { name: 'Sildenafil', path: '/erectile-dysfunction/sildenafil/', category: 'Erectile Dysfunction', genericName: 'Generic Viagra' },
      { name: 'Viagra', path: '/erectile-dysfunction/viagra/', category: 'Erectile Dysfunction', genericName: 'Sildenafil' },
      { name: 'Tadalafil', path: '/erectile-dysfunction/tadalafil/', category: 'Erectile Dysfunction', genericName: 'Generic Cialis' },
      { name: 'Cialis', path: '/erectile-dysfunction/cialis/', category: 'Erectile Dysfunction', genericName: 'Tadalafil' },
      // Hair Loss
      { name: 'Ro Mane Spray', path: '/hair-loss/', category: 'Hair Loss', genericName: 'Finasteride + Minoxidil' },
      { name: 'Oral Finasteride', path: '/medications/finasteride/', category: 'Hair Loss', genericName: 'Generic Propecia' },
      { name: 'Oral Minoxidil', path: '/medications/oral-minoxidil/', category: 'Hair Loss' },
      { name: 'Topical Minoxidil', path: '/medications/minoxidil/', category: 'Hair Loss', genericName: 'Generic Rogaine' },
      // Weight Loss
      { name: 'Wegovy Pill', path: '/weight-loss/wegovy/', category: 'Weight Loss', genericName: 'Semaglutide Oral' },
      { name: 'Wegovy Pen', path: '/weight-loss/wegovy/', category: 'Weight Loss', genericName: 'Semaglutide Injectable' },
      { name: 'Zepbound', path: '/weight-loss/zepbound/', category: 'Weight Loss', genericName: 'Tirzepatide' },
      { name: 'Ozempic', path: '/weight-loss/ozempic/', category: 'Weight Loss', genericName: 'Semaglutide' },
      { name: 'Saxenda', path: '/weight-loss/saxenda/', category: 'Weight Loss', genericName: 'Liraglutide' },
      // Other
      { name: 'Valacyclovir', path: '/medications/valacyclovir/', category: 'Herpes', genericName: 'Generic Valtrex' },
    ];

    // First, scrape the pricing page to get all prices
    const prices = await this.scrapePricingPage(baseUrl);
    console.log(`Found ${Object.keys(prices).length} prices on pricing page`);

    // Now scrape each product page
    for (const product of productPages) {
      try {
        console.log(`Scraping: ${product.name}...`);

        await this.page.goto(`${baseUrl}${product.path}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const $ = cheerio.load(content);
        const pageText = $('body').text();

        // Extract price from page or use cached price
        let price: number | undefined;
        const priceMatch = pageText.match(/\$(\d+(?:\.\d{2})?)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
        }
        // Try to find price from pricing page cache
        const productKey = product.name.toLowerCase().replace(/\s+/g, '');
        if (prices[productKey]) {
          price = prices[productKey];
        }

        // Check if product is available
        const isAvailable = !pageText.toLowerCase().includes('currently unavailable') &&
                           !pageText.toLowerCase().includes('out of stock');

        drugs.push({
          externalName: product.name,
          url: `${baseUrl}${product.path}`,
          price,
          category: product.category,
          requiresPrescription: true,
          requiresConsultation: true,
          rawData: {
            genericName: product.genericName,
            isAvailable,
            scrapedAt: new Date().toISOString(),
          },
        });

        console.log(`  Added: ${product.name} - $${price || 'N/A'}`);
        await this.delay(1500);

      } catch (error) {
        console.error(`Error scraping ${product.name}:`, error);
      }
    }

    // Also scan the main category pages for any additional products
    const categoryPages = [
      { path: '/erectile-dysfunction/', category: 'Erectile Dysfunction' },
      { path: '/hair-loss/', category: 'Hair Loss' },
      { path: '/weight-loss/', category: 'Weight Loss' },
    ];

    for (const catPage of categoryPages) {
      try {
        await this.page.goto(`${baseUrl}${catPage.path}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const $ = cheerio.load(content);

        // Find any product links we might have missed
        $('a[href*="/medications/"], a[href*="/erectile-dysfunction/"], a[href*="/hair-loss/"], a[href*="/weight-loss/"]').each((_, el) => {
          const href = $(el).attr('href') || '';
          const text = $(el).text().trim();

          // Skip navigation links, junk entries, and already captured products
          if (text.length < 3 || text.length > 50) return;
          if (text.includes('See all') || text.includes('How it works')) return;
          if (text.includes('Pricing') || text.includes('Insurance') || text.includes('FAQs')) return;
          if (text.includes('Calculator') || text.includes('Tracker')) return;
          if (text.includes('Learn more') || text.includes('Start with')) return;
          if (text.includes('free') || text.includes('check')) return;
          // Skip testimonial names (usually just first names or full names without medical terms)
          const lowerText = text.toLowerCase();
          const medicalTerms = ['mg', 'ml', 'rx', 'capsule', 'tablet', 'spray', 'cream', 'gel', 'oral', 'topical'];
          const hasNoMedicalTerm = !medicalTerms.some(term => lowerText.includes(term));
          const looksLikeName = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text) && text.split(' ').length <= 3;
          if (hasNoMedicalTerm && looksLikeName && !lowerText.includes('swipe')) return;

          const exists = drugs.some(d =>
            d.externalName.toLowerCase() === text.toLowerCase() ||
            d.url?.includes(href)
          );

          if (!exists && href.startsWith('/')) {
            // Check if this looks like a product page
            const isProductPage = href.split('/').filter(p => p).length >= 2;
            if (isProductPage) {
              drugs.push({
                externalName: text.replace(/®|™/g, '').trim(),
                url: `${baseUrl}${href}`,
                price: undefined,
                category: catPage.category,
                requiresPrescription: true,
                requiresConsultation: true,
                rawData: {
                  discoveredFrom: catPage.path,
                  scrapedAt: new Date().toISOString(),
                },
              });
              console.log(`  Discovered: ${text}`);
            }
          }
        });

      } catch (error) {
        console.error(`Error scanning ${catPage.path}:`, error);
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

  private async scrapePricingPage(baseUrl: string): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    try {
      await this.page!.goto(`${baseUrl}/pricing/`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      await this.delay(2000);

      const content = await this.page!.content();
      const $ = cheerio.load(content);

      // Look for price patterns near product names
      $('h2, h3, h4').each((_, el) => {
        const heading = $(el).text().trim().toLowerCase();
        const parent = $(el).parent();
        const priceText = parent.text();
        const priceMatch = priceText.match(/\$(\d+(?:\.\d{2})?)/);

        if (priceMatch) {
          const price = parseFloat(priceMatch[1]);
          const key = heading.replace(/[^a-z0-9]/g, '');
          if (key.length > 2) {
            prices[key] = price;
          }
        }
      });

    } catch (error) {
      console.error('Error scraping pricing page:', error);
    }

    return prices;
  }
}
