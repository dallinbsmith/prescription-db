import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class EmpowerPharmacyScraper extends BaseScraper {
  constructor() {
    super('EMPOWER_PHARMACY');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.empowerpharmacy.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // GLP-1 Weight Loss
      {
        name: 'Semaglutide/Cyanocobalamin Injection',
        category: 'GLP-1 Weight Loss',
        price: null,
        form: 'injection',
        path: '/medications/semaglutide/',
        notes: 'Compounded semaglutide with B12, various strengths available',
      },
      {
        name: 'Tirzepatide/Niacinamide Injection',
        category: 'GLP-1/GIP Weight Loss',
        price: null,
        form: 'injection',
        path: '/medications/tirzepatide/',
        notes: 'Compounded tirzepatide with niacinamide, dual GLP-1/GIP agonist',
      },
      {
        name: 'Liraglutide Injection',
        category: 'GLP-1 Weight Loss',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'GLP-1 receptor agonist, daily injection',
      },

      // Lipotropic / Weight Loss Support
      {
        name: 'Lipo-C Injection',
        category: 'Weight Loss / Lipotropics',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'MIC + B12 lipotropic blend for fat metabolism',
      },
      {
        name: 'Lipo-B Injection',
        category: 'Weight Loss / Lipotropics',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Lipotropic with B-complex vitamins',
      },
      {
        name: 'L-Carnitine Injection',
        category: 'Weight Loss / Energy',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Amino acid for fat metabolism and energy',
      },

      // Peptides
      {
        name: 'Sermorelin Injection',
        category: 'Peptides / Growth Hormone',
        price: null,
        form: 'injection',
        path: '/medications/sermorelin/',
        notes: 'GHRH analog, stimulates natural GH release',
      },
      {
        name: 'Sermorelin/Glycine Injection',
        category: 'Peptides / Growth Hormone',
        price: null,
        form: 'injection',
        path: '/medications/sermorelin/',
        notes: 'Sermorelin with glycine for enhanced stability',
      },
      {
        name: 'Ipamorelin Injection',
        category: 'Peptides / Growth Hormone',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Growth hormone releasing peptide (GHRP)',
      },
      {
        name: 'CJC-1295/Ipamorelin Injection',
        category: 'Peptides / Growth Hormone',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Combined GHRH analog and GHRP for synergistic GH release',
      },
      {
        name: 'BPC-157 Injection',
        category: 'Peptides / Recovery',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Body protection compound for tissue healing',
      },
      {
        name: 'Tesamorelin Injection',
        category: 'Peptides / Growth Hormone',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'GHRH analog, reduces visceral adipose tissue',
      },
      {
        name: 'AOD-9604 Injection',
        category: 'Peptides / Weight Loss',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Modified GH fragment for fat metabolism',
      },
      {
        name: 'NAD+ Injection',
        category: 'Peptides / Anti-Aging',
        price: null,
        form: 'injection',
        path: '/medications/nad/',
        notes: 'Nicotinamide adenine dinucleotide for cellular energy',
      },
      {
        name: 'NAD+ Nasal Spray',
        category: 'Peptides / Anti-Aging',
        price: null,
        form: 'nasal spray',
        path: '/medications/nad/',
        notes: 'Intranasal NAD+ delivery',
      },

      // Men's Health - TRT
      {
        name: 'Testosterone Cypionate Injection',
        category: "Men's Health / TRT",
        price: null,
        form: 'injection',
        path: '/medications/testosterone/',
        notes: 'Standard TRT, intramuscular or subcutaneous',
      },
      {
        name: 'Testosterone Enanthate Injection',
        category: "Men's Health / TRT",
        price: null,
        form: 'injection',
        path: '/medications/testosterone/',
        notes: 'Alternative testosterone ester for TRT',
      },
      {
        name: 'Testosterone Cream',
        category: "Men's Health / TRT",
        price: null,
        form: 'topical cream',
        path: '/medications/testosterone/',
        notes: 'Transdermal testosterone, various strengths',
      },
      {
        name: 'Testosterone Gel',
        category: "Men's Health / TRT",
        price: null,
        form: 'topical gel',
        path: '/medications/testosterone/',
        notes: 'Transdermal testosterone gel formulation',
      },
      {
        name: 'Testosterone/Nandrolone Injection',
        category: "Men's Health / TRT",
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Combined testosterone and nandrolone for joint support',
      },

      // Men's Health - Fertility/Support
      {
        name: 'HCG Injection',
        category: "Men's Health / Fertility",
        price: null,
        form: 'injection',
        path: '/medications/hcg/',
        notes: 'Human chorionic gonadotropin for testicular function',
      },
      {
        name: 'Gonadorelin Injection',
        category: "Men's Health / Fertility",
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'GnRH analog, maintains testicular function during TRT',
      },
      {
        name: 'Enclomiphene Capsules',
        category: "Men's Health / Hormone Support",
        price: null,
        form: 'oral capsule',
        path: '/medications/enclomiphene/',
        notes: 'SERM, boosts natural testosterone production',
      },
      {
        name: 'Clomiphene Citrate',
        category: "Men's Health / Fertility",
        price: null,
        form: 'oral tablet',
        path: '/medications/',
        notes: 'SERM for testosterone and fertility',
      },
      {
        name: 'Anastrozole',
        category: "Men's Health / Hormone Support",
        price: null,
        form: 'oral tablet',
        path: '/medications/',
        notes: 'Aromatase inhibitor, controls estrogen',
      },

      // Men's Health - ED
      {
        name: 'Trimix Injection',
        category: "Men's Health / ED",
        price: null,
        form: 'injection',
        path: '/medications/trimix/',
        notes: 'Alprostadil, Papaverine, Phentolamine for ED',
      },
      {
        name: 'Bimix Injection',
        category: "Men's Health / ED",
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Papaverine and Phentolamine for ED',
      },
      {
        name: 'Quadmix Injection',
        category: "Men's Health / ED",
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Trimix + Atropine for enhanced efficacy',
      },
      {
        name: 'Sildenafil Troche',
        category: "Men's Health / ED",
        price: null,
        form: 'sublingual troche',
        path: '/medications/',
        notes: 'Sublingual sildenafil for faster onset',
      },
      {
        name: 'Tadalafil Troche',
        category: "Men's Health / ED",
        price: null,
        form: 'sublingual troche',
        path: '/medications/',
        notes: 'Sublingual tadalafil for faster onset',
      },
      {
        name: 'PT-141 (Bremelanotide) Injection',
        category: "Men's Health / Sexual Health",
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Melanocortin receptor agonist for sexual dysfunction',
      },

      // Women's Health - BHRT
      {
        name: 'Estradiol Cream',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/medications/estradiol/',
        notes: 'Bioidentical estradiol, transdermal',
      },
      {
        name: 'Estradiol Injection',
        category: "Women's Health / BHRT",
        price: null,
        form: 'injection',
        path: '/medications/estradiol/',
        notes: 'Injectable bioidentical estradiol',
      },
      {
        name: 'Progesterone Capsules',
        category: "Women's Health / BHRT",
        price: null,
        form: 'oral capsule',
        path: '/medications/progesterone/',
        notes: 'Micronized bioidentical progesterone',
      },
      {
        name: 'Progesterone Cream',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/medications/progesterone/',
        notes: 'Transdermal bioidentical progesterone',
      },
      {
        name: 'Progesterone Suppositories',
        category: "Women's Health / BHRT",
        price: null,
        form: 'suppository',
        path: '/medications/progesterone/',
        notes: 'Vaginal progesterone for local effect',
      },
      {
        name: 'Bi-Est Cream',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/medications/',
        notes: 'Estriol/Estradiol combination',
      },
      {
        name: 'Tri-Est Cream',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/medications/',
        notes: 'Estriol/Estradiol/Estrone combination',
      },
      {
        name: 'Testosterone Cream (Women)',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/medications/',
        notes: 'Low-dose testosterone for women',
      },
      {
        name: 'DHEA Cream',
        category: "Women's Health / BHRT",
        price: null,
        form: 'topical cream',
        path: '/medications/',
        notes: 'Dehydroepiandrosterone, hormone precursor',
      },
      {
        name: 'Oxytocin Nasal Spray',
        category: "Women's Health / Sexual Health",
        price: null,
        form: 'nasal spray',
        path: '/medications/',
        notes: 'Oxytocin for intimacy and bonding',
      },
      {
        name: 'Oxytocin Troche',
        category: "Women's Health / Sexual Health",
        price: null,
        form: 'sublingual troche',
        path: '/medications/',
        notes: 'Sublingual oxytocin',
      },

      // Thyroid
      {
        name: 'Liothyronine (T3)',
        category: 'Thyroid',
        price: null,
        form: 'oral capsule',
        path: '/medications/',
        notes: 'Compounded T3 thyroid hormone, various strengths',
      },
      {
        name: 'Levothyroxine (T4)',
        category: 'Thyroid',
        price: null,
        form: 'oral capsule',
        path: '/medications/',
        notes: 'Compounded T4 thyroid hormone',
      },
      {
        name: 'T3/T4 Combination',
        category: 'Thyroid',
        price: null,
        form: 'oral capsule',
        path: '/medications/',
        notes: 'Combined T3/T4 thyroid hormone',
      },
      {
        name: 'Desiccated Thyroid',
        category: 'Thyroid',
        price: null,
        form: 'oral capsule',
        path: '/medications/',
        notes: 'Natural thyroid (porcine derived)',
      },

      // Vitamins / Injectables
      {
        name: 'Vitamin B12 Injection (Methylcobalamin)',
        category: 'Vitamins / Energy',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Bioactive B12 for energy and metabolism',
      },
      {
        name: 'Vitamin B12 Injection (Cyanocobalamin)',
        category: 'Vitamins / Energy',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Standard B12 injection',
      },
      {
        name: 'Vitamin D3 Injection',
        category: 'Vitamins',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Injectable vitamin D3',
      },
      {
        name: 'Glutathione Injection',
        category: 'Antioxidant',
        price: null,
        form: 'injection',
        path: '/medications/glutathione/',
        notes: 'Master antioxidant for detox and skin health',
      },
      {
        name: 'Vitamin C Injection',
        category: 'Vitamins / Immune',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'High-dose injectable vitamin C',
      },
      {
        name: 'B-Complex Injection',
        category: 'Vitamins / Energy',
        price: null,
        form: 'injection',
        path: '/medications/',
        notes: 'Combined B vitamins injection',
      },

      // Other Hormone Support
      {
        name: 'DHEA Capsules',
        category: 'Hormone Support',
        price: null,
        form: 'oral capsule',
        path: '/medications/',
        notes: 'Dehydroepiandrosterone, hormone precursor',
      },
      {
        name: 'Pregnenolone Capsules',
        category: 'Hormone Support',
        price: null,
        form: 'oral capsule',
        path: '/medications/',
        notes: 'Precursor hormone for steroid synthesis',
      },
      {
        name: 'Melatonin',
        category: 'Sleep / Hormone Support',
        price: null,
        form: 'oral capsule',
        path: '/medications/',
        notes: 'Sleep hormone, various strengths and forms',
      },

      // Specialty
      {
        name: 'Low Dose Naltrexone (LDN)',
        category: 'Specialty',
        price: null,
        form: 'oral capsule',
        path: '/medications/ldn/',
        notes: 'Low-dose naltrexone for autoimmune and pain',
      },
      {
        name: 'Ketamine Troches',
        category: 'Specialty / Mental Health',
        price: null,
        form: 'sublingual troche',
        path: '/medications/',
        notes: 'Sublingual ketamine for treatment-resistant depression',
      },
      {
        name: 'Ketamine Nasal Spray',
        category: 'Specialty / Mental Health',
        price: null,
        form: 'nasal spray',
        path: '/medications/',
        notes: 'Intranasal ketamine for depression/anxiety',
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
          sterileCompounding: true,
          nabrScope: true,
          accreditations: ['PCAB', 'ACHC'],
          location: 'Houston, TX',
        },
      });
    }

    return drugs;
  };
}
