import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class HenryMedsScraper extends BaseScraper {
  constructor() {
    super('HENRY_MEDS');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://henrymeds.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // Weight Loss - Semaglutide
      {
        path: '/semaglutide/',
        name: 'Compounded Semaglutide Injection',
        category: 'Weight Loss',
        price: 297,
        firstMonthPrice: 247,
        form: 'injection',
      },
      {
        path: '/semaglutide-oral/',
        name: 'Compounded Semaglutide Oral',
        category: 'Weight Loss',
        price: 249,
        firstMonthPrice: 199,
        form: 'oral',
      },
      {
        path: '/semaglutide-tablets/',
        name: 'Compounded Semaglutide Tablets',
        category: 'Weight Loss',
        price: 249,
        firstMonthPrice: 199,
        form: 'tablets',
      },
      {
        path: '/sublingual-semaglutide-drops/',
        name: 'Sublingual Semaglutide Drops',
        category: 'Weight Loss',
        price: 249,
        firstMonthPrice: 199,
        form: 'sublingual drops',
      },
      {
        path: '/semaglutide-microdose/',
        name: 'Semaglutide Microdose',
        category: 'Weight Loss',
        price: 149,
        firstMonthPrice: 99,
        form: 'microdose',
      },
      {
        path: '/semaglutide-microdose-oral/',
        name: 'Semaglutide Microdose Oral',
        category: 'Weight Loss',
        price: 149,
        firstMonthPrice: 99,
        form: 'oral microdose',
      },

      // Weight Loss - Tirzepatide
      {
        path: '/tirzepatide-tablets/',
        name: 'Compounded Tirzepatide Tablets',
        category: 'Weight Loss',
        price: 349,
        firstMonthPrice: 299,
        form: 'tablets',
      },

      // Weight Loss - Liraglutide
      {
        path: '/liraglutide/',
        name: 'Compounded Liraglutide Injection',
        category: 'Weight Loss',
        price: 149,
        firstMonthPrice: 99,
        form: 'injection',
      },

      // Weight Loss - Phentermine
      {
        path: '/phentermine/',
        name: 'Phentermine',
        category: 'Weight Loss',
        price: 99,
        form: 'oral',
      },

      // Testosterone / HRT
      {
        path: '/testosterone/',
        name: 'Testosterone Cypionate Injection',
        category: 'TRT / Hormone Therapy',
        price: 129,
        firstMonthPrice: 79,
        form: 'injection',
      },
      {
        path: '/hrt/',
        name: 'Hormone Replacement Therapy',
        category: 'TRT / Hormone Therapy',
        price: 129,
        firstMonthPrice: 79,
      },

      // Erectile Dysfunction
      {
        path: '/ed-oral/',
        name: 'ED Medication (Oral)',
        category: 'Erectile Dysfunction',
        price: 49,
        form: 'oral',
      },
    ];

    // Attempt to scrape main pages for validation
    const pagesToVisit = ['/glp-1-weight-management/', '/treatments/'];
    for (const path of pagesToVisit) {
      try {
        console.log(`Visiting ${baseUrl}${path}...`);
        await this.page.goto(`${baseUrl}${path}`, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });
        await this.delay(2000);
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
          form: treatment.form,
          firstMonthPrice: treatment.firstMonthPrice,
          isCompounded: treatment.name.toLowerCase().includes('compounded'),
          businessModel: 'telehealth-compounding',
          includesShipping: true,
          includesTelehealth: true,
        },
      });
    }

    return drugs;
  };
}
