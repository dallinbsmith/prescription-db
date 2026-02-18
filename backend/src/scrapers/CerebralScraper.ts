import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class CerebralScraper extends BaseScraper {
  constructor() {
    super('CEREBRAL');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://cerebral.com';
    const seenDrugs = new Set<string>();

    const medicationPages = [
      { slug: 'sertraline-zoloft', name: 'Sertraline (Zoloft)', category: 'Depression / Anxiety' },
      { slug: 'fluoxetine-prozac', name: 'Fluoxetine (Prozac)', category: 'Depression / Anxiety' },
      { slug: 'escitalopram-lexapro', name: 'Escitalopram (Lexapro)', category: 'Depression / Anxiety' },
      { slug: 'citalopram-celexa', name: 'Citalopram (Celexa)', category: 'Depression / Anxiety' },
      { slug: 'paroxetine-paxil', name: 'Paroxetine (Paxil)', category: 'Depression / Anxiety' },
      { slug: 'bupropion-wellbutrin', name: 'Bupropion (Wellbutrin)', category: 'Depression' },
      { slug: 'venlafaxine-effexor', name: 'Venlafaxine (Effexor)', category: 'Depression / Anxiety' },
      { slug: 'duloxetine-cymbalta', name: 'Duloxetine (Cymbalta)', category: 'Depression / Anxiety' },
      { slug: 'buspirone-buspar', name: 'Buspirone (Buspar)', category: 'Anxiety' },
      { slug: 'hydroxyzine-vistaril', name: 'Hydroxyzine (Vistaril)', category: 'Anxiety' },
      { slug: 'trazodone-desyrel', name: 'Trazodone (Desyrel)', category: 'Depression / Insomnia' },
      { slug: 'mirtazapine-remeron', name: 'Mirtazapine (Remeron)', category: 'Depression' },
      { slug: 'gabapentin-neurontin', name: 'Gabapentin (Neurontin)', category: 'Anxiety / Nerve Pain' },
      { slug: 'lamotrigine-lamictal', name: 'Lamotrigine (Lamictal)', category: 'Bipolar Disorder' },
      { slug: 'quetiapine-seroquel', name: 'Quetiapine (Seroquel)', category: 'Bipolar / Depression' },
      { slug: 'aripiprazole-abilify', name: 'Aripiprazole (Abilify)', category: 'Bipolar / Depression' },
      { slug: 'atomoxetine-strattera', name: 'Atomoxetine (Strattera)', category: 'ADHD' },
      { slug: 'viloxazine-qelbree', name: 'Viloxazine (Qelbree)', category: 'ADHD' },
      { slug: 'propranolol-inderal', name: 'Propranolol (Inderal)', category: 'Anxiety' },
      { slug: 'prazosin-minipress', name: 'Prazosin (Minipress)', category: 'PTSD / Nightmares' },
    ];

    for (const med of medicationPages) {
      if (seenDrugs.has(med.name.toLowerCase())) continue;
      seenDrugs.add(med.name.toLowerCase());

      const url = `${baseUrl}/prescription-medication/${med.slug}`;
      console.log(`Scraping ${med.name}...`);

      try {
        await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        await this.delay(2000);

        const content = await this.page.content();
        const extractedData = this.extractMedicationData(content, med);

        drugs.push({
          externalName: med.name,
          url,
          category: med.category,
          requiresPrescription: true,
          requiresConsultation: true,
          rawData: {
            ...extractedData,
            businessModel: 'telehealth-mental-health',
            noControlledSubstances: true,
          },
        });
      } catch (err) {
        console.log(`Failed to scrape ${med.name}, using fallback data`);
        drugs.push({
          externalName: med.name,
          url,
          category: med.category,
          requiresPrescription: true,
          requiresConsultation: true,
          rawData: {
            businessModel: 'telehealth-mental-health',
            noControlledSubstances: true,
            source: 'fallback',
          },
        });
      }
    }

    const additionalMedications = this.getAdditionalMedications();
    for (const med of additionalMedications) {
      if (seenDrugs.has(med.name.toLowerCase())) continue;
      seenDrugs.add(med.name.toLowerCase());

      drugs.push({
        externalName: med.name,
        url: `${baseUrl}/prescription-medication`,
        category: med.category,
        requiresPrescription: true,
        requiresConsultation: true,
        rawData: {
          generic: med.generic,
          businessModel: 'telehealth-mental-health',
          noControlledSubstances: true,
          source: 'known-formulary',
        },
      });
    }

    return drugs;
  };

  private extractMedicationData = (
    html: string,
    med: { name: string; category: string }
  ): Record<string, any> => {
    const $ = cheerio.load(html);
    const data: Record<string, any> = {};

    const description = $('meta[name="description"]').attr('content') ||
                        $('p').first().text().trim().slice(0, 300);
    if (description) {
      data.description = description;
    }

    const pageText = $('body').text().toLowerCase();

    const conditions: string[] = [];
    const conditionKeywords = ['anxiety', 'depression', 'adhd', 'bipolar', 'ptsd', 'ocd', 'insomnia', 'panic'];
    for (const condition of conditionKeywords) {
      if (pageText.includes(condition)) {
        conditions.push(condition);
      }
    }
    if (conditions.length > 0) {
      data.treatsConditions = conditions;
    }

    return data;
  };

  private getAdditionalMedications = (): Array<{ name: string; generic: string; category: string }> => {
    return [
      { name: 'Fluvoxamine (Luvox)', generic: 'fluvoxamine', category: 'OCD / Anxiety' },
      { name: 'Nortriptyline (Pamelor)', generic: 'nortriptyline', category: 'Depression' },
      { name: 'Amitriptyline (Elavil)', generic: 'amitriptyline', category: 'Depression / Pain' },
      { name: 'Doxepin (Silenor)', generic: 'doxepin', category: 'Insomnia / Depression' },
      { name: 'Clonidine (Catapres)', generic: 'clonidine', category: 'ADHD / Anxiety' },
      { name: 'Guanfacine (Intuniv)', generic: 'guanfacine', category: 'ADHD' },
      { name: 'Lithium (Lithobid)', generic: 'lithium', category: 'Bipolar Disorder' },
      { name: 'Valproic Acid (Depakote)', generic: 'valproic acid', category: 'Bipolar Disorder' },
      { name: 'Carbamazepine (Tegretol)', generic: 'carbamazepine', category: 'Bipolar / Seizures' },
      { name: 'Olanzapine (Zyprexa)', generic: 'olanzapine', category: 'Bipolar / Schizophrenia' },
      { name: 'Risperidone (Risperdal)', generic: 'risperidone', category: 'Bipolar / Schizophrenia' },
      { name: 'Ziprasidone (Geodon)', generic: 'ziprasidone', category: 'Bipolar / Schizophrenia' },
    ];
  };
}
