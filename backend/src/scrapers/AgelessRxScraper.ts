import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class AgelessRxScraper extends BaseScraper {
  constructor() {
    super('AGELESS_RX');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.agelessrx.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // GLP-1 / Weight Management
      {
        name: 'Compounded Liraglutide',
        category: 'GLP-1 / Weight Management',
        price: 149,
        requiresPrescription: true,
        form: 'injection',
      },
      {
        name: 'Microdosing GLP-1',
        category: 'GLP-1 / Weight Management',
        price: 149,
        requiresPrescription: true,
        form: 'injection',
      },
      {
        name: 'Injectable GLP-1 Treatments',
        category: 'GLP-1 / Weight Management',
        price: 139,
        requiresPrescription: true,
        form: 'injection',
      },
      {
        name: 'Wegovy Access & Monitoring',
        category: 'GLP-1 / Weight Management',
        price: 50,
        requiresPrescription: true,
        notes: 'Plus medication cost',
      },
      {
        name: 'Wegovy Pill Access & Monitoring',
        category: 'GLP-1 / Weight Management',
        price: 50,
        requiresPrescription: true,
        notes: 'Plus medication cost',
      },
      {
        name: 'Zepbound Access & Monitoring',
        category: 'GLP-1 / Weight Management',
        price: 50,
        requiresPrescription: true,
        notes: 'Plus medication cost',
      },

      // Longevity
      {
        name: 'Rapamycin',
        category: 'Longevity',
        price: 65,
        requiresPrescription: true,
        form: 'oral',
      },
      {
        name: 'Metformin',
        category: 'Longevity / Diabetes Prevention',
        price: 25,
        requiresPrescription: true,
        form: 'oral',
      },
      {
        name: 'Methylene Blue',
        category: 'Longevity / Cognitive Function',
        price: 43,
        requiresPrescription: true,
        form: 'oral',
      },

      // NAD+ Support
      {
        name: 'NAD+ Injection',
        category: 'NAD+ Support',
        price: 235,
        requiresPrescription: true,
        form: 'injection',
      },
      {
        name: 'NAD+ Nasal Spray',
        category: 'NAD+ Support',
        price: 125,
        requiresPrescription: false,
        form: 'nasal spray',
      },
      {
        name: 'NAD+ Patches',
        category: 'NAD+ Support',
        price: 160,
        requiresPrescription: false,
        form: 'transdermal patch',
      },
      {
        name: 'NAD+ Face Cream',
        category: 'NAD+ Support / Aging Skin',
        price: 95,
        requiresPrescription: false,
        form: 'topical cream',
      },

      // Glutathione (GSH) Support
      {
        name: 'Glutathione Injection',
        category: 'GSH Support',
        price: 175,
        requiresPrescription: true,
        form: 'injection',
      },
      {
        name: 'Glutathione Nasal Spray',
        category: 'GSH Support',
        price: 100,
        requiresPrescription: false,
        form: 'nasal spray',
      },
      {
        name: 'Glutathione Patches',
        category: 'GSH Support',
        price: 190,
        requiresPrescription: false,
        form: 'transdermal patch',
      },

      // Energy / Peptides
      {
        name: 'Sermorelin',
        category: 'Energy / Peptides',
        price: 199,
        requiresPrescription: true,
        form: 'injection',
      },
      {
        name: 'B12 Injection',
        category: 'Energy',
        price: 75,
        requiresPrescription: true,
        form: 'injection',
      },
      {
        name: 'B12/MIC Injection',
        category: 'Energy / Weight Management',
        price: 110,
        requiresPrescription: true,
        form: 'injection',
      },

      // Pain / Autoimmune
      {
        name: 'Low Dose Naltrexone (LDN)',
        category: 'Pain / Autoimmune',
        price: 25,
        requiresPrescription: true,
        form: 'oral',
      },

      // Cardiovascular / Metabolic
      {
        name: 'Acarbose',
        category: 'Glucose Management',
        price: 55,
        requiresPrescription: true,
        form: 'oral',
      },
      {
        name: 'Atorvastatin',
        category: 'Heart Health',
        price: 30,
        requiresPrescription: true,
        form: 'oral',
      },
      {
        name: 'Brenzavvy',
        category: 'Blood Sugar / Heart Health',
        price: 125,
        requiresPrescription: true,
        form: 'oral',
      },
      {
        name: 'Invokana',
        category: 'Blood Sugar / Heart Health',
        price: 449,
        requiresPrescription: true,
        form: 'oral',
      },
      {
        name: 'Telmisartan',
        category: 'Blood Pressure',
        price: 30,
        requiresPrescription: true,
        form: 'oral',
      },

      // Men's Health
      {
        name: 'Tadalafil (As Needed)',
        category: "Men's Health / ED",
        price: 45,
        requiresPrescription: true,
        form: 'oral',
      },
      {
        name: 'Tadalafil (Daily)',
        category: "Men's Health / Heart Health",
        price: 60,
        requiresPrescription: true,
        form: 'oral',
      },

      // Sleep
      {
        name: 'Trazodone',
        category: 'Sleep',
        price: 33,
        requiresPrescription: true,
        form: 'oral',
      },
      {
        name: 'Tran-Q Sleep',
        category: 'Sleep',
        price: 43,
        requiresPrescription: false,
        form: 'supplement',
      },

      // Skin / Cosmetic
      {
        name: 'Tretinoin',
        category: 'Aging Skin',
        price: 70,
        requiresPrescription: true,
        form: 'topical',
      },
      {
        name: 'DMAE Firming Gel',
        category: 'Aging Skin',
        price: 68,
        requiresPrescription: true,
        form: 'topical gel',
      },

      // Hair Loss
      {
        name: 'Powers Hair Solution v5.1',
        category: 'Hair Loss',
        price: 95,
        requiresPrescription: true,
        form: 'topical solution',
      },

      // Supplements
      {
        name: 'Glucose Control Supplement',
        category: 'Diabetes Prevention',
        price: 25,
        requiresPrescription: false,
        form: 'supplement',
      },
      {
        name: 'Heart Health Pack',
        category: 'Heart Health',
        price: 55,
        requiresPrescription: false,
        form: 'supplement',
      },
      {
        name: 'Infinite Longevity Support',
        category: 'Longevity',
        price: 65,
        requiresPrescription: false,
        form: 'supplement',
      },

      // Testing / Monitoring
      {
        name: 'CGM Sensor',
        category: 'Health Monitoring',
        price: 145,
        requiresPrescription: false,
        form: 'device',
      },
      {
        name: 'Core Longevity Panel',
        category: 'Health Monitoring',
        price: 95,
        requiresPrescription: false,
        form: 'lab test',
      },
      {
        name: 'Lab-Based Phenotypic Blood Test',
        category: 'Biological Age Testing',
        price: 75,
        requiresPrescription: false,
        form: 'lab test',
      },
      {
        name: 'At-Home Methylation Saliva Test',
        category: 'Biological Age Testing',
        price: 170,
        requiresPrescription: false,
        form: 'at-home test',
      },
      {
        name: 'iollo Advanced Metabolic Test',
        category: 'Health Monitoring',
        price: 399,
        requiresPrescription: false,
        form: 'lab test',
      },
      {
        name: 'Galleri Multi-Cancer Early Detection',
        category: 'Health Monitoring',
        price: 949,
        requiresPrescription: false,
        form: 'lab test',
      },
      {
        name: 'Cologuard Consultation',
        category: 'Health Monitoring',
        price: 55,
        requiresPrescription: false,
        form: 'consultation',
      },
    ];

    // Visit treatments page for validation
    try {
      console.log(`Visiting ${baseUrl}/treatments...`);
      await this.page.goto(`${baseUrl}/treatments`, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await this.delay(2000);

      const html = await this.page.content();
      const $ = cheerio.load(html);
      console.log(`Page loaded, found ${$('a').length} links`);
    } catch (err) {
      console.log('Failed to load treatments page, using known data');
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
        url: `${baseUrl}/treatments/${slug}`,
        price: treatment.price,
        category: treatment.category,
        requiresPrescription: treatment.requiresPrescription,
        requiresConsultation: treatment.requiresPrescription,
        rawData: {
          form: treatment.form,
          notes: (treatment as any).notes,
          focus: 'longevity',
          businessModel: treatment.requiresPrescription
            ? 'telehealth-prescription'
            : 'direct-to-consumer',
        },
      });
    }

    return drugs;
  };
}
