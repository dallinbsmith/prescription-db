import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class CostPlusDrugsScraper extends BaseScraper {
  constructor() {
    super('COST_PLUS_DRUGS');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.costplusdrugs.com';
    const discoveredMedications = new Map<string, { slug: string; category: string }>();

    // Categories from their sitemap
    const categories = [
      'acid-reflux', 'alcohol-dependence', 'allergies', 'als', 'angina',
      'anti-bacterial', 'anti-fungal', 'antihyperlipidemic', 'anti-inflammation',
      'antimalarial', 'anti-parasitic', 'anti-viral', 'arrhythmia', 'arthritis',
      'asthma/copd', 'birth-control', 'blood-thinner', 'bone-health', 'breast-cancer',
      'burns', 'cancer', 'chronic-dry-eye', 'colonoscopy-preparation', 'constipation',
      'cough', "crohn's-disease", 'dementia', 'dental-care', 'diabetes', 'diuretic',
      'endometriosis', 'erectile-dysfunction', 'eye-health', 'fertility', 'gallstone',
      'gastrointestinal', 'glaucoma', 'gout', 'hair-&-skin-health', 'heart-failure',
      'heart-health', 'hemorrhage', 'hemorrhoids', 'high-blood-pressure', 'high-cholesterol',
      'high-potassium', 'hiv', 'hormone-therapy', "huntington's-disease", 'hyponatremia',
      'incontinence', 'infection', 'insomnia', 'iron-overload', 'kidney-disease',
      'leukemia', 'low-blood-pressure', 'low-blood-sugar', 'low-potassium', "men's-health",
      'mental-health', 'migraines', 'multiple-sclerosis', 'muscle-relaxants',
      'musculoskeletal', 'nausea', 'neurological', 'opioid-dependence', 'oral-health',
      'organ-transplant', 'overactive-bladder', 'pain-&-inflammation', 'pain-&-nausea',
      "parkinson's-disease", 'phenylketonuria', 'prostate', 'pulmonary-fibrosis',
      'restless-leg-syndrome', 'rheumatoid-arthritis', 'seizures', 'sleep-aid',
      'smoking-cessation', 'steroid', 'stroke-prevention', 'thrombocytopenia', 'thyroid',
      'urea-cycle-disorders', 'urinary-symptoms', 'vascular-disease', 'vitamin-deficiency',
      'weight-management', 'wilson-disease', "women's-health"
    ];

    console.log(`Discovering medications from ${categories.length} categories...`);

    // Phase 1: Discover all medication URLs from category pages
    for (const category of categories) {
      const categoryUrl = `${baseUrl}/medications/categories/${encodeURIComponent(category)}/`;

      try {
        await this.page.goto(categoryUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Wait for React to render
        await this.delay(3000);

        // Scroll to load all items
        await this.page.evaluate(async () => {
          for (let i = 0; i < 5; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, 500));
          }
        });

        await this.delay(1000);

        const content = await this.page.content();
        const $ = cheerio.load(content);

        // Find medication links
        $('a[href*="/medications/"]').each((_, el) => {
          const href = $(el).attr('href');
          if (href && !href.includes('/categories/') && href.match(/\/medications\/[a-z0-9-]+\//)) {
            const match = href.match(/\/medications\/([a-z0-9-]+)\//);
            if (match) {
              const slug = match[1];
              if (!discoveredMedications.has(slug)) {
                discoveredMedications.set(slug, { slug, category: category.replace(/-/g, ' ') });
              }
            }
          }
        });

        console.log(`  ${category}: found ${discoveredMedications.size} total medications`);
      } catch (error: any) {
        console.log(`  Error with category ${category}: ${error.message}`);
      }
    }

    console.log(`\nDiscovered ${discoveredMedications.size} unique medications. Scraping details...`);

    // Phase 2: Scrape each medication page for details
    let count = 0;
    for (const [slug, { category }] of discoveredMedications) {
      const url = `${baseUrl}/medications/${slug}/`;
      count++;

      if (count % 50 === 0) {
        console.log(`  Progress: ${count}/${discoveredMedications.size}`);
      }

      try {
        const response = await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 20000,
        });

        if (response?.status() !== 200) {
          continue;
        }

        await this.delay(1000);

        const content = await this.page.content();
        const $ = cheerio.load(content);

        // Get drug name from page title or h1
        let name = $('h1').first().text().trim();

        // Skip cookie modal text
        if (name.toLowerCase().includes('cookie') || name.toLowerCase().includes('preferences')) {
          name = $('meta[property="og:title"]').attr('content') || '';
        }

        // Fallback to slug
        if (!name || name.length < 3) {
          name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        const bodyText = $('body').text();

        // Extract price
        const priceMatches = bodyText.match(/\$(\d+(?:\.\d{2})?)/g);
        let price: number | undefined;
        if (priceMatches && priceMatches.length > 0) {
          price = parseFloat(priceMatches[0].replace('$', ''));
        }

        // Extract supply info
        const supplyMatch = bodyText.match(/(\d+)\s*(?:tablets?|capsules?|day supply)/i);
        const supply = supplyMatch ? supplyMatch[0] : undefined;

        drugs.push({
          externalName: name,
          url,
          price,
          category,
          requiresPrescription: true,
          rawData: {
            slug,
            supply,
            pricingModel: 'Manufacturer cost + 15% + $5 pharmacy fee + $5.25 shipping',
            scrapedAt: new Date().toISOString(),
          },
        });
      } catch (error: any) {
        // Skip failed pages silently
      }
    }

    console.log(`\nTotal drugs scraped: ${drugs.length}`);
    return drugs;
  }
}
