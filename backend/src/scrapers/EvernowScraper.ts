import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class EvernowScraper extends BaseScraper {
  constructor() {
    super('EVERNOW');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.evernow.com';
    const seenDrugs = new Set<string>();

    const treatmentPages = [
      // Hormone Therapy
      { path: '/prescription/hormone-therapy/estradiol-patch', name: 'Estradiol Patch', category: 'Hormone Therapy' },
      { path: '/prescription/hormone-therapy/estradiol-pill', name: 'Estradiol Pill', category: 'Hormone Therapy' },
      { path: '/prescription/hormone-therapy/progesterone', name: 'Progesterone', category: 'Hormone Therapy' },
      { path: '/prescription/hormone-therapy/norethindrone', name: 'Norethindrone', category: 'Hormone Therapy' },

      // Non-Hormonal Therapy
      { path: '/prescription/non-hormonal-therapy/veozah', name: 'Veozah (Fezolinetant)', category: 'Non-Hormonal Menopause' },
      { path: '/prescription/non-hormonal-therapy/paroxetine', name: 'Paroxetine (Low-dose)', category: 'Non-Hormonal Menopause' },

      // Weight Loss
      { path: '/prescription/weight-loss/ozempic', name: 'Ozempic (Semaglutide)', category: 'Weight Loss' },
      { path: '/prescription/weight-loss/wegovy', name: 'Wegovy (Semaglutide)', category: 'Weight Loss' },
      { path: '/prescription/weight-loss/zepbound', name: 'Zepbound (Tirzepatide)', category: 'Weight Loss' },
      { path: '/prescription/weight-loss/mounjaro', name: 'Mounjaro (Tirzepatide)', category: 'Weight Loss' },

      // Sexual Health
      { path: '/prescription/sexual-health/vaginal-estrogen-cream', name: 'Vaginal Estrogen Cream', category: 'Sexual Health' },
      { path: '/prescription/sexual-health/vaginal-estradiol-tablets', name: 'Vaginal Estradiol Tablets', category: 'Sexual Health' },
      { path: '/prescription/sexual-health/sildenafil-arousal-cream', name: 'Sildenafil Arousal Cream', category: 'Sexual Health' },

      // Hair Loss
      { path: '/prescription/hair-loss/oral-minoxidil', name: 'Oral Minoxidil', category: 'Hair Loss' },
      { path: '/prescription/hair-loss/topical-minoxidil-finasteride', name: 'Topical Minoxidil + Finasteride', category: 'Hair Loss' },
      { path: '/prescription/hair-loss/foam-minoxidil-finasteride', name: 'Foam Minoxidil + Finasteride', category: 'Hair Loss' },

      // Anti-Aging / Skin
      { path: '/prescription/anti-aging/facial-estriol-cream', name: 'Facial Estriol Cream', category: 'Skin / Anti-Aging' },
      { path: '/prescription/anti-aging/tretinoin-face-cream', name: 'Tretinoin Face Cream', category: 'Skin / Anti-Aging' },
    ];

    for (const treatment of treatmentPages) {
      const key = treatment.name.toLowerCase();
      if (seenDrugs.has(key)) continue;
      seenDrugs.add(key);

      const url = `${baseUrl}${treatment.path}`;
      console.log(`Scraping ${treatment.name}...`);

      try {
        await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const extractedData = this.extractTreatmentData(content);

        drugs.push({
          externalName: treatment.name,
          url,
          price: extractedData.price,
          category: treatment.category,
          requiresPrescription: true,
          requiresConsultation: true,
          rawData: {
            ...extractedData,
            businessModel: 'telehealth-womens-health',
            focusArea: 'menopause',
          },
        });
      } catch (err) {
        console.log(`Failed to scrape ${treatment.name}, using fallback`);
        drugs.push({
          externalName: treatment.name,
          url,
          category: treatment.category,
          requiresPrescription: true,
          requiresConsultation: true,
          rawData: {
            businessModel: 'telehealth-womens-health',
            focusArea: 'menopause',
            source: 'fallback',
          },
        });
      }
    }

    const supplementProducts = this.getSupplementProducts();
    for (const product of supplementProducts) {
      const key = product.name.toLowerCase();
      if (seenDrugs.has(key)) continue;
      seenDrugs.add(key);

      drugs.push({
        externalName: product.name,
        url: `${baseUrl}/supplements`,
        category: 'Supplements',
        requiresPrescription: false,
        requiresConsultation: false,
        rawData: {
          description: product.description,
          businessModel: 'telehealth-womens-health',
          isOTC: true,
        },
      });
    }

    return drugs;
  };

  private extractTreatmentData = (html: string): Record<string, any> => {
    const $ = cheerio.load(html);
    const data: Record<string, any> = {};

    const pageText = $('body').text();

    const pricePatterns = [
      /\$(\d+(?:\.\d{2})?)\s*(?:\/\s*month|per\s*month|monthly)/i,
      /starting\s*(?:at\s*)?\$(\d+)/i,
      /from\s*\$(\d+)/i,
      /\$(\d+(?:\.\d{2})?)/,
    ];

    for (const pattern of pricePatterns) {
      const match = pageText.match(pattern);
      if (match) {
        data.price = parseFloat(match[1]);
        break;
      }
    }

    const description = $('meta[name="description"]').attr('content') ||
                        $('p').first().text().trim().slice(0, 300);
    if (description) {
      data.description = description;
    }

    const symptoms: string[] = [];
    const symptomKeywords = ['hot flashes', 'night sweats', 'mood changes', 'sleep', 'weight', 'hair loss', 'vaginal dryness', 'low libido', 'brain fog', 'fatigue'];
    const lowerText = pageText.toLowerCase();
    for (const symptom of symptomKeywords) {
      if (lowerText.includes(symptom)) {
        symptoms.push(symptom);
      }
    }
    if (symptoms.length > 0) {
      data.treatsSymptoms = symptoms;
    }

    return data;
  };

  private getSupplementProducts = (): Array<{ name: string; description: string }> => {
    return [
      { name: 'The Pause Nutrition - Sleep', description: 'Supplement for menopause-related sleep issues' },
      { name: 'The Pause Nutrition - Mood', description: 'Supplement for menopause-related mood changes' },
      { name: 'The Pause Nutrition - Energy', description: 'Supplement for menopause-related fatigue' },
      { name: 'The Pause Nutrition - Skin', description: 'Supplement for menopause-related skin changes' },
      { name: 'The Pause Nutrition - Metabolism', description: 'Supplement for menopause-related metabolism support' },
    ];
  };
}
