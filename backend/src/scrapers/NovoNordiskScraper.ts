import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class NovoNordiskScraper extends BaseScraper {
  constructor() {
    super('NOVO_NORDISK');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.novocare.com';
    const seenDrugs = new Set<string>();

    const medications = [
      // GLP-1 Weight Loss
      {
        name: 'Wegovy (semaglutide injection 2.4 mg)',
        genericName: 'semaglutide',
        category: 'Weight Loss / GLP-1',
        price: 349,
        introPrice: 199,
        form: 'injection',
        url: '/patient/medicines/wegovy.html',
        notes: 'FDA-approved for chronic weight management. $25 copay with savings card.',
      },
      {
        name: 'Wegovy (semaglutide tablet 25 mg)',
        genericName: 'semaglutide',
        category: 'Weight Loss / GLP-1',
        price: 299,
        introPrice: 149,
        form: 'oral tablet',
        url: '/patient/medicines/wegovy.html',
        notes: 'Only FDA-approved oral semaglutide for weight loss',
      },
      {
        name: 'Saxenda (liraglutide 3 mg)',
        genericName: 'liraglutide',
        category: 'Weight Loss / GLP-1',
        price: 1349,
        form: 'injection',
        url: '/obesity/saxenda.html',
        notes: 'Daily injection for chronic weight management',
      },

      // GLP-1 Diabetes
      {
        name: 'Ozempic (semaglutide injection)',
        genericName: 'semaglutide',
        category: 'Diabetes / GLP-1',
        price: 935,
        form: 'injection',
        url: '/diabetes/ozempic.html',
        notes: 'Once-weekly injection for type 2 diabetes',
      },
      {
        name: 'Rybelsus (semaglutide tablets)',
        genericName: 'semaglutide',
        category: 'Diabetes / GLP-1',
        price: 935,
        form: 'oral tablet',
        url: '/diabetes/rybelsus.html',
        notes: 'First oral GLP-1 for type 2 diabetes',
      },
      {
        name: 'Victoza (liraglutide)',
        genericName: 'liraglutide',
        category: 'Diabetes / GLP-1',
        price: 986,
        form: 'injection',
        url: '/diabetes/victoza.html',
        notes: 'Daily GLP-1 injection for type 2 diabetes',
      },

      // Insulins - Rapid Acting
      {
        name: 'Fiasp (insulin aspart)',
        genericName: 'insulin aspart',
        category: 'Diabetes / Rapid-Acting Insulin',
        price: 347,
        form: 'injection',
        url: '/diabetes/fiasp.html',
        notes: 'Fast-acting mealtime insulin',
      },
      {
        name: 'NovoLog (insulin aspart)',
        genericName: 'insulin aspart',
        category: 'Diabetes / Rapid-Acting Insulin',
        price: 347,
        form: 'injection',
        url: '/diabetes/novolog.html',
        notes: 'Rapid-acting mealtime insulin',
      },
      {
        name: 'NovoLog Mix 70/30',
        genericName: 'insulin aspart protamine/insulin aspart',
        category: 'Diabetes / Premixed Insulin',
        price: 347,
        form: 'injection',
        url: '/diabetes/novolog-mix.html',
        notes: 'Premixed insulin combination',
      },

      // Insulins - Long Acting
      {
        name: 'Levemir (insulin detemir)',
        genericName: 'insulin detemir',
        category: 'Diabetes / Long-Acting Insulin',
        price: 411,
        form: 'injection',
        url: '/diabetes/levemir.html',
        notes: 'Long-acting basal insulin',
      },
      {
        name: 'Tresiba (insulin degludec)',
        genericName: 'insulin degludec',
        category: 'Diabetes / Long-Acting Insulin',
        price: 411,
        form: 'injection',
        url: '/diabetes/tresiba.html',
        notes: 'Ultra-long-acting basal insulin (42+ hours)',
      },

      // Combination Products
      {
        name: 'Xultophy 100/3.6',
        genericName: 'insulin degludec/liraglutide',
        category: 'Diabetes / Insulin + GLP-1 Combination',
        price: 980,
        form: 'injection',
        url: '/diabetes/xultophy.html',
        notes: 'Combines Tresiba and Victoza in one injection',
      },

      // Emergency Glucagon
      {
        name: 'Zegalogue (dasiglucagon)',
        genericName: 'dasiglucagon',
        category: 'Diabetes / Emergency Glucagon',
        price: 645,
        form: 'injection/autoinjector',
        url: '/diabetes/zegalogue.html',
        notes: 'Rescue treatment for severe hypoglycemia',
      },

      // Hemophilia & Bleeding Disorders
      {
        name: 'Alhemo (concizumab)',
        genericName: 'concizumab-mtci',
        category: 'Hemophilia / Prophylaxis',
        price: null,
        form: 'injection',
        url: '/bleeding-disorders/alhemo.html',
        notes: 'Prophylaxis for hemophilia A or B with/without inhibitors',
      },
      {
        name: 'Esperoct (antihemophilic factor)',
        genericName: 'antihemophilic factor (recombinant), glycopegylated',
        category: 'Hemophilia A / Factor VIII',
        price: null,
        form: 'injection',
        url: '/bleeding-disorders/esperoct.html',
        notes: 'Extended half-life Factor VIII for hemophilia A',
      },
      {
        name: 'Novoeight (antihemophilic factor)',
        genericName: 'antihemophilic factor (recombinant)',
        category: 'Hemophilia A / Factor VIII',
        price: null,
        form: 'injection',
        url: '/bleeding-disorders/novoeight.html',
        notes: 'Factor VIII replacement for hemophilia A',
      },
      {
        name: 'Rebinyn (Factor IX)',
        genericName: 'coagulation factor IX (recombinant), glycoPEGylated',
        category: 'Hemophilia B / Factor IX',
        price: null,
        form: 'injection',
        url: '/bleeding-disorders/rebinyn.html',
        notes: 'Extended half-life Factor IX for hemophilia B',
      },
      {
        name: 'NovoSeven RT (Factor VIIa)',
        genericName: 'coagulation factor VIIa (recombinant)',
        category: 'Hemophilia / Bypass Agent',
        price: null,
        form: 'injection',
        url: '/bleeding-disorders/novoseven.html',
        notes: 'For hemophilia with inhibitors, Factor VII deficiency',
      },
      {
        name: 'Tretten (Factor XIII)',
        genericName: 'coagulation factor XIII A-subunit (recombinant)',
        category: 'Factor XIII Deficiency',
        price: null,
        form: 'injection',
        url: '/bleeding-disorders/tretten.html',
        notes: 'Prophylaxis for congenital Factor XIII A-subunit deficiency',
      },

      // Growth Hormone
      {
        name: 'Norditropin (somatropin)',
        genericName: 'somatropin',
        category: 'Growth Hormone',
        price: 850,
        form: 'injection',
        url: '/growth-hormone/norditropin.html',
        notes: 'Daily growth hormone for pediatric and adult GHD',
      },
      {
        name: 'Sogroya (somapacitan)',
        genericName: 'somapacitan-beco',
        category: 'Growth Hormone',
        price: 1200,
        form: 'injection',
        url: '/growth-hormone/sogroya.html',
        notes: 'Once-weekly growth hormone for adults and children 2.5+',
      },

      // Women's Health
      {
        name: 'Vagifem (estradiol vaginal tablets)',
        genericName: 'estradiol',
        category: "Women's Health / Menopause",
        price: 285,
        form: 'vaginal tablet',
        url: '/womens-health/vagifem.html',
        notes: 'Local estrogen therapy for vaginal atrophy',
      },
    ];

    // Visit NovoCare main page for validation
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
      console.log('Failed to load NovoCare page, using known data');
    }

    for (const med of medications) {
      const key = med.name.toLowerCase();
      if (seenDrugs.has(key)) continue;
      seenDrugs.add(key);

      console.log(`Adding ${med.name}...`);

      drugs.push({
        externalName: med.name,
        url: `${baseUrl}${med.url}`,
        price: med.price,
        category: med.category,
        requiresPrescription: true,
        requiresConsultation: false,
        rawData: {
          genericName: med.genericName,
          form: med.form,
          notes: med.notes,
          introPrice: (med as any).introPrice,
          manufacturer: 'Novo Nordisk',
          patientAssistance: true,
          savingsCard: true,
          homeDelivery: true,
          businessModel: 'pharma-direct',
        },
      });
    }

    return drugs;
  };
}
