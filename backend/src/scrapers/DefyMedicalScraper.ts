import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

interface ServicePage {
  name: string;
  path: string;
  category: string;
}

export class DefyMedicalScraper extends BaseScraper {
  constructor() {
    super('DEFY_MEDICAL');
  }

  protected async scrape(): Promise<ScrapedDrug[]> {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.defymedical.com';

    // Service pages discovered during reconnaissance
    const servicePages: ServicePage[] = [
      { name: 'TRT', path: '/services/trt/', category: 'Hormone Therapy' },
      { name: 'Erectile Dysfunction', path: '/services/erectile-disfunction/', category: 'Erectile Dysfunction' },
      { name: 'Trimix Injections', path: '/services/trimix-injections/', category: 'Erectile Dysfunction' },
      { name: 'Anabolic Therapies', path: '/services/anabolic-androgenic-therapies/', category: 'Hormone Therapy' },
      { name: 'Hormone Therapy', path: '/services/hormone-therapy/', category: 'Hormone Therapy' },
      { name: 'Menopause', path: '/services/menopause/', category: 'Menopause' },
      { name: 'Female Sexual Dysfunction', path: '/services/female-sexual-dysfunction/', category: 'Sexual Wellness' },
      { name: 'Semaglutide', path: '/services/semaglutide-for-weight-loss/', category: 'Weight Loss' },
      { name: 'Tirzepatide', path: '/tirzepatide-online/', category: 'Weight Loss' },
      { name: 'Weight Loss', path: '/services/weight-loss/', category: 'Weight Loss' },
      { name: 'Peptide Therapy', path: '/services/peptide-therapy/', category: 'Peptides' },
      { name: 'Ketamine Therapy', path: '/services/ketamine-therapy/', category: 'Mental Health' },
      { name: 'Thyroid Therapy', path: '/services/thyroid-therapy/', category: 'Thyroid' },
      { name: 'Hair Loss', path: '/services/hair-loss/', category: 'Hair Loss' },
      { name: 'Joint Pain', path: '/services/joint-pain/', category: 'Pain Management' },
      { name: 'IV Therapy', path: '/services/iv-therapy/', category: 'Wellness' },
    ];

    // Known medications offered by Defy Medical
    const knownMedications: Record<string, string[]> = {
      'Hormone Therapy': [
        'Testosterone Cypionate', 'Testosterone Enanthate', 'Testosterone Cream',
        'HCG', 'Gonadorelin', 'Anastrozole', 'Enclomiphene', 'Clomiphene',
        'DHEA', 'Pregnenolone', 'Nandrolone', 'Oxandrolone',
      ],
      'Erectile Dysfunction': [
        'Sildenafil', 'Tadalafil', 'Vardenafil',
        'Trimix', 'PT-141', 'Bremelanotide',
      ],
      'Weight Loss': [
        'Semaglutide', 'Tirzepatide', 'Liraglutide',
        'AOD-9604', 'CJC-1295', 'Ipamorelin',
      ],
      'Peptides': [
        'BPC-157', 'TB-500', 'Thymosin Beta-4',
        'Sermorelin', 'Tesamorelin', 'Ipamorelin',
        'CJC-1295', 'GHRP-2', 'GHRP-6',
        'MK-677', 'IGF-1 LR3', 'Epithalon',
        'GHK-Cu', 'Melanotan II', 'PT-141',
      ],
      'Menopause': [
        'Estradiol', 'Progesterone', 'Testosterone',
        'DHEA', 'Pregnenolone', 'Estriol',
      ],
      'Thyroid': [
        'Levothyroxine', 'Liothyronine', 'Armour Thyroid',
        'Nature-Throid', 'NP Thyroid',
      ],
      'Hair Loss': [
        'Finasteride', 'Dutasteride', 'Minoxidil',
      ],
      'Mental Health': [
        'Ketamine', 'NAD+',
      ],
    };

    for (const service of servicePages) {
      try {
        console.log(`Scraping: ${service.name}...`);

        await this.page.goto(`${baseUrl}${service.path}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const $ = cheerio.load(content);
        const pageText = $('body').text().toLowerCase();

        // Extract prices from page
        const priceMatches = pageText.match(/\$\d+(?:\.\d{2})?/g) || [];
        const prices = priceMatches.map(p => parseFloat(p.replace('$', '')));

        // Check for known medications in page content
        const categoryMeds = knownMedications[service.category] || [];
        for (const med of categoryMeds) {
          if (pageText.includes(med.toLowerCase())) {
            const exists = drugs.some(d => d.externalName === med);
            if (!exists) {
              drugs.push({
                externalName: med,
                url: `${baseUrl}${service.path}`,
                price: undefined,
                category: service.category,
                requiresPrescription: true,
                requiresConsultation: true,
                rawData: {
                  servicePage: service.name,
                  serviceUrl: `${baseUrl}${service.path}`,
                  scrapedAt: new Date().toISOString(),
                },
              });
              console.log(`  Found: ${med}`);
            }
          }
        }

        // Skip heading extraction - it captures too many article titles
        // The known medications list above is sufficient

        console.log(`  Service total: ${drugs.filter(d => d.rawData?.servicePage === service.name).length} drugs`);
        await this.delay();

      } catch (error) {
        console.error(`Error scraping ${service.name}:`, error);
      }
    }

    // Deduplicate by name (case-insensitive)
    const seen = new Set<string>();
    const uniqueDrugs = drugs.filter(d => {
      const key = d.externalName.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`\nTotal unique drugs found: ${uniqueDrugs.length}`);
    return uniqueDrugs;
  }
}
