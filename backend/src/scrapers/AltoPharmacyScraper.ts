import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class AltoPharmacyScraper extends BaseScraper {
  constructor() {
    super('ALTO_PHARMACY');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.alto.com';
    const seenDrugs = new Set<string>();

    const fertilityMedications = [
      { name: 'Gonal-f', category: 'Fertility - Stimulation', generic: 'follitropin alfa' },
      { name: 'Follistim', category: 'Fertility - Stimulation', generic: 'follitropin beta' },
      { name: 'Menopur', category: 'Fertility - Stimulation', generic: 'menotropins' },
      { name: 'Fyremadel', category: 'Fertility - Antagonist', generic: 'ganirelix acetate' },
      { name: 'Cetrotide', category: 'Fertility - Antagonist', generic: 'cetrorelix' },
      { name: 'Ovidrel', category: 'Fertility - Trigger', generic: 'choriogonadotropin alfa' },
      { name: 'Novarel', category: 'Fertility - Trigger', generic: 'hCG' },
      { name: 'Pregnyl', category: 'Fertility - Trigger', generic: 'hCG' },
      { name: 'Omnitrope', category: 'Fertility - Growth Hormone', generic: 'somatropin' },
      { name: 'Lupron', category: 'Fertility - GnRH Agonist', generic: 'leuprolide acetate' },
      { name: 'Ganirelix', category: 'Fertility - Antagonist', generic: 'ganirelix' },
      { name: 'Progesterone', category: 'Fertility - Support', generic: 'progesterone' },
      { name: 'Estrace', category: 'Fertility - Support', generic: 'estradiol' },
      { name: 'Endometrin', category: 'Fertility - Support', generic: 'progesterone' },
      { name: 'Crinone', category: 'Fertility - Support', generic: 'progesterone gel' },
      { name: 'Clomid', category: 'Fertility - Ovulation Induction', generic: 'clomiphene citrate' },
      { name: 'Letrozole', category: 'Fertility - Ovulation Induction', generic: 'letrozole' },
      { name: 'Femara', category: 'Fertility - Ovulation Induction', generic: 'letrozole' },
    ];

    const pagesToScrape = [
      { url: '/fertility', category: 'Fertility' },
      { url: '/fertility-pharmacy', category: 'Fertility' },
      { url: '/injection-guides', category: 'Fertility - Injectable' },
      { url: '/blog/post/fertility-medications-101', category: 'Fertility' },
      { url: '/blog/post/ivf-medications-explained', category: 'Fertility - IVF' },
      { url: '/treatment-area/diabetes', category: 'Diabetes' },
      { url: '/treatment-area/heart-health', category: 'Heart Health' },
      { url: '/treatment-area/sexual-health', category: 'Sexual Health' },
      { url: '/treatment-area/general-health', category: 'General Health' },
    ];

    for (const med of fertilityMedications) {
      if (!seenDrugs.has(med.name.toLowerCase())) {
        seenDrugs.add(med.name.toLowerCase());
        drugs.push({
          externalName: med.name,
          url: `${baseUrl}/fertility`,
          category: med.category,
          requiresPrescription: true,
          requiresConsultation: false,
          rawData: {
            generic: med.generic,
            businessModel: 'prescription-fulfillment',
            specialtyType: 'fertility',
            source: 'known-formulary',
          },
        });
      }
    }

    for (const page of pagesToScrape) {
      try {
        console.log(`Scraping ${baseUrl}${page.url}`);
        await this.page.goto(`${baseUrl}${page.url}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(3000);

        const content = await this.page.content();
        const $ = cheerio.load(content);

        const pageText = $('body').text().toLowerCase();

        const additionalMedications = this.extractMedicationsFromText(pageText, page.category);

        for (const med of additionalMedications) {
          const key = med.name.toLowerCase();
          if (!seenDrugs.has(key)) {
            seenDrugs.add(key);
            drugs.push({
              externalName: med.name,
              url: `${baseUrl}${page.url}`,
              category: med.category,
              requiresPrescription: true,
              requiresConsultation: false,
              rawData: {
                businessModel: 'prescription-fulfillment',
                source: 'page-scrape',
                pageUrl: page.url,
              },
            });
          }
        }
      } catch (err) {
        console.log(`Failed to scrape ${page.url}:`, err);
      }
    }

    return drugs;
  };

  private extractMedicationsFromText = (
    text: string,
    defaultCategory: string
  ): Array<{ name: string; category: string }> => {
    const medications: Array<{ name: string; category: string }> = [];

    const knownDrugs: Record<string, string> = {
      'metformin': 'Diabetes',
      'insulin': 'Diabetes',
      'ozempic': 'Diabetes / Weight Loss',
      'mounjaro': 'Diabetes / Weight Loss',
      'trulicity': 'Diabetes',
      'jardiance': 'Diabetes',
      'farxiga': 'Diabetes',
      'victoza': 'Diabetes',
      'januvia': 'Diabetes',
      'lisinopril': 'Heart Health',
      'atorvastatin': 'Heart Health',
      'amlodipine': 'Heart Health',
      'losartan': 'Heart Health',
      'metoprolol': 'Heart Health',
      'carvedilol': 'Heart Health',
      'sildenafil': 'Sexual Health',
      'tadalafil': 'Sexual Health',
      'viagra': 'Sexual Health',
      'cialis': 'Sexual Health',
      'testosterone': 'Hormone Therapy',
      'estradiol': 'Hormone Therapy',
      'levothyroxine': 'Thyroid',
      'synthroid': 'Thyroid',
    };

    for (const [drug, category] of Object.entries(knownDrugs)) {
      if (text.includes(drug)) {
        const capitalizedName = drug.charAt(0).toUpperCase() + drug.slice(1);
        medications.push({
          name: capitalizedName,
          category: category || defaultCategory,
        });
      }
    }

    return medications;
  };
}
