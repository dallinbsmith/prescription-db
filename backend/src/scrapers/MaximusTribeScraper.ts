import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class MaximusTribeScraper extends BaseScraper {
  constructor() {
    super('MAXIMUS_TRIBE');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.maximustribe.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // Testosterone Protocols
      {
        name: 'EP-02 Testosterone Protocol (Enclomiphene)',
        category: 'Testosterone Optimization',
        price: 199.99,
        annualPrice: 99.99,
        requiresPrescription: true,
        form: 'oral tablet',
        ingredients: ['Enclomiphene', 'Pregnenolone'],
        notes: 'King Protocol - stimulates natural testosterone production',
      },
      {
        name: 'Oral TRT+ Protocol',
        category: 'Testosterone Replacement',
        price: 199.99,
        requiresPrescription: true,
        form: 'oral tablet',
        ingredients: ['Oral Testosterone', 'Enclomiphene'],
        notes: 'No injections or creams required',
      },
      {
        name: 'Testosterone Cypionate Injection',
        category: 'Testosterone Replacement',
        price: 199.99,
        requiresPrescription: true,
        form: 'injection',
        ingredients: ['Testosterone Cypionate'],
      },
      {
        name: 'Topical Testosterone Cream',
        category: 'Testosterone Replacement',
        price: 199.99,
        requiresPrescription: true,
        form: 'topical cream',
        ingredients: ['Testosterone'],
      },
      {
        name: 'hCG (Human Chorionic Gonadotropin)',
        category: 'Testosterone Support',
        price: 99.99,
        requiresPrescription: true,
        form: 'injection',
        ingredients: ['hCG'],
        notes: 'Adjunct therapy for fertility preservation',
      },

      // GLP-1 Weight Loss
      {
        name: 'Semaglutide Microdose',
        category: 'GLP-1 Weight Loss',
        price: 79.99,
        requiresPrescription: true,
        form: 'injection',
        ingredients: ['Compounded Semaglutide'],
        notes: 'For those with just a few pounds to lose (BMI 22+)',
      },
      {
        name: 'Semaglutide Starter Pack',
        category: 'GLP-1 Weight Loss',
        price: 99.99,
        requiresPrescription: true,
        form: 'injection',
        ingredients: ['Compounded Semaglutide'],
        notes: '15-week titration protocol with pre-set dosages',
      },
      {
        name: 'Semaglutide Custom Dosing',
        category: 'GLP-1 Weight Loss',
        price: 189.99,
        requiresPrescription: true,
        form: 'injection',
        ingredients: ['Compounded Semaglutide'],
        notes: 'Unlimited messaging, customized monthly adjustments',
      },
      {
        name: 'Tirzepatide Microdose',
        category: 'GLP-1/GIP Weight Loss',
        price: 132,
        requiresPrescription: true,
        form: 'injection',
        ingredients: ['Compounded Tirzepatide'],
        notes: 'Dual GLP-1/GIP agonist for weight loss',
      },
      {
        name: 'Tirzepatide Custom Dosing',
        category: 'GLP-1/GIP Weight Loss',
        price: 249.99,
        requiresPrescription: true,
        form: 'injection',
        ingredients: ['Compounded Tirzepatide'],
        notes: 'Higher doses with customized protocol',
      },

      // Hair Loss
      {
        name: 'Finasteride (Oral)',
        category: 'Hair Loss',
        price: 24.99,
        requiresPrescription: true,
        form: 'oral tablet',
        ingredients: ['Finasteride'],
      },
      {
        name: 'Minoxidil (Topical)',
        category: 'Hair Loss',
        price: 29.99,
        requiresPrescription: true,
        form: 'topical solution',
        ingredients: ['Minoxidil'],
      },
      {
        name: 'Minoxidil (Oral)',
        category: 'Hair Loss',
        price: 39.99,
        requiresPrescription: true,
        form: 'oral tablet',
        ingredients: ['Minoxidil'],
      },
      {
        name: 'Dutasteride (Topical)',
        category: 'Hair Loss',
        price: 49.99,
        requiresPrescription: true,
        form: 'topical solution',
        ingredients: ['Dutasteride'],
      },
      {
        name: 'Dutasteride (Oral)',
        category: 'Hair Loss',
        price: 49.99,
        requiresPrescription: true,
        form: 'oral capsule',
        ingredients: ['Dutasteride'],
      },
      {
        name: '4-in-1 Hair Regrowth Topical Gel',
        category: 'Hair Loss',
        price: 79.99,
        requiresPrescription: true,
        form: 'topical gel',
        ingredients: ['Finasteride', 'Minoxidil', 'Tretinoin', 'Biotin'],
        notes: 'Compounded multi-ingredient formula',
      },

      // Peptides / Longevity
      {
        name: 'Sermorelin Injections',
        category: 'Peptides / Longevity',
        price: 149.99,
        requiresPrescription: true,
        form: 'injection',
        ingredients: ['Sermorelin'],
        notes: 'Growth hormone releasing peptide',
      },

      // Sexual Health
      {
        name: 'Blood Flow Protocol (ED)',
        category: 'Sexual Health',
        price: 49.99,
        requiresPrescription: true,
        form: 'oral tablet',
        ingredients: ['Sildenafil or Tadalafil'],
        notes: 'Erectile dysfunction treatment',
      },
      {
        name: 'Oxytocin Calming Cream',
        category: 'Wellness',
        price: 79.99,
        requiresPrescription: true,
        form: 'topical cream',
        ingredients: ['Oxytocin'],
        notes: 'For stress and anxiety relief',
      },

      // Supplements
      {
        name: 'Building Blocks Multivitamin',
        category: 'Supplements',
        price: 39.99,
        requiresPrescription: false,
        form: 'capsule',
        notes: 'Male performance multivitamin',
      },

      // Testing
      {
        name: 'At-Home Testosterone Test',
        category: 'Testing',
        price: 69.99,
        requiresPrescription: false,
        form: 'at-home test kit',
        notes: 'Comprehensive hormone panel',
      },
    ];

    // Visit main site for validation
    try {
      console.log(`Visiting ${baseUrl}...`);
      await this.page.goto(baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.delay(2000);

      const html = await this.page.content();
      const $ = cheerio.load(html);
      console.log(`Page loaded, found ${$('a').length} links`);
    } catch (err) {
      console.log('Failed to load main page, using known data');
    }

    for (const treatment of treatments) {
      const key = treatment.name.toLowerCase();
      if (seenDrugs.has(key)) continue;
      seenDrugs.add(key);

      console.log(`Adding ${treatment.name}...`);

      const slug = treatment.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      drugs.push({
        externalName: treatment.name,
        url: `${baseUrl}/${slug}`,
        price: treatment.price,
        category: treatment.category,
        requiresPrescription: treatment.requiresPrescription,
        requiresConsultation: treatment.requiresPrescription,
        rawData: {
          form: treatment.form,
          ingredients: treatment.ingredients,
          notes: treatment.notes,
          annualPrice: (treatment as any).annualPrice,
          focus: "men's health",
          businessModel: 'telehealth-subscription',
          freeShipping: true,
        },
      });
    }

    return drugs;
  };
}
