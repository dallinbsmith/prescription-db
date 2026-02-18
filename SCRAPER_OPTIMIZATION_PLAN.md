# Competitor Scraper Optimization Plan

> **Purpose**: Step-by-step guide to scan a single competitor, analyze their process, extract their complete drug offerings, and add those prescriptions to our database.
>
> **Target Audience**: AI agents or developers implementing the scraper system

---

## Phase 1: Competitor Discovery & Reconnaissance

### Step 1.1: Identify Target Competitor

Before scraping, gather basic information:

```typescript
interface CompetitorProfile {
  name: string;                    // e.g., "HIMS"
  domain: string;                  // e.g., "hims.com"
  primaryCategories: string[];     // e.g., ["ED", "Hair Loss", "Weight Loss"]
  businessModel: "telehealth" | "marketplace" | "compounding" | "discount";
  estimatedDrugCount: number;      // rough estimate from manual review
}
```

### Step 1.2: Manual Site Reconnaissance (5-10 minutes)

1. Visit the competitor's homepage
2. Identify main navigation categories (usually in header)
3. Click through to find medication/product listing pages
4. Note the URL patterns:
   - Category pages: `/category-name/`
   - Product pages: `/category/product-slug/` or `/medications/drug-name/`
   - Pricing pages: `/pricing/` or embedded in product pages
5. Check for sitemap: `{domain}/sitemap.xml` or `{domain}/sitemap`
6. Open browser DevTools (Network tab) to see if data comes from API endpoints

### Step 1.3: Document URL Patterns

Create a configuration object:

```typescript
const competitorConfig = {
  name: "COMPETITOR_NAME",
  baseUrl: "https://www.example.com",
  categories: [
    { name: "Category 1", path: "/category-1/" },
    { name: "Category 2", path: "/category-2/" },
  ],
  selectors: {
    productCard: "[data-testid='product-card'], .product-card",
    productName: "h2, h3, .product-name",
    price: ".price, [data-testid='price']",
    productLink: "a[href]",
    description: "p, .description",
  },
  pagination: {
    type: "button" | "scroll" | "url",
    nextSelector: ".pagination-next, button[aria-label='Next']",
    urlPattern: "?page={n}",
  },
  requiresJs: true,  // Does site need JavaScript rendering?
  rateLimit: 3000,   // Milliseconds between requests
};
```

---

## Phase 2: Scraper Implementation

### Step 2.1: Create Scraper File

Create a new scraper in `/backend/src/scrapers/`:

```typescript
// src/scrapers/{CompetitorName}Scraper.ts
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class CompetitorNameScraper extends BaseScraper {
  constructor() {
    super('COMPETITOR_NAME');  // Must match database competitor name (uppercase, underscores)
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.example.com';

    // Define categories to scrape
    const categories = [
      { name: 'Category 1', path: '/category-1/' },
      { name: 'Category 2', path: '/category-2/' },
    ];

    for (const category of categories) {
      const categoryDrugs = await this.scrapeCategory(baseUrl, category);
      drugs.push(...categoryDrugs);
    }

    return drugs;
  }

  private async scrapeCategory(
    baseUrl: string,
    category: { name: string; path: string }
  ): Promise<ScrapedDrug[]> {
    const drugs: ScrapedDrug[] = [];

    await this.page!.goto(`${baseUrl}${category.path}`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for dynamic content
    await this.delay(3000);

    // Handle pagination if needed
    let hasMore = true;
    let pageNum = 1;
    const maxPages = 20;

    while (hasMore && pageNum <= maxPages) {
      const content = await this.page!.content();
      const $ = cheerio.load(content);

      // Extract products from current page
      const productCards = $('[data-testid="product-card"], .product-card, .treatment-option');

      if (productCards.length === 0 && pageNum === 1) {
        console.log(`No products found for ${category.name} - check selectors`);
        break;
      }

      productCards.each((_, el) => {
        const drug = this.extractDrugFromCard($, el, baseUrl, category.name);
        if (drug) {
          drugs.push(drug);
        }
      });

      // Check for next page
      const nextButton = await this.page!.$('button[aria-label="Next page"]:not([disabled]), .pagination-next:not([disabled])');
      if (nextButton) {
        await nextButton.click();
        await this.delay();
        pageNum++;
      } else {
        hasMore = false;
      }
    }

    return drugs;
  }

  private extractDrugFromCard(
    $: cheerio.CheerioAPI,
    el: cheerio.Element,
    baseUrl: string,
    categoryName: string
  ): ScrapedDrug | null {
    const $el = $(el);

    // Extract name (try multiple selectors)
    const name = $el.find('h2, h3, .product-name, .treatment-name').first().text().trim();
    if (!name) return null;

    // Extract price
    const priceText = $el.find('[data-testid="price"], .price, .cost').text().trim();
    const priceMatch = priceText.match(/\$?([\d,.]+)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : undefined;

    // Extract URL
    const link = $el.find('a').attr('href');
    const url = link
      ? (link.startsWith('http') ? link : `${baseUrl}${link}`)
      : undefined;

    // Extract description
    const description = $el.find('p, .description, .subtitle').first().text().trim();

    // Determine if prescription required (heuristics)
    const requiresPrescription = this.detectPrescriptionRequired($el, name);

    return {
      externalName: name,
      url,
      price,
      category: categoryName,
      requiresPrescription,
      requiresConsultation: requiresPrescription, // Usually same for telehealth
      rawData: {
        description,
        priceText,
        categoryUrl: `${baseUrl}/${categoryName.toLowerCase().replace(/\s+/g, '-')}/`,
        scrapedAt: new Date().toISOString(),
      },
    };
  }

  private detectPrescriptionRequired($el: cheerio.Cheerio, name: string): boolean {
    // Check for Rx indicators in text
    const text = $el.text().toLowerCase();
    if (text.includes('prescription') || text.includes('rx required')) {
      return true;
    }

    // Known prescription drug names
    const rxDrugs = [
      'sildenafil', 'tadalafil', 'finasteride', 'tretinoin', 'semaglutide',
      'tirzepatide', 'valacyclovir', 'sertraline', 'escitalopram', 'metformin',
      'testosterone', 'estradiol', 'progesterone', 'spironolactone', 'clindamycin',
    ];

    const nameLower = name.toLowerCase();
    return rxDrugs.some(drug => nameLower.includes(drug));
  }
}
```

### Step 2.2: Register the Scraper

Add to `/backend/src/scrapers/index.ts`:

```typescript
import { CompetitorNameScraper } from './CompetitorNameScraper.js';

export const scrapers: Record<string, () => BaseScraper> = {
  // ... existing scrapers
  COMPETITOR_NAME: () => new CompetitorNameScraper(),
};
```

### Step 2.3: Test the Scraper Locally

```bash
# Run the scraper manually
cd backend
npx tsx -e "
  import { runScraper } from './src/scrapers/index.js';
  runScraper('COMPETITOR_NAME').then(console.log).catch(console.error);
"
```

---

## Phase 3: Data Extraction Strategies

### Strategy 3.1: Category Page Scraping (Most Common)

Best for: Hims, Hers, Ro, BlueChew, Keeps

```
1. Load category landing page (e.g., /erectile-dysfunction/)
2. Wait for JavaScript to render product cards
3. Extract all visible products
4. Click "Load More" or pagination if present
5. Repeat until no more products
```

### Strategy 3.2: Sitemap Parsing

Best for: Large catalogs (Nurx with 100+ birth control pills)

```typescript
const scrapeSitemap = async (sitemapUrl: string): Promise<string[]> => {
  const response = await fetch(sitemapUrl);
  const xml = await response.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const urls: string[] = [];
  $('url loc').each((_, el) => {
    const url = $(el).text();
    // Filter for medication/product URLs
    if (url.includes('/medications/') || url.includes('/products/')) {
      urls.push(url);
    }
  });

  return urls;
};
```

### Strategy 3.3: API Endpoint Discovery

Best for: React SPAs that fetch data via JSON APIs

```typescript
// In Puppeteer, intercept network requests
await this.page.setRequestInterception(true);

const apiResponses: any[] = [];

this.page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/api/') && url.includes('products')) {
    try {
      const json = await response.json();
      apiResponses.push(json);
    } catch {}
  }
});

// Navigate and let API calls happen
await this.page.goto(targetUrl, { waitUntil: 'networkidle2' });

// Now apiResponses contains the raw data
```

### Strategy 3.4: Search Functionality

Best for: Sites without good category pages

```typescript
// Use their search to find all medications
const searchTerms = [
  'sildenafil', 'tadalafil', 'finasteride', 'minoxidil',
  'semaglutide', 'tretinoin', 'sertraline', 'valacyclovir',
];

for (const term of searchTerms) {
  await this.page.goto(`${baseUrl}/search?q=${term}`);
  await this.delay(2000);
  // Extract search results
}
```

---

## Phase 4: Data Normalization

### Step 4.1: Standardize Drug Names

Create a mapping table for common variations:

```typescript
const drugNameNormalizer: Record<string, string> = {
  // Generic -> Canonical
  'generic viagra': 'Sildenafil',
  'generic cialis': 'Tadalafil',
  'generic propecia': 'Finasteride',
  'generic rogaine': 'Minoxidil',
  'generic valtrex': 'Valacyclovir',
  'generic zoloft': 'Sertraline',
  'generic lexapro': 'Escitalopram',
  'compounded semaglutide': 'Semaglutide (Compounded)',
  'ozempic': 'Semaglutide',
  'wegovy': 'Semaglutide',
  'mounjaro': 'Tirzepatide',
  'zepbound': 'Tirzepatide',
};

const normalizeDrugName = (rawName: string): string => {
  const lower = rawName.toLowerCase().trim();
  return drugNameNormalizer[lower] || rawName;
};
```

### Step 4.2: Categorize Medications

```typescript
const categoryClassifier: Record<string, string[]> = {
  'Erectile Dysfunction': ['sildenafil', 'tadalafil', 'vardenafil', 'avanafil'],
  'Hair Loss': ['finasteride', 'minoxidil', 'dutasteride'],
  'Weight Loss': ['semaglutide', 'tirzepatide', 'liraglutide', 'metformin', 'phentermine', 'contrave'],
  'Mental Health': ['sertraline', 'escitalopram', 'fluoxetine', 'bupropion', 'duloxetine', 'venlafaxine'],
  'Skincare': ['tretinoin', 'clindamycin', 'azelaic acid', 'niacinamide'],
  'Herpes': ['valacyclovir', 'acyclovir'],
  'Hormone Therapy': ['testosterone', 'estradiol', 'progesterone', 'hcg', 'enclomiphene'],
  'Birth Control': ['pill', 'patch', 'ring', 'iud'],
};

const classifyDrug = (drugName: string): string => {
  const lower = drugName.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryClassifier)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return 'Other';
};
```

### Step 4.3: Extract Pricing Data

```typescript
interface PricingInfo {
  pricePerDose?: number;
  priceMonthly?: number;
  priceQuarterly?: number;
  subscriptionRequired: boolean;
  insuranceAccepted: boolean;
}

const parsePricing = (priceText: string): PricingInfo => {
  const info: PricingInfo = {
    subscriptionRequired: false,
    insuranceAccepted: false,
  };

  // Match patterns like "$4/dose", "$25/month", "Starting at $99"
  const perDoseMatch = priceText.match(/\$([\d.]+)\s*\/?\s*(dose|pill|tablet)/i);
  if (perDoseMatch) {
    info.pricePerDose = parseFloat(perDoseMatch[1]);
  }

  const monthlyMatch = priceText.match(/\$([\d.]+)\s*\/?\s*(mo|month)/i);
  if (monthlyMatch) {
    info.priceMonthly = parseFloat(monthlyMatch[1]);
  }

  const quarterlyMatch = priceText.match(/\$([\d.]+)\s*\/?\s*(3\s*mo|quarter)/i);
  if (quarterlyMatch) {
    info.priceQuarterly = parseFloat(quarterlyMatch[1]);
  }

  // Detect subscription
  info.subscriptionRequired = /subscription|monthly plan|auto-refill/i.test(priceText);

  return info;
};
```

---

## Phase 5: Database Integration

### Step 5.1: Clear Old Data (Optional)

Before re-scraping, optionally clear previous data:

```sql
-- Only if doing a full refresh
DELETE FROM competitor_drugs WHERE competitor = 'COMPETITOR_NAME';
```

### Step 5.2: Insert New Records

The `BaseScraper.run()` method handles insertion automatically. Each `ScrapedDrug` becomes a `competitor_drugs` row:

```typescript
// This happens automatically in BaseScraper.run()
await CompetitorDrugModel.create({
  competitor: this.competitorName,
  drug_id: null,  // Not matched to FDA database yet
  external_name: drug.externalName,
  url: drug.url || null,
  price: drug.price || null,
  category: drug.category || null,
  requires_prescription: drug.requiresPrescription ?? null,
  requires_consultation: drug.requiresConsultation ?? null,
  raw_data: drug.rawData || null,
  scraped_at: scrapedAt,
});
```

### Step 5.3: Log Scrape Results

Results are automatically logged to `scrape_logs`:

```sql
SELECT * FROM scrape_logs
WHERE competitor = 'COMPETITOR_NAME'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Phase 6: Drug Matching (Optional Enhancement)

### Step 6.1: Match to FDA Database

After scraping, attempt to link competitor drugs to our FDA drugs table:

```sql
-- Find potential matches by name similarity
UPDATE competitor_drugs cd
SET drug_id = (
  SELECT d.id FROM drugs d
  WHERE LOWER(d.name) LIKE '%' || LOWER(SPLIT_PART(cd.external_name, ' ', 1)) || '%'
     OR LOWER(d.generic_name) LIKE '%' || LOWER(SPLIT_PART(cd.external_name, ' ', 1)) || '%'
  LIMIT 1
)
WHERE cd.drug_id IS NULL
  AND cd.competitor = 'COMPETITOR_NAME';
```

### Step 6.2: Manual Review Queue

Create a view for unmatched drugs requiring manual review:

```sql
CREATE VIEW unmatched_competitor_drugs AS
SELECT
  cd.id,
  cd.competitor,
  cd.external_name,
  cd.category,
  cd.url
FROM competitor_drugs cd
WHERE cd.drug_id IS NULL
ORDER BY cd.competitor, cd.external_name;
```

---

## Phase 7: Competitor-Specific Configurations

### 7.1: Hims Configuration

```typescript
const HIMS_CONFIG = {
  name: 'HIMS',
  baseUrl: 'https://www.hims.com',
  categories: [
    { name: 'Erectile Dysfunction', path: '/erectile-dysfunction' },
    { name: 'Hair Loss', path: '/hair-loss' },
    { name: 'Weight Loss', path: '/weight-loss' },
    { name: 'Mental Health', path: '/mental-health' },
    { name: 'Skin Care', path: '/skin-care' },
    { name: 'Sexual Health', path: '/sexual-health' },
  ],
  selectors: {
    productCard: '[data-testid="product-card"], .product-card, .treatment-option',
    productName: 'h2, h3, .product-name',
    price: '[data-testid="price"], .price',
    productLink: 'a',
  },
  expectedDrugs: [
    'Sildenafil', 'Tadalafil', 'Vardenafil', 'Finasteride', 'Minoxidil',
    'Semaglutide', 'Tirzepatide', 'Sertraline', 'Escitalopram', 'Tretinoin',
    'Valacyclovir',
  ],
};
```

### 7.2: Ro Configuration

```typescript
const RO_CONFIG = {
  name: 'RO',
  baseUrl: 'https://ro.co',
  categories: [
    { name: 'Erectile Dysfunction', path: '/erectile-dysfunction' },
    { name: 'Hair Loss', path: '/hair-loss' },
    { name: 'Weight Loss', path: '/weight-loss' },
    { name: 'Premature Ejaculation', path: '/premature-ejaculation' },
    { name: 'Cold Sores', path: '/cold-sores' },
    { name: 'Genital Herpes', path: '/genital-herpes' },
    { name: 'Dermatology', path: '/dermatology' },
  ],
  medicationPages: [
    '/medications/sildenafil',
    '/medications/tadalafil',
    '/medications/finasteride',
    '/medications/minoxidil',
    '/medications/oral-minoxidil',
    '/medications/valacyclovir',
    '/medications/sertraline',
    '/medications/latisse',
  ],
};
```

### 7.3: Nurx Configuration (High Volume)

```typescript
const NURX_CONFIG = {
  name: 'NURX',
  baseUrl: 'https://www.nurx.com',
  categories: [
    { name: 'Birth Control', path: '/birth-control/categories/birth-control-pill' },
    { name: 'Patch', path: '/birth-control/categories/patch' },
    { name: 'Emergency Contraception', path: '/emergencycontraception' },
    { name: 'Acne', path: '/acne-treatment' },
    { name: 'Herpes', path: '/herpes' },
  ],
  brandListPage: '/our-brands/',  // Use this for complete medication list
  expectedDrugCount: 100,  // High volume - birth control brands
};
```

### 7.4: Weight Loss Specialists

```typescript
const WEIGHT_LOSS_CONFIGS = {
  HENRY_MEDS: {
    baseUrl: 'https://henrymeds.com',
    paths: ['/semaglutide', '/tirzepatide-tablets', '/weight-management'],
    medications: ['Compounded Semaglutide', 'Compounded Tirzepatide', 'Phentermine'],
  },
  MOCHI_HEALTH: {
    baseUrl: 'https://joinmochi.com',
    paths: ['/medications', '/compounded-semaglutide-oral'],
    medications: ['Semaglutide', 'Tirzepatide', 'Metformin'],
  },
  CALIBRATE: {
    baseUrl: 'https://www.joincalibrate.com',
    paths: ['/medication', '/medications/wegovy', '/medications/ozempic'],
    medications: ['Wegovy', 'Ozempic', 'Mounjaro', 'Zepbound', 'Saxenda'],
  },
};
```

---

## Phase 8: Execution Checklist

### Pre-Scrape Checklist

- [ ] Competitor config created with correct URLs
- [ ] CSS selectors verified against live site
- [ ] Rate limiting configured (minimum 2 seconds between requests)
- [ ] User agent string set
- [ ] Error handling in place

### Scrape Execution

```bash
# 1. Start the backend server (if not running)
cd backend && npm run dev

# 2. Trigger scrape via API (as admin user)
curl -X POST http://localhost:3000/api/competitors/scrape/COMPETITOR_NAME \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Or run directly via CLI
npx tsx -e "
  import { runScraper } from './src/scrapers/index.js';
  runScraper('COMPETITOR_NAME')
    .then(r => console.log('Result:', r))
    .catch(e => console.error('Error:', e));
"
```

### Post-Scrape Verification

```sql
-- Check drug count
SELECT competitor, COUNT(*) as drug_count
FROM competitor_drugs
WHERE competitor = 'COMPETITOR_NAME'
GROUP BY competitor;

-- Check categories found
SELECT DISTINCT category, COUNT(*) as count
FROM competitor_drugs
WHERE competitor = 'COMPETITOR_NAME'
GROUP BY category
ORDER BY count DESC;

-- Check scrape log
SELECT * FROM scrape_logs
WHERE competitor = 'COMPETITOR_NAME'
ORDER BY created_at DESC
LIMIT 1;

-- Sample of drugs found
SELECT external_name, category, price, url
FROM competitor_drugs
WHERE competitor = 'COMPETITOR_NAME'
ORDER BY category, external_name
LIMIT 20;
```

---

## Appendix: Known Drug Lists by Category

### ED Medications (Complete)
```
Sildenafil (Generic Viagra) - 25mg, 50mg, 100mg
Tadalafil (Generic Cialis) - 5mg, 10mg, 20mg
Daily Tadalafil - 2.5mg, 5mg
Vardenafil (Generic Levitra) - 10mg, 20mg
Avanafil (Stendra) - 50mg, 100mg, 200mg
Alprostadil (Edex/Muse) - Injection/Suppository
```

### Hair Loss Medications (Complete)
```
Finasteride (Propecia) - 1mg oral
Topical Finasteride - 0.25%, 0.3%
Minoxidil - 2%, 5% topical solution/foam
Oral Minoxidil - 1.25mg, 2.5mg, 5mg
Dutasteride - 0.5mg oral
Ketoconazole Shampoo - 2%
```

### Weight Loss Medications (Complete)
```
Semaglutide Injectable (Wegovy/Ozempic) - 0.25mg to 2.4mg
Semaglutide Oral (Rybelsus) - 3mg, 7mg, 14mg
Compounded Semaglutide - Various strengths
Tirzepatide (Mounjaro/Zepbound) - 2.5mg to 15mg
Compounded Tirzepatide - Various strengths
Liraglutide (Saxenda) - 0.6mg to 3mg
Metformin - 500mg, 850mg, 1000mg
Phentermine - 15mg, 30mg, 37.5mg
Contrave (Naltrexone/Bupropion) - 8mg/90mg
Topiramate - 25mg, 50mg
Orlistat (Xenical) - 120mg
```

### Mental Health Medications (Complete)
```
Sertraline (Zoloft) - 25mg, 50mg, 100mg
Escitalopram (Lexapro) - 5mg, 10mg, 20mg
Fluoxetine (Prozac) - 10mg, 20mg, 40mg
Paroxetine (Paxil) - 10mg, 20mg, 40mg
Citalopram (Celexa) - 10mg, 20mg, 40mg
Bupropion XL (Wellbutrin) - 150mg, 300mg
Duloxetine (Cymbalta) - 30mg, 60mg
Venlafaxine (Effexor) - 37.5mg, 75mg, 150mg
Buspirone (Buspar) - 5mg, 10mg, 15mg
```

### Skincare Medications (Complete)
```
Tretinoin Cream - 0.025%, 0.05%, 0.1%
Tretinoin Gel - 0.01%, 0.025%
Clindamycin Phosphate - 1% solution/gel
Azelaic Acid - 15%, 20%
Niacinamide - 4%, 5%
Benzoyl Peroxide - 2.5%, 5%, 10%
Spironolactone (oral for hormonal acne) - 25mg, 50mg, 100mg
Doxycycline - 50mg, 100mg
```

---

## Summary

This plan provides a complete framework for:

1. **Discovering** a competitor's drug offerings through reconnaissance
2. **Building** a scraper using our existing infrastructure
3. **Extracting** structured data (name, price, category, URL)
4. **Normalizing** drug names and categories for consistency
5. **Storing** results in our PostgreSQL database
6. **Verifying** completeness with SQL queries

Each competitor may require slight adjustments to selectors and URL patterns, but the overall architecture remains consistent.
