import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class BlinkHealthScraper extends BaseScraper {
  constructor() {
    super('BLINK_HEALTH');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://www.blinkhealth.com';
    const seenDrugs = new Set<string>();

    const drugUrls = await this.fetchDrugUrlsFromSitemap();
    console.log(`Found ${drugUrls.length} drug URLs from sitemap`);

    const maxDrugs = 200;
    const urlsToScrape = drugUrls.slice(0, maxDrugs);

    for (const url of urlsToScrape) {
      try {
        const drugName = url.replace(baseUrl + '/', '').split('/')[0];

        if (seenDrugs.has(drugName.toLowerCase())) continue;
        seenDrugs.add(drugName.toLowerCase());

        console.log(`Scraping ${drugName}...`);

        await this.page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        await this.delay(1500);

        const content = await this.page.content();
        const drug = this.extractDrugFromPage(content, url, drugName);

        if (drug) {
          drugs.push(drug);
        }
      } catch (err) {
        console.log(`Failed to scrape ${url}:`, err instanceof Error ? err.message : err);
      }
    }

    return drugs;
  };

  private fetchDrugUrlsFromSitemap = async (): Promise<string[]> => {
    const urls: string[] = [];

    try {
      const response = await fetch('https://www.blinkhealth.com/sitemap.xml');
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      $('url loc').each((_, el) => {
        const url = $(el).text();
        if (url &&
            url !== 'https://www.blinkhealth.com/' &&
            url !== 'https://www.blinkhealth.com' &&
            !url.includes('/blog') &&
            !url.includes('/help') &&
            !url.includes('/about') &&
            !url.includes('/faq') &&
            !url.includes('/privacy') &&
            !url.includes('/terms')) {
          urls.push(url);
        }
      });
    } catch (err) {
      console.log('Failed to fetch sitemap, using fallback drug list');
      return this.getFallbackDrugUrls();
    }

    return urls;
  };

  private getFallbackDrugUrls = (): string[] => {
    const commonDrugs = [
      'lisinopril', 'atorvastatin', 'metformin', 'amlodipine', 'metoprolol',
      'omeprazole', 'losartan', 'gabapentin', 'sertraline', 'levothyroxine',
      'azithromycin', 'amoxicillin', 'hydrochlorothiazide', 'furosemide',
      'trazodone', 'pantoprazole', 'prednisone', 'escitalopram', 'fluoxetine',
      'montelukast', 'alprazolam', 'bupropion', 'carvedilol', 'citalopram',
      'clonazepam', 'cyclobenzaprine', 'duloxetine', 'famotidine', 'finasteride',
      'fluticasone', 'hydroxyzine', 'ibuprofen', 'lamotrigine', 'lisinopril-hctz',
      'lorazepam', 'meloxicam', 'methylprednisolone', 'naproxen', 'ondansetron',
      'oxycodone', 'potassium-chloride', 'pravastatin', 'propranolol', 'rosuvastatin',
      'sildenafil', 'simvastatin', 'spironolactone', 'tamsulosin', 'tramadol',
      'venlafaxine', 'warfarin', 'zolpidem', 'albuterol', 'cephalexin',
      'ciprofloxacin', 'clindamycin', 'doxycycline', 'valacyclovir', 'tadalafil',
    ];
    return commonDrugs.map(drug => `https://www.blinkhealth.com/${drug}`);
  };

  private extractDrugFromPage = (
    html: string,
    url: string,
    drugSlug: string
  ): ScrapedDrug | null => {
    const $ = cheerio.load(html);

    let drugName = '';
    let price: number | undefined;
    let category = '';
    let description = '';
    let dosageForms: string[] = [];
    let strengths: string[] = [];

    const nextDataScript = $('#__NEXT_DATA__').html();
    if (nextDataScript) {
      try {
        const nextData = JSON.parse(nextDataScript);
        const pageProps = nextData?.props?.pageProps;

        if (pageProps?.drugInfo) {
          drugName = pageProps.drugInfo.name || pageProps.drugInfo.genericName || drugSlug;
          description = pageProps.drugInfo.description || '';
          category = pageProps.drugInfo.category || this.classifyDrug(drugName);
        }

        if (pageProps?.drugs) {
          const drugData = Object.values(pageProps.drugs)[0] as any;
          if (drugData) {
            drugName = drugName || drugData.name || drugSlug;

            if (drugData.formulations) {
              dosageForms = [...new Set(drugData.formulations.map((f: any) => f.form || f.dosageForm).filter(Boolean))];
              strengths = [...new Set(drugData.formulations.map((f: any) => f.strength).filter(Boolean))];
            }

            if (drugData.prices?.delivery) {
              price = drugData.prices.delivery;
            } else if (drugData.lowestPrice) {
              price = drugData.lowestPrice;
            }
          }
        }
      } catch (err) {
        // JSON parse failed, continue with HTML extraction
      }
    }

    if (!drugName) {
      drugName = $('h1').first().text().trim() ||
                 $('[data-testid="drug-name"]').text().trim() ||
                 this.formatDrugName(drugSlug);
    }

    if (!price) {
      const priceText = $('[data-testid="price"]').text() ||
                        $('.price').first().text() ||
                        $('span:contains("$")').first().text();
      const priceMatch = priceText.match(/\$([\d,.]+)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(',', ''));
      }
    }

    if (!category) {
      category = this.classifyDrug(drugName);
    }

    if (!drugName || drugName === drugSlug) {
      drugName = this.formatDrugName(drugSlug);
    }

    return {
      externalName: drugName,
      url,
      price,
      category,
      requiresPrescription: true,
      requiresConsultation: false,
      rawData: {
        description: description.slice(0, 500),
        dosageForms,
        strengths,
        businessModel: 'prescription-discount',
        source: 'blink-health',
      },
    };
  };

  private formatDrugName = (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  private classifyDrug = (drugName: string): string => {
    const lower = drugName.toLowerCase();

    const categories: Record<string, string[]> = {
      'Cardiovascular': ['lisinopril', 'atorvastatin', 'amlodipine', 'metoprolol', 'losartan', 'carvedilol', 'hydrochlorothiazide', 'furosemide', 'warfarin', 'diltiazem', 'verapamil', 'pravastatin', 'simvastatin', 'rosuvastatin'],
      'Diabetes': ['metformin', 'glipizide', 'pioglitazone', 'januvia', 'sitagliptin', 'glimepiride'],
      'Mental Health': ['sertraline', 'fluoxetine', 'escitalopram', 'citalopram', 'paroxetine', 'bupropion', 'duloxetine', 'venlafaxine', 'trazodone', 'buspirone', 'alprazolam', 'lorazepam', 'clonazepam'],
      'Thyroid': ['levothyroxine', 'synthroid', 'liothyronine'],
      'Pain / Anti-inflammatory': ['ibuprofen', 'naproxen', 'meloxicam', 'celecoxib', 'tramadol', 'gabapentin', 'pregabalin', 'cyclobenzaprine'],
      'Antibiotics': ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'cephalexin', 'doxycycline', 'clindamycin', 'metronidazole', 'sulfamethoxazole'],
      'Gastrointestinal': ['omeprazole', 'pantoprazole', 'famotidine', 'ranitidine', 'ondansetron'],
      'Respiratory': ['albuterol', 'montelukast', 'fluticasone', 'mometasone', 'budesonide'],
      'Seizure / Neurological': ['lamotrigine', 'levetiracetam', 'topiramate', 'carbamazepine', 'phenytoin'],
      'Sleep': ['zolpidem', 'eszopiclone', 'trazodone'],
      'Erectile Dysfunction': ['sildenafil', 'tadalafil', 'vardenafil'],
      'Hair Loss': ['finasteride', 'minoxidil'],
      'Herpes / Antivirals': ['valacyclovir', 'acyclovir'],
      'Hormone Therapy': ['estradiol', 'progesterone', 'testosterone', 'spironolactone'],
      'Allergy': ['hydroxyzine', 'cetirizine', 'loratadine', 'fexofenadine'],
      'Contraceptives': ['ortho', 'yasmin', 'nuvaring', 'sprintec', 'tri-lo'],
      'Prostate': ['tamsulosin', 'finasteride', 'alfuzosin'],
      'Steroids': ['prednisone', 'methylprednisolone', 'dexamethasone'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lower.includes(kw))) {
        return category;
      }
    }

    return 'Other';
  };
}
