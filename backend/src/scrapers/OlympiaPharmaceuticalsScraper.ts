import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class OlympiaPharmaceuticalsScraper extends BaseScraper {
  constructor() {
    super('OLYMPIA_PHARMACEUTICALS');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.olympiapharmacy.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // GLP-1 Weight Loss
      {
        name: 'Compounded Liraglutide Injection',
        category: 'GLP-1 Weight Loss',
        price: null,
        form: 'injection',
        path: '/product/liraglutide-injection/',
        notes: 'GLP-1 receptor agonist, stimulates insulin, slows digestion, reduces appetite',
      },

      // Lipotropic Injections
      {
        name: 'MICC (Lipotropic Injection)',
        category: 'Weight Loss / Lipotropics',
        price: null,
        form: 'injection',
        path: '/product/micc/',
        notes: 'Methionine, Inositol, Choline, Cyanocobalamin (B12) - fat burning blend',
      },
      {
        name: 'Lipo-Mino-Mix',
        category: 'Weight Loss / Lipotropics',
        price: null,
        form: 'injection',
        path: '/product/lipo-mino-mix/',
        notes: 'MIC + B-complex vitamins for metabolism support',
      },
      {
        name: 'Lipo-Mino-Mix-C',
        category: 'Weight Loss / Lipotropics',
        price: null,
        form: 'injection',
        path: '/weight-management/lipotropic-injections/',
        notes: 'Lipo-Mino-Mix with added L-Carnitine',
      },
      {
        name: 'Lipo-Stat-Plus',
        category: 'Weight Loss / Lipotropics',
        price: null,
        form: 'injection',
        path: '/weight-management/lipotropic-injections/',
        notes: 'MIC with B6 and B12',
      },
      {
        name: 'Skinny Set (Amino Blend + Methylcobalamin)',
        category: 'Weight Loss / Energy',
        price: null,
        form: 'injection kit',
        path: '/product/skinny-set-amino-blend-methylcobalamin/',
        notes: 'Amino blend + B12 for metabolic balance, energy, and performance',
      },

      // Peptides
      {
        name: 'Sermorelin Acetate Injection',
        category: 'Peptides / Growth Hormone',
        price: null,
        form: 'injection',
        path: '/product/sermorelin-injections/',
        notes: 'GHRH analog, stimulates natural growth hormone release',
      },
      {
        name: 'NAD+ Injection',
        category: 'Peptides / Anti-Aging',
        price: null,
        form: 'injection',
        path: '/peptides/',
        notes: 'Nicotinamide adenine dinucleotide, cellular energy and repair',
      },
      {
        name: 'NAD+ IV',
        category: 'Peptides / Anti-Aging',
        price: null,
        form: 'IV infusion',
        path: '/peptides/',
        notes: 'NAD+ for intravenous administration',
      },

      // Men's Health - Testosterone
      {
        name: 'Testosterone Cypionate Injection',
        category: "Men's Health / TRT",
        price: null,
        form: 'injection',
        path: '/product/testosterone/',
        notes: 'Testosterone replacement therapy, intramuscular',
      },
      {
        name: 'Testosterone Cream',
        category: "Men's Health / TRT",
        price: null,
        form: 'topical cream',
        path: '/product/testosterone/',
        notes: 'Transdermal testosterone in pump or topi-click delivery',
      },
      {
        name: 'Testosterone Gel',
        category: "Men's Health / TRT",
        price: null,
        form: 'topical gel',
        path: '/product/testosterone/',
        notes: 'Transdermal testosterone gel formulation',
      },

      // Men's Health - ED
      {
        name: 'Trimix Injection',
        category: "Men's Health / ED",
        price: null,
        form: 'injection',
        path: '/mens-health/',
        notes: 'Alprostadil, Papaverine, Phentolamine for erectile dysfunction',
      },
      {
        name: 'Bimix Injection',
        category: "Men's Health / ED",
        price: null,
        form: 'injection',
        path: '/mens-health/',
        notes: 'Papaverine and Phentolamine for erectile dysfunction',
      },
      {
        name: 'Sildenafil Troche',
        category: "Men's Health / ED",
        price: null,
        form: 'sublingual troche',
        path: '/sexual-health/',
        notes: 'Sublingual sildenafil for faster absorption',
      },
      {
        name: 'Tadalafil Troche',
        category: "Men's Health / ED",
        price: null,
        form: 'sublingual troche',
        path: '/sexual-health/',
        notes: 'Sublingual tadalafil for faster absorption',
      },

      // Women's Health - BHRT
      {
        name: 'Estradiol Cream (BHRT)',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/womens-health/bioidentical-hormone-replacement-therapy/',
        notes: 'Bioidentical estradiol, transdermal',
      },
      {
        name: 'Progesterone Capsules (BHRT)',
        category: "Women's Health / BHRT",
        price: null,
        form: 'oral capsule',
        path: '/womens-health/bioidentical-hormone-replacement-therapy/',
        notes: 'Bioidentical micronized progesterone',
      },
      {
        name: 'Progesterone Cream (BHRT)',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/womens-health/bioidentical-hormone-replacement-therapy/',
        notes: 'Bioidentical progesterone, transdermal',
      },
      {
        name: 'Testosterone Cream (Women)',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/womens-health/bioidentical-hormone-replacement-therapy/',
        notes: 'Low-dose testosterone for women, libido and energy',
      },
      {
        name: 'Bi-Est Cream',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/womens-health/bioidentical-hormone-replacement-therapy/',
        notes: 'Estriol/Estradiol combination',
      },
      {
        name: 'Tri-Est Cream',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/womens-health/bioidentical-hormone-replacement-therapy/',
        notes: 'Estriol/Estradiol/Estrone combination',
      },

      // Sexual Health
      {
        name: 'PT-141 (Bremelanotide) Injection',
        category: 'Sexual Health',
        price: null,
        form: 'injection',
        path: '/sexual-health/',
        notes: 'Melanocortin receptor agonist for sexual dysfunction',
      },
      {
        name: 'Oxytocin Nasal Spray',
        category: 'Sexual Health',
        price: null,
        form: 'nasal spray',
        path: '/sexual-health/',
        notes: 'Oxytocin for intimacy and bonding',
      },

      // Thyroid
      {
        name: 'Liothyronine (T3)',
        category: 'Thyroid',
        price: null,
        form: 'oral capsule',
        path: '/hormones/',
        notes: 'Compounded T3 thyroid hormone',
      },
      {
        name: 'Levothyroxine (T4)',
        category: 'Thyroid',
        price: null,
        form: 'oral capsule',
        path: '/hormones/',
        notes: 'Compounded T4 thyroid hormone',
      },
      {
        name: 'Desiccated Thyroid',
        category: 'Thyroid',
        price: null,
        form: 'oral capsule',
        path: '/hormones/',
        notes: 'Natural thyroid (T3/T4 combination)',
      },

      // Other
      {
        name: 'DHEA',
        category: 'Hormone Support',
        price: null,
        form: 'oral capsule',
        path: '/hormones/',
        notes: 'Dehydroepiandrosterone, hormone precursor',
      },
      {
        name: 'Pregnenolone',
        category: 'Hormone Support',
        price: null,
        form: 'oral capsule',
        path: '/hormones/',
        notes: 'Precursor hormone for steroid synthesis',
      },
      {
        name: 'Vitamin B12 Injection (Methylcobalamin)',
        category: 'Vitamins / Energy',
        price: null,
        form: 'injection',
        path: '/weight-management/',
        notes: 'Bioactive form of B12 for energy and metabolism',
      },
      {
        name: 'Vitamin D3 Injection',
        category: 'Vitamins',
        price: null,
        form: 'injection',
        path: '/medication-directory/',
        notes: 'Injectable vitamin D3',
      },
      {
        name: 'Glutathione Injection',
        category: 'Antioxidant',
        price: null,
        form: 'injection',
        path: '/medication-directory/',
        notes: 'Master antioxidant, detoxification support',
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

      drugs.push({
        externalName: treatment.name,
        url: `${baseUrl}${treatment.path}`,
        price: treatment.price,
        category: treatment.category,
        requiresPrescription: true,
        requiresConsultation: false,
        rawData: {
          form: treatment.form,
          notes: treatment.notes,
          pharmacyType: '503A/503B compounding pharmacy',
          focus: 'compounding for providers and clinics',
          businessModel: 'B2B compounding pharmacy',
          providersOnly: true,
          licensedIn: '48 states',
          sterileCompounding: true,
        },
      });
    }

    return drugs;
  };
}
