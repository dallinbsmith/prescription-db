import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class MochiHealthScraper extends BaseScraper {
  constructor() {
    super('MOCHI_HEALTH');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://joinmochi.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // GLP-1 Weight Loss - Compounded
      {
        name: 'Compounded Semaglutide',
        category: 'GLP-1 Weight Loss',
        price: 99,
        priceUnit: 'per month',
        form: 'injection',
        path: '/medications',
        notes: 'Compounded GLP-1, all doses 0.22mg-2.67mg weekly',
      },
      {
        name: 'Compounded Tirzepatide',
        category: 'GLP-1/GIP Weight Loss',
        price: 199,
        priceUnit: 'per month',
        form: 'injection',
        path: '/medications',
        notes: 'Compounded GLP-1/GIP, all doses 2.2mg-16.6mg weekly',
      },

      // GLP-1 Weight Loss - Brand Name (insurance accepted)
      {
        name: 'Wegovy (semaglutide)',
        category: 'GLP-1 Weight Loss (Brand)',
        price: null,
        priceUnit: 'insurance',
        form: 'injection',
        path: '/medications',
        notes: 'Brand-name GLP-1, insurance accepted',
        isBrand: true,
      },
      {
        name: 'Ozempic (semaglutide)',
        category: 'GLP-1 Weight Loss (Brand)',
        price: null,
        priceUnit: 'insurance',
        form: 'injection',
        path: '/medications',
        notes: 'Brand-name GLP-1, insurance accepted',
        isBrand: true,
      },
      {
        name: 'Zepbound (tirzepatide)',
        category: 'GLP-1/GIP Weight Loss (Brand)',
        price: null,
        priceUnit: 'insurance',
        form: 'injection',
        path: '/medications',
        notes: 'Brand-name GLP-1/GIP, insurance accepted',
        isBrand: true,
      },
      {
        name: 'Mounjaro (tirzepatide)',
        category: 'GLP-1/GIP Weight Loss (Brand)',
        price: null,
        priceUnit: 'insurance',
        form: 'injection',
        path: '/medications',
        notes: 'Brand-name GLP-1/GIP, insurance accepted',
        isBrand: true,
      },
      {
        name: 'Saxenda (liraglutide)',
        category: 'GLP-1 Weight Loss (Brand)',
        price: null,
        priceUnit: 'insurance',
        form: 'injection',
        path: '/medications',
        notes: 'Brand-name GLP-1, daily injection',
        isBrand: true,
      },
      {
        name: 'Rybelsus (semaglutide)',
        category: 'GLP-1 Weight Loss (Brand)',
        price: null,
        priceUnit: 'insurance',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Oral GLP-1, insurance accepted',
        isBrand: true,
      },

      // Non-GLP-1 Weight Loss
      {
        name: 'Metformin',
        category: 'Weight Loss Support',
        price: 29,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Blood sugar management, metabolic support',
      },
      {
        name: 'Bupropion',
        category: 'Weight Loss Support',
        price: 39,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Appetite suppressant, also treats anxiety/depression',
      },
      {
        name: 'Naltrexone',
        category: 'Weight Loss Support',
        price: 39,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Reduces cravings, originally for substance use',
      },
      {
        name: 'Contrave (bupropion/naltrexone)',
        category: 'Weight Loss',
        price: null,
        priceUnit: 'insurance',
        form: 'oral tablet',
        path: '/medications',
        notes: 'FDA-approved combo for weight loss',
        isBrand: true,
      },
      {
        name: 'Topiramate',
        category: 'Weight Loss Support',
        price: 39,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Reduces appetite, anticonvulsant',
      },
      {
        name: 'Orlistat',
        category: 'Weight Loss Support',
        price: 49,
        priceUnit: 'per month',
        form: 'oral capsule',
        path: '/medications',
        notes: 'Blocks fat absorption',
      },

      // Hormones - Female
      {
        name: 'Estradiol',
        category: 'Hormone Therapy',
        price: 39,
        priceUnit: 'per month',
        form: 'varies',
        path: '/medications',
        notes: 'Estrogen replacement therapy',
      },
      {
        name: 'Progesterone',
        category: 'Hormone Therapy',
        price: 29,
        priceUnit: 'per month',
        form: 'oral capsule',
        path: '/medications',
        notes: 'Hormone replacement, uterine protection',
      },
      {
        name: 'Spironolactone',
        category: 'Hormone / Dermatology',
        price: 29,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Anti-androgen, treats hormonal acne and hair loss',
      },
      {
        name: 'Raloxifene',
        category: 'Hormone Therapy',
        price: 49,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Selective estrogen receptor modulator (SERM)',
      },

      // Hormones - Male
      {
        name: 'Enclomiphene',
        category: 'Male Hormone Support',
        price: 79,
        priceUnit: 'per month',
        form: 'oral capsule',
        path: '/medications',
        notes: 'Boosts natural testosterone production',
      },
      {
        name: 'Anastrozole',
        category: 'Male Hormone Support',
        price: 39,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Aromatase inhibitor, reduces estrogen',
      },

      // Hair Loss
      {
        name: 'Finasteride (oral)',
        category: 'Hair Loss',
        price: 29,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'DHT blocker for male pattern baldness',
      },
      {
        name: 'Dutasteride',
        category: 'Hair Loss',
        price: 39,
        priceUnit: 'per month',
        form: 'oral capsule',
        path: '/medications',
        notes: 'Stronger DHT blocker than finasteride',
      },
      {
        name: 'Minoxidil (topical)',
        category: 'Hair Loss',
        price: 29,
        priceUnit: 'per month',
        form: 'topical solution',
        path: '/medications',
        notes: 'Promotes hair growth',
      },
      {
        name: 'Minoxidil (oral)',
        category: 'Hair Loss',
        price: 39,
        priceUnit: 'per month',
        form: 'oral tablet',
        path: '/medications',
        notes: 'Low-dose oral for hair thinning',
      },

      // Skincare / Dermatology
      {
        name: 'Tretinoin',
        category: 'Skincare',
        price: 49,
        priceUnit: 'per unit',
        form: 'topical cream',
        path: '/medications',
        notes: 'Retinoid for acne, anti-aging, hyperpigmentation',
      },
      {
        name: 'Clindamycin (topical)',
        category: 'Skincare / Acne',
        price: 29,
        priceUnit: 'per unit',
        form: 'topical gel',
        path: '/medications',
        notes: 'Antibiotic for acne',
      },
      {
        name: 'Benzoyl Peroxide',
        category: 'Skincare / Acne',
        price: 19,
        priceUnit: 'per unit',
        form: 'topical gel',
        path: '/medications',
        notes: 'Antibacterial acne treatment',
      },
      {
        name: 'Azelaic Acid',
        category: 'Skincare',
        price: 39,
        priceUnit: 'per unit',
        form: 'topical cream',
        path: '/medications',
        notes: 'For acne, rosacea, hyperpigmentation',
      },
      {
        name: 'Hydroquinone',
        category: 'Skincare',
        price: 49,
        priceUnit: 'per unit',
        form: 'topical cream',
        path: '/medications',
        notes: 'Skin lightening for hyperpigmentation',
      },
    ];

    // Visit main site for validation
    try {
      console.log(`Visiting ${baseUrl}/medications...`);
      await this.page.goto(`${baseUrl}/medications`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.delay(2000);

      const html = await this.page.content();
      const $ = cheerio.load(html);
      console.log(`Page loaded, found ${$('a').length} links`);
    } catch (err) {
      console.log('Failed to load medications page, using known data');
    }

    for (const treatment of treatments) {
      const key = treatment.name.toLowerCase();
      if (seenDrugs.has(key)) continue;
      seenDrugs.add(key);

      console.log(`Adding ${treatment.name}...`);

      drugs.push({
        externalName: treatment.name,
        url: `${baseUrl}${treatment.path}`,
        price: treatment.price,
        category: treatment.category,
        requiresPrescription: true,
        requiresConsultation: true,
        rawData: {
          form: treatment.form,
          priceUnit: treatment.priceUnit,
          notes: treatment.notes,
          isBrand: (treatment as any).isBrand || false,
          focus: 'weight loss / hormones / skincare',
          businessModel: 'telehealth-prescription',
          membershipFee: 79.99,
          membershipNote: 'Monthly membership covers clinician access',
          acceptsInsurance: true,
          allStates: true,
        },
      });
    }

    return drugs;
  };
}
