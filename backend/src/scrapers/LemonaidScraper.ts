import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class LemonaidScraper extends BaseScraper {
  constructor() {
    super('LEMONAID');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.lemonaidhealth.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // Weight Loss - Compounded
      { path: '/services/weight-loss', name: 'Compounded Tirzepatide', category: 'Weight Loss', price: 299, notes: '$249/mo for 3-month plan' },
      { path: '/services/weight-loss', name: 'Compounded Tirzepatide Microdose', category: 'Weight Loss', price: 199 },
      { path: '/services/weight-loss', name: 'Compounded Semaglutide', category: 'Weight Loss', price: 299, notes: '$249/mo for 3-month plan' },
      { path: '/services/weight-loss', name: 'Compounded Semaglutide Microdose', category: 'Weight Loss', price: 199 },
      { path: '/drug/ozempic', name: 'Ozempic (Brand)', category: 'Weight Loss', price: 1199 },
      { path: '/drug/wegovy', name: 'Wegovy (Brand)', category: 'Weight Loss', price: 1599 },
      { path: '/drug/zepbound-vials', name: 'Zepbound Vials (via LillyDirect)', category: 'Weight Loss', price: 299 },
      { path: '/services/weight-loss', name: 'Metformin', category: 'Weight Loss', price: 30, notes: '$90 for 3 months' },

      // Erectile Dysfunction
      { path: '/drug/sildenafil', name: 'Sildenafil (Generic Viagra)', category: 'Erectile Dysfunction', price: 2, priceType: 'per pill' },
      { path: '/drug/tadalafil', name: 'Tadalafil (Generic Cialis)', category: 'Erectile Dysfunction', price: 2, priceType: 'per pill' },
      { path: '/drug/cialis', name: 'Tadalafil Daily 5mg', category: 'Erectile Dysfunction', price: 30 },
      { path: '/drug/viagra', name: 'Vardenafil (Generic Levitra)', category: 'Erectile Dysfunction', price: 2, priceType: 'per pill' },

      // Premature Ejaculation
      { path: '/services/premature-ejaculation', name: 'Sertraline (for PE)', category: 'Premature Ejaculation' },
      { path: '/services/premature-ejaculation', name: 'Paroxetine (for PE)', category: 'Premature Ejaculation' },

      // Hair Loss
      { path: '/drug/finasteride', name: 'Finasteride 1mg', category: 'Hair Loss', price: 30 },
      { path: '/services/hair-loss', name: 'Minoxidil', category: 'Hair Loss' },

      // Mental Health
      { path: '/services/depression-anxiety', name: 'Sertraline (Zoloft)', category: 'Mental Health' },
      { path: '/services/depression-anxiety', name: 'Escitalopram (Lexapro)', category: 'Mental Health' },
      { path: '/services/depression-anxiety', name: 'Fluoxetine (Prozac)', category: 'Mental Health' },
      { path: '/services/depression-anxiety', name: 'Citalopram (Celexa)', category: 'Mental Health' },
      { path: '/services/depression-anxiety', name: 'Bupropion (Wellbutrin)', category: 'Mental Health' },
      { path: '/services/anxiety', name: 'Buspirone (Buspar)', category: 'Mental Health' },
      { path: '/services/insomnia', name: 'Trazodone', category: 'Mental Health / Sleep' },
      { path: '/services/insomnia', name: 'Hydroxyzine', category: 'Mental Health / Sleep' },

      // Birth Control
      { path: '/services/birth-control-pills', name: 'Birth Control Pills (various)', category: 'Birth Control', price: 15 },
      { path: '/services/birth-control-ring', name: 'NuvaRing', category: 'Birth Control' },
      { path: '/services/birth-control-patch', name: 'Birth Control Patch', category: 'Birth Control' },
      { path: '/drug/ortho-tri-cyclen-lo', name: 'Ortho Tri-Cyclen Lo', category: 'Birth Control' },
      { path: '/drug/yasmin', name: 'Yasmin', category: 'Birth Control' },

      // Herpes / Cold Sores
      { path: '/services/cold-sore', name: 'Valacyclovir (Cold Sores)', category: 'Antivirals' },
      { path: '/services/genital-herpes', name: 'Valacyclovir (Genital Herpes)', category: 'Antivirals' },

      // UTI
      { path: '/services/urinary-tract-infection', name: 'UTI Treatment', category: 'Infections' },

      // Sinus Infection
      { path: '/services/sinus-infection', name: 'Sinus Infection Treatment', category: 'Infections' },

      // Skin
      { path: '/services/acne', name: 'Acne Treatment', category: 'Dermatology' },
      { path: '/services/acne', name: 'Tretinoin', category: 'Dermatology' },
      { path: '/services/acne', name: 'Clindamycin', category: 'Dermatology' },
      { path: '/services/dark-spots', name: 'Hydroquinone', category: 'Dermatology' },

      // Chronic Conditions
      { path: '/services/hypertension', name: 'Lisinopril', category: 'Hypertension' },
      { path: '/services/hypertension', name: 'Amlodipine', category: 'Hypertension' },
      { path: '/services/cholesterol', name: 'Atorvastatin', category: 'Cholesterol' },
      { path: '/services/cholesterol', name: 'Rosuvastatin', category: 'Cholesterol' },
      { path: '/services/hypothyroidism', name: 'Levothyroxine', category: 'Thyroid' },
      { path: '/services/asthma', name: 'Albuterol Inhaler', category: 'Respiratory' },
      { path: '/services/acid-reflux', name: 'Omeprazole', category: 'Gastrointestinal' },
      { path: '/services/acid-reflux', name: 'Pantoprazole', category: 'Gastrointestinal' },
      { path: '/services/migraine', name: 'Sumatriptan', category: 'Migraine' },

      // Hot Flashes / Menopause
      { path: '/services/hot-flashes', name: 'Paroxetine (Hot Flashes)', category: 'Menopause' },

      // Smoking Cessation
      { path: '/services/stop-smoking', name: 'Chantix (Varenicline)', category: 'Smoking Cessation' },
      { path: '/services/stop-smoking', name: 'Bupropion (Smoking Cessation)', category: 'Smoking Cessation' },
    ];

    // Visit key pages
    const pagesToVisit = ['/services/weight-loss', '/services/erectile-dysfunction', '/services/depression-anxiety'];
    for (const path of pagesToVisit) {
      try {
        console.log(`Visiting ${baseUrl}${path}...`);
        await this.page.goto(`${baseUrl}${path}`, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        await this.delay(1500);
      } catch (err) {
        console.log(`Failed to load ${path}`);
      }
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
          priceType: treatment.priceType || 'monthly',
          notes: treatment.notes,
          businessModel: 'telehealth',
          consultationFee: 25,
          freeShipping: true,
        },
      });
    }

    return drugs;
  };
}
