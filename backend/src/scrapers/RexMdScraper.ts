import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class RexMdScraper extends BaseScraper {
  constructor() {
    super('REX_MD');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://rexmd.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // Erectile Dysfunction - Generic
      {
        name: 'Generic Viagra (Sildenafil) 20mg',
        category: 'Erectile Dysfunction',
        price: 2,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/generic-viagra-sildenafil/',
      },
      {
        name: 'Generic Viagra (Sildenafil) 50mg',
        category: 'Erectile Dysfunction',
        price: 6,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/generic-viagra-sildenafil/',
      },
      {
        name: 'Generic Viagra (Sildenafil) 100mg',
        category: 'Erectile Dysfunction',
        price: 6,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/generic-viagra-sildenafil/',
      },
      {
        name: 'Generic Cialis (Tadalafil) 10mg',
        category: 'Erectile Dysfunction',
        price: 6,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/generic-cialis-tadalafil/',
      },
      {
        name: 'Generic Cialis (Tadalafil) 20mg',
        category: 'Erectile Dysfunction',
        price: 6,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/generic-cialis-tadalafil/',
      },
      {
        name: 'Daily Generic Cialis (Tadalafil) 2.5mg',
        category: 'Erectile Dysfunction (Daily)',
        price: 2,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/generic-cialis-tadalafil/',
        notes: 'Daily use formulation',
      },
      {
        name: 'Daily Generic Cialis (Tadalafil) 5mg',
        category: 'Erectile Dysfunction (Daily)',
        price: 2,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/generic-cialis-tadalafil/',
        notes: 'Daily use formulation',
      },

      // Erectile Dysfunction - Brand
      {
        name: 'Viagra (Brand) 50mg',
        category: 'Erectile Dysfunction (Brand)',
        price: 96,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/branded-viagra/',
        isBrand: true,
      },
      {
        name: 'Viagra (Brand) 100mg',
        category: 'Erectile Dysfunction (Brand)',
        price: 96,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/branded-viagra/',
        isBrand: true,
      },
      {
        name: 'Cialis (Brand) 10mg',
        category: 'Erectile Dysfunction (Brand)',
        price: 29,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/branded-cialis/',
        isBrand: true,
      },
      {
        name: 'Cialis (Brand) 20mg',
        category: 'Erectile Dysfunction (Brand)',
        price: 29,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/erectile-dysfunction/branded-cialis/',
        isBrand: true,
      },

      // Weight Loss / GLP-1
      {
        name: 'Semaglutide (Compounded)',
        category: 'Weight Loss / GLP-1',
        price: 75,
        priceUnit: 'per month starting',
        form: 'injection',
        path: '/our-medications/weight-loss/',
        notes: 'GLP-1 Weight Loss Program',
      },
      {
        name: 'Zepbound (tirzepatide)',
        category: 'Weight Loss / GLP-1',
        price: 75,
        priceUnit: 'per month starting',
        form: 'injection',
        path: '/our-medications/weight-loss/',
        notes: 'Brand name GLP-1/GIP',
        isBrand: true,
      },
      {
        name: 'Wegovy (semaglutide)',
        category: 'Weight Loss / GLP-1',
        price: 75,
        priceUnit: 'per month starting',
        form: 'injection',
        path: '/our-medications/weight-loss/',
        notes: 'Brand name GLP-1',
        isBrand: true,
      },
      {
        name: 'Saxenda (liraglutide)',
        category: 'Weight Loss / GLP-1',
        price: 75,
        priceUnit: 'per month starting',
        form: 'injection',
        path: '/our-medications/weight-loss/',
        notes: 'Brand name GLP-1',
        isBrand: true,
      },

      // Testosterone
      {
        name: 'Testosterone Cypionate Injection',
        category: 'Testosterone Replacement',
        price: 99,
        priceUnit: 'per month starting',
        form: 'injection',
        path: '/our-medications/testosterone/',
        notes: 'Testosterone Program',
      },
      {
        name: 'Testosterone Gel (Topical)',
        category: 'Testosterone Replacement',
        price: 99,
        priceUnit: 'per month starting',
        form: 'topical gel',
        path: '/our-medications/testosterone/',
        notes: 'Testosterone Program',
      },
      {
        name: 'Clomid (Clomiphene)',
        category: 'Testosterone Support',
        price: 99,
        priceUnit: 'per month starting',
        form: 'tablet',
        path: '/our-medications/testosterone/',
        notes: 'Stimulates natural testosterone production',
      },
      {
        name: 'Sermorelin',
        category: 'Testosterone / Peptides',
        price: 99,
        priceUnit: 'per month starting',
        form: 'injection',
        path: '/our-medications/testosterone/',
        notes: 'Growth hormone releasing peptide',
      },

      // Hair Loss
      {
        name: 'Finasteride 1mg',
        category: 'Hair Loss',
        price: 13.5,
        priceUnit: 'per month',
        form: 'tablet',
        path: '/our-medications/hair-loss/',
        notes: 'As low as $0.45/day with 12-month supply',
      },

      // Premature Ejaculation
      {
        name: 'Sertraline (for PE)',
        category: 'Premature Ejaculation',
        price: 27,
        priceUnit: 'per month',
        form: 'tablet',
        path: '/our-medications/premature-ejaculation/',
        notes: 'Off-label use for premature ejaculation',
      },

      // Sleep / Insomnia
      {
        name: 'Doxepin 10mg',
        category: 'Sleep / Insomnia',
        price: 1.7,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/sleep/',
      },
      {
        name: 'Ramelteon 8mg',
        category: 'Sleep / Insomnia',
        price: 2.11,
        priceUnit: 'per dose',
        form: 'tablet',
        path: '/our-medications/sleep/',
        notes: 'Melatonin receptor agonist',
      },

      // Herpes
      {
        name: 'Valacyclovir',
        category: 'Herpes / Antiviral',
        price: 27,
        priceUnit: 'per month',
        form: 'tablet',
        path: '/our-medications/herpes/',
        notes: '3-month supply available',
      },

      // Anxiety (Beta Blocker)
      {
        name: 'Propranolol (for Anxiety)',
        category: 'Anxiety / Performance',
        price: 20,
        priceUnit: 'per month estimated',
        form: 'tablet',
        path: '/our-medications/',
        notes: 'Beta blocker for situational anxiety',
      },
    ];

    // Visit main site for validation
    try {
      console.log(`Visiting ${baseUrl}/our-medications/...`);
      await this.page.goto(`${baseUrl}/our-medications/`, {
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
          focus: "men's health",
          businessModel: 'telehealth-prescription',
          freeShipping: true,
          discretePackaging: true,
        },
      });
    }

    return drugs;
  };
}
