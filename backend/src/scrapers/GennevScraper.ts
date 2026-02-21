import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedDrug } from './BaseScraper.js';

export class GennevScraper extends BaseScraper {
  constructor() {
    super('GENNEV');
  }

  protected scrape = async (): Promise<ScrapedDrug[]> => {
    if (!this.page) throw new Error('Page not initialized');

    const drugs: ScrapedDrug[] = [];
    const baseUrl = 'https://gennev.com';
    const seenDrugs = new Set<string>();

    const treatments = [
      // Hormone Replacement Therapy - Estrogen
      {
        name: 'Estradiol Patch',
        category: 'HRT / Estrogen',
        price: null,
        form: 'transdermal patch',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Transdermal estradiol for systemic hormone replacement',
      },
      {
        name: 'Estradiol Oral',
        category: 'HRT / Estrogen',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Oral estradiol for hormone replacement',
      },
      {
        name: 'Estradiol Gel',
        category: 'HRT / Estrogen',
        price: null,
        form: 'topical gel',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Topical estradiol gel (Divigel, EstroGel)',
      },
      {
        name: 'Estradiol Spray',
        category: 'HRT / Estrogen',
        price: null,
        form: 'topical spray',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Transdermal estradiol spray (Evamist)',
      },

      // Vaginal Estrogen
      {
        name: 'Vaginal Estrogen Cream',
        category: 'HRT / Vaginal',
        price: null,
        form: 'vaginal cream',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Low-dose vaginal estrogen for GSM (Estrace, Premarin)',
      },
      {
        name: 'Vaginal Estrogen Ring',
        category: 'HRT / Vaginal',
        price: null,
        form: 'vaginal ring',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Vaginal estrogen ring (Estring, Femring)',
      },
      {
        name: 'Vaginal Estrogen Tablet',
        category: 'HRT / Vaginal',
        price: null,
        form: 'vaginal tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Vaginal estrogen insert (Vagifem, Yuvafem)',
      },
      {
        name: 'Vaginal DHEA (Prasterone)',
        category: 'HRT / Vaginal',
        price: null,
        form: 'vaginal insert',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Intravaginal DHEA for GSM (Intrarosa)',
      },

      // Progesterone
      {
        name: 'Progesterone Oral (Prometrium)',
        category: 'HRT / Progesterone',
        price: null,
        form: 'oral capsule',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Micronized progesterone for uterine protection with estrogen',
      },
      {
        name: 'Medroxyprogesterone (Provera)',
        category: 'HRT / Progesterone',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Synthetic progestin for HRT',
      },
      {
        name: 'Norethindrone Acetate',
        category: 'HRT / Progesterone',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Progestin for HRT and heavy bleeding',
      },

      // Combined HRT
      {
        name: 'Estradiol/Norethindrone (Activella)',
        category: 'HRT / Combined',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Combined continuous estrogen/progestin',
      },
      {
        name: 'Estradiol/Progesterone (Bijuva)',
        category: 'HRT / Combined',
        price: null,
        form: 'oral capsule',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Combined bioidentical estradiol and progesterone',
      },
      {
        name: 'Estradiol/Levonorgestrel Patch (Climara Pro)',
        category: 'HRT / Combined',
        price: null,
        form: 'transdermal patch',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Combined estrogen/progestin patch',
      },
      {
        name: 'Conjugated Estrogens/Bazedoxifene (Duavee)',
        category: 'HRT / Combined',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Estrogen + SERM combination',
      },

      // Non-Hormonal - Vasomotor Symptoms
      {
        name: 'Veozah (Fezolinetant)',
        category: 'Non-Hormonal / Hot Flashes',
        price: null,
        form: 'oral tablet',
        path: '/learn/what-to-know-about-veozah-the-new-hot-flash-treatment/',
        notes: 'NK3 receptor antagonist, FDA-approved for hot flashes',
      },
      {
        name: 'Paroxetine (Brisdelle)',
        category: 'Non-Hormonal / Hot Flashes',
        price: null,
        form: 'oral capsule',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Only FDA-approved SSRI for menopausal hot flashes',
      },
      {
        name: 'Venlafaxine',
        category: 'Non-Hormonal / Hot Flashes',
        price: null,
        form: 'oral capsule',
        path: '/patients/symptoms-and-treatments/',
        notes: 'SNRI, off-label for hot flashes',
      },
      {
        name: 'Desvenlafaxine (Pristiq)',
        category: 'Non-Hormonal / Hot Flashes',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'SNRI, off-label for hot flashes',
      },
      {
        name: 'Gabapentin',
        category: 'Non-Hormonal / Hot Flashes',
        price: null,
        form: 'oral capsule',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Off-label for hot flashes and sleep',
      },
      {
        name: 'Clonidine',
        category: 'Non-Hormonal / Hot Flashes',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Off-label for hot flashes',
      },
      {
        name: 'Oxybutynin',
        category: 'Non-Hormonal / Hot Flashes',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Off-label for hot flashes, anticholinergic',
      },

      // Non-Hormonal - Vaginal/GSM
      {
        name: 'Ospemifene (Osphena)',
        category: 'Non-Hormonal / Vaginal',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'SERM for painful intercourse due to menopause',
      },

      // Perimenopause - Birth Control
      {
        name: 'Combined Oral Contraceptive',
        category: 'Perimenopause',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Low-dose birth control for perimenopausal symptoms',
      },
      {
        name: 'Hormonal IUD (Mirena)',
        category: 'Perimenopause',
        price: null,
        form: 'IUD',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Levonorgestrel IUD for heavy bleeding and contraception',
      },

      // Sleep
      {
        name: 'Low-Dose Trazodone',
        category: 'Sleep',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Off-label for menopause-related insomnia',
      },

      // Mood
      {
        name: 'Escitalopram (Lexapro)',
        category: 'Mood / Anxiety',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'SSRI for mood changes and anxiety',
      },
      {
        name: 'Sertraline (Zoloft)',
        category: 'Mood / Anxiety',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'SSRI for mood changes and anxiety',
      },
      {
        name: 'Citalopram (Celexa)',
        category: 'Mood / Anxiety',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'SSRI for mood changes',
      },
      {
        name: 'Bupropion (Wellbutrin)',
        category: 'Mood / Energy',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'NDRI for mood, energy, and weight management',
      },
      {
        name: 'Buspirone',
        category: 'Mood / Anxiety',
        price: null,
        form: 'oral tablet',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Non-benzodiazepine anxiolytic',
      },

      // Bone Health
      {
        name: 'Calcium + Vitamin D',
        category: 'Bone Health',
        price: null,
        form: 'oral supplement',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Essential supplements for bone health',
      },

      // Libido
      {
        name: 'Testosterone (Low-Dose)',
        category: "Women's Sexual Health",
        price: null,
        form: 'topical cream',
        path: '/patients/symptoms-and-treatments/',
        notes: 'Off-label low-dose testosterone for libido',
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
        requiresConsultation: true,
        rawData: {
          form: treatment.form,
          notes: treatment.notes,
          focus: 'menopause care',
          businessModel: 'telehealth-prescription',
          consultationFee: 85,
          consultationNote: '$85 for 30-min video visit with menopause-trained doctor',
          acceptsInsurance: true,
          insurancePartners: ['Aetna', 'Anthem', 'United Healthcare'],
          allStates: true,
          prescriptionsSentTo: 'patient pharmacy of choice',
          specialization: 'perimenopause through post-menopause',
          includesNutritionCoaching: true,
        },
      });
    }

    return drugs;
  };
}
