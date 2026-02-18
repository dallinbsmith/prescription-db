import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/prescription_db',
});

interface CompetitorEntry {
  competitor: string;
  external_name: string;
  url: string;
  category: string;
  requires_prescription: boolean;
  requires_consultation: boolean;
  price: number | null;
  raw_data: object;
}

const competitors: CompetitorEntry[] = [
  // Weight Loss / GLP-1 Specialists
  {
    competitor: 'MEDVI',
    external_name: 'Semaglutide (Compounded)',
    url: 'https://www.medvidi.com/weight-loss',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 249,
    raw_data: { focus: 'Weight loss', model: 'Telehealth + compounded GLP-1', notes: 'Compounded semaglutide specialist' }
  },
  {
    competitor: 'MOCHI_HEALTH',
    external_name: 'Semaglutide Program',
    url: 'https://www.joinmochi.com',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 199,
    raw_data: { focus: 'Weight loss', model: 'Subscription GLP-1 program', notes: 'Asian-American focused branding, compounded semaglutide' }
  },
  {
    competitor: 'CALIBRATE',
    external_name: 'Metabolic Health Program',
    url: 'https://www.calibrate.com',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 1499,
    raw_data: { focus: 'Weight loss', model: 'Year-long metabolic reset program', notes: 'GLP-1 + coaching + food/sleep/exercise tracking' }
  },
  {
    competitor: 'EDEN',
    external_name: 'GLP-1 Weight Loss',
    url: 'https://www.edenhealthapp.com',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 299,
    raw_data: { focus: 'Weight loss', model: 'Telehealth GLP-1 prescriptions', notes: 'Also offers testosterone therapy' }
  },
  {
    competitor: 'YUCCA_HEALTH',
    external_name: 'Semaglutide Treatment',
    url: 'https://www.yuccahealth.com',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 249,
    raw_data: { focus: 'Weight loss', model: 'Compounded GLP-1 via telehealth', notes: 'Quick consultation process' }
  },
  {
    competitor: 'HENRY_MEDS',
    external_name: 'Compounded Semaglutide',
    url: 'https://henrymeds.com',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 297,
    raw_data: { focus: 'Weight loss', model: 'Subscription compounded GLP-1', notes: 'Also offers tirzepatide' }
  },
  {
    competitor: 'SESAME_CARE',
    external_name: 'Weight Loss Consultation',
    url: 'https://sesamecare.com/services/weight-loss',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 99,
    raw_data: { focus: 'General telehealth', model: 'Marketplace for clinician visits', notes: 'Transparent pricing, pay-per-visit' }
  },
  {
    competitor: 'WW_CLINIC',
    external_name: 'WeightWatchers Clinical',
    url: 'https://www.weightwatchers.com/us/clinic',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 99,
    raw_data: { focus: 'Weight loss', model: 'WW behavioral program + GLP-1 prescribing', notes: 'Partnership with Sequence (acquired)' }
  },
  {
    competitor: 'KNOWNWELL',
    external_name: 'Weight-Inclusive Care',
    url: 'https://www.knownwell.health',
    category: 'Weight Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: null,
    raw_data: { focus: 'Weight loss', model: 'Hybrid clinic + telehealth', notes: 'Weight-inclusive approach, GLP-1 available' }
  },

  // Men's Health
  {
    competitor: 'BLUECHEW',
    external_name: 'Sildenafil Chewable',
    url: 'https://www.bluechew.com',
    category: 'Mens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 20,
    raw_data: { focus: 'Mens health', model: 'Subscription chewable ED meds', notes: 'Compounded sildenafil/tadalafil chewables' }
  },
  {
    competitor: 'BLUECHEW',
    external_name: 'Tadalafil Chewable',
    url: 'https://www.bluechew.com',
    category: 'Mens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 90,
    raw_data: { focus: 'Mens health', model: 'Subscription chewable ED meds', notes: 'Compounded sildenafil/tadalafil chewables' }
  },
  {
    competitor: 'REX_MD',
    external_name: 'Sildenafil',
    url: 'https://www.rexmd.com',
    category: 'Mens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 4,
    raw_data: { focus: 'Mens health', model: 'ED and hair loss via telehealth', notes: 'Generic sildenafil at low prices' }
  },
  {
    competitor: 'KEEPS',
    external_name: 'Finasteride',
    url: 'https://www.keeps.com',
    category: 'Hair Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 25,
    raw_data: { focus: 'Hair loss', model: 'Subscription hair loss treatment', notes: 'Finasteride + minoxidil combo offerings' }
  },
  {
    competitor: 'KEEPS',
    external_name: 'Minoxidil Topical',
    url: 'https://www.keeps.com',
    category: 'Hair Loss',
    requires_prescription: false,
    requires_consultation: false,
    price: 15,
    raw_data: { focus: 'Hair loss', model: 'OTC and prescription hair loss', notes: 'Minoxidil is OTC' }
  },
  {
    competitor: 'HONE_HEALTH',
    external_name: 'Testosterone Therapy',
    url: 'https://www.honehealth.com',
    category: 'Hormone Therapy',
    requires_prescription: true,
    requires_consultation: true,
    price: 129,
    raw_data: { focus: 'Mens hormone optimization', model: 'At-home hormone testing + TRT', notes: 'Focuses on testosterone and hormone health' }
  },
  {
    competitor: 'TRT_NATION',
    external_name: 'Testosterone Cypionate',
    url: 'https://trtnation.com',
    category: 'Hormone Therapy',
    requires_prescription: true,
    requires_consultation: true,
    price: 99,
    raw_data: { focus: 'TRT', model: 'Testosterone replacement therapy', notes: 'Men with low T, ships injectable testosterone' }
  },
  {
    competitor: 'SHAPIRO_MD',
    external_name: 'Hair Loss System',
    url: 'https://shapiromd.com',
    category: 'Hair Loss',
    requires_prescription: true,
    requires_consultation: true,
    price: 99,
    raw_data: { focus: 'Hair loss', model: 'Comprehensive hair loss treatment', notes: 'Shampoo + finasteride + minoxidil system' }
  },
  {
    competitor: 'HELLO_CAKE',
    external_name: 'ED Treatment',
    url: 'https://hellocake.com',
    category: 'Sexual Wellness',
    requires_prescription: true,
    requires_consultation: true,
    price: 5,
    raw_data: { focus: 'Sexual wellness', model: 'ED meds + sexual wellness products', notes: 'Targets younger demographic, edgy branding' }
  },
  {
    competitor: 'FOUNTAIN_TRT',
    external_name: 'Testosterone Therapy',
    url: 'https://fountaintrt.com',
    category: 'Hormone Therapy',
    requires_prescription: true,
    requires_consultation: true,
    price: 99,
    raw_data: { focus: 'TRT', model: 'Online TRT clinic', notes: 'Focus on testosterone optimization' }
  },
  {
    competitor: 'MANGO_RX',
    external_name: 'Sildenafil',
    url: 'https://mangorx.com',
    category: 'Mens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 3,
    raw_data: { focus: 'ED', model: 'Low-cost ED medication', notes: 'Very aggressive pricing on generics' }
  },
  {
    competitor: 'T_TIME',
    external_name: 'Testosterone Cream',
    url: 'https://t.me/ttime',
    category: 'Hormone Therapy',
    requires_prescription: true,
    requires_consultation: true,
    price: 150,
    raw_data: { focus: 'TRT', model: 'Topical testosterone', notes: 'Compounded testosterone cream' }
  },
  {
    competitor: 'DEFY_MEDICAL',
    external_name: 'Hormone Optimization',
    url: 'https://defymedical.com',
    category: 'Hormone Therapy',
    requires_prescription: true,
    requires_consultation: true,
    price: 200,
    raw_data: { focus: 'Hormone optimization', model: 'Comprehensive hormone therapy', notes: 'Also offers peptides, GH secretagogues' }
  },

  // Women's Health
  {
    competitor: 'NURX',
    external_name: 'Birth Control',
    url: 'https://www.nurx.com',
    category: 'Womens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 15,
    raw_data: { focus: 'Womens health', model: 'Birth control and STI testing', notes: 'Large selection of birth control pills' }
  },
  {
    competitor: 'NURX',
    external_name: 'Genital Herpes Treatment',
    url: 'https://www.nurx.com/herpes',
    category: 'STI Treatment',
    requires_prescription: true,
    requires_consultation: true,
    price: 15,
    raw_data: { focus: 'Womens health', model: 'STI treatment', notes: 'Valacyclovir and acyclovir' }
  },
  {
    competitor: 'WISP',
    external_name: 'UTI Treatment',
    url: 'https://hellowisp.com',
    category: 'Womens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 59,
    raw_data: { focus: 'Womens health', model: 'UTI, yeast, BV, and herpes treatment', notes: 'Fast async consultation' }
  },
  {
    competitor: 'SIMPLE_HEALTH',
    external_name: 'Birth Control Pill',
    url: 'https://www.simplehealth.com',
    category: 'Womens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 0,
    raw_data: { focus: 'Birth control', model: 'Free birth control with insurance', notes: 'Partners with insurance, some plans $0' }
  },
  {
    competitor: 'EVERNOW',
    external_name: 'Menopause HRT',
    url: 'https://www.evernow.com',
    category: 'Menopause',
    requires_prescription: true,
    requires_consultation: true,
    price: 149,
    raw_data: { focus: 'Menopause', model: 'Hormone replacement therapy', notes: 'Estradiol, progesterone for menopause' }
  },
  {
    competitor: 'MIDI_HEALTH',
    external_name: 'Menopause Care',
    url: 'https://www.joinmidi.com',
    category: 'Menopause',
    requires_prescription: true,
    requires_consultation: true,
    price: 250,
    raw_data: { focus: 'Menopause', model: 'Comprehensive menopause care', notes: 'Video visits with menopause specialists' }
  },
  {
    competitor: 'ALLOY',
    external_name: 'Estradiol Patch',
    url: 'https://www.myalloy.com',
    category: 'Menopause',
    requires_prescription: true,
    requires_consultation: true,
    price: 85,
    raw_data: { focus: 'Menopause', model: 'Hormone therapy for menopause', notes: 'Patches, creams, pills' }
  },
  {
    competitor: 'WINONA',
    external_name: 'HRT',
    url: 'https://bywinona.com',
    category: 'Menopause',
    requires_prescription: true,
    requires_consultation: true,
    price: 60,
    raw_data: { focus: 'Menopause', model: 'Bioidentical hormones for menopause', notes: 'Compounded options available' }
  },
  {
    competitor: 'GENNEV',
    external_name: 'Menopause Support',
    url: 'https://gennev.com',
    category: 'Menopause',
    requires_prescription: true,
    requires_consultation: true,
    price: 99,
    raw_data: { focus: 'Menopause', model: 'Telehealth + supplements + coaching', notes: 'Holistic menopause approach' }
  },
  {
    competitor: 'CUROLOGY',
    external_name: 'Custom Skincare Formula',
    url: 'https://curology.com',
    category: 'Skincare',
    requires_prescription: true,
    requires_consultation: true,
    price: 30,
    raw_data: { focus: 'Skincare', model: 'Custom compounded skincare', notes: 'Tretinoin, clindamycin, niacinamide combinations' }
  },

  // Mental Health
  {
    competitor: 'CEREBRAL',
    external_name: 'Antidepressant',
    url: 'https://cerebral.com',
    category: 'Mental Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 85,
    raw_data: { focus: 'Mental health', model: 'Therapy + medication management', notes: 'SSRIs, SNRIs, anxiety meds' }
  },
  {
    competitor: 'TALKIATRY',
    external_name: 'Psychiatric Consultation',
    url: 'https://www.talkiatry.com',
    category: 'Mental Health',
    requires_prescription: true,
    requires_consultation: true,
    price: null,
    raw_data: { focus: 'Psychiatry', model: 'In-network psychiatry', notes: 'Takes insurance, psychiatric medication management' }
  },
  {
    competitor: 'DONE',
    external_name: 'ADHD Medication',
    url: 'https://www.donefirst.com',
    category: 'Mental Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 199,
    raw_data: { focus: 'ADHD', model: 'ADHD diagnosis and medication', notes: 'Stimulant and non-stimulant options, controversy around prescribing' }
  },
  {
    competitor: 'KLARITY',
    external_name: 'ADHD Treatment',
    url: 'https://klarityadhd.com',
    category: 'Mental Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 149,
    raw_data: { focus: 'ADHD', model: 'ADHD telehealth', notes: 'Adderall, Vyvanse, Concerta options' }
  },
  {
    competitor: 'DOCTOR_ON_DEMAND',
    external_name: 'Psychiatry Visit',
    url: 'https://doctorondemand.com',
    category: 'Mental Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 299,
    raw_data: { focus: 'General telehealth', model: 'Video visits with doctors', notes: 'Broad telehealth, psychiatry available' }
  },
  {
    competitor: 'MDLIVE',
    external_name: 'Mental Health Consult',
    url: 'https://www.mdlive.com',
    category: 'Mental Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 284,
    raw_data: { focus: 'General telehealth', model: 'Telehealth platform', notes: 'Owned by Cigna, psychiatry and therapy' }
  },

  // General Telehealth with Pharmacy
  {
    competitor: 'LIFEMD',
    external_name: 'Primary Care Visit',
    url: 'https://lifemd.com',
    category: 'Primary Care',
    requires_prescription: true,
    requires_consultation: true,
    price: 75,
    raw_data: { focus: 'Primary care', model: 'Telehealth for common conditions', notes: 'Weight loss, ED, hair loss, skincare' }
  },
  {
    competitor: 'LEMONAID_HEALTH',
    external_name: 'Online Doctor Visit',
    url: 'https://www.lemonaidhealth.com',
    category: 'Primary Care',
    requires_prescription: true,
    requires_consultation: true,
    price: 25,
    raw_data: { focus: 'Primary care', model: 'Affordable telehealth visits', notes: 'Wide range of conditions, generic meds' }
  },
  {
    competitor: 'PLUSHCARE',
    external_name: 'Urgent Care Visit',
    url: 'https://www.plushcare.com',
    category: 'Primary Care',
    requires_prescription: true,
    requires_consultation: true,
    price: 129,
    raw_data: { focus: 'Primary care', model: 'Video visits, accepts insurance', notes: 'Acquired by Accolade' }
  },
  {
    competitor: 'AMAZON_PHARMACY',
    external_name: 'Generic Medication',
    url: 'https://pharmacy.amazon.com',
    category: 'Mail Order',
    requires_prescription: true,
    requires_consultation: false,
    price: 5,
    raw_data: { focus: 'Mail order pharmacy', model: 'Amazon Prime Rx discount program', notes: 'Deep discounts for Prime members, acquired PillPack' }
  },
  {
    competitor: 'PILLPACK',
    external_name: 'Medication Sync Service',
    url: 'https://www.pillpack.com',
    category: 'Mail Order',
    requires_prescription: true,
    requires_consultation: false,
    price: null,
    raw_data: { focus: 'Mail order pharmacy', model: 'Pre-sorted medication packets', notes: 'Amazon-owned, good for polypharmacy patients' }
  },
  {
    competitor: 'QUICKMD',
    external_name: 'Suboxone Treatment',
    url: 'https://quickmd.com',
    category: 'Addiction Medicine',
    requires_prescription: true,
    requires_consultation: true,
    price: 99,
    raw_data: { focus: 'Addiction medicine', model: 'MAT via telehealth', notes: 'Suboxone for opioid use disorder' }
  },

  // Compounding Pharmacies
  {
    competitor: 'EMPOWER_PHARMACY',
    external_name: 'Compounded Semaglutide',
    url: 'https://www.empowerpharmacy.com',
    category: 'Compounding',
    requires_prescription: true,
    requires_consultation: false,
    price: 150,
    raw_data: { focus: '503B compounding', model: 'Large-scale compounding outsourcing facility', notes: 'Major supplier for telehealth companies' }
  },
  {
    competitor: 'EMPOWER_PHARMACY',
    external_name: 'Compounded Tirzepatide',
    url: 'https://www.empowerpharmacy.com',
    category: 'Compounding',
    requires_prescription: true,
    requires_consultation: false,
    price: 350,
    raw_data: { focus: '503B compounding', model: 'Large-scale compounding outsourcing facility', notes: 'Major supplier for telehealth companies' }
  },
  {
    competitor: 'OLYMPIA_PHARMACEUTICALS',
    external_name: 'Compounded Testosterone',
    url: 'https://olympiapharmacy.com',
    category: 'Compounding',
    requires_prescription: true,
    requires_consultation: false,
    price: 60,
    raw_data: { focus: '503B compounding', model: 'Outsourcing facility', notes: 'Hormones, peptides, injectables' }
  },
  {
    competitor: 'STRIVE_PHARMACY',
    external_name: 'Compounded Semaglutide',
    url: 'https://strivepharmacy.com',
    category: 'Compounding',
    requires_prescription: true,
    requires_consultation: false,
    price: 175,
    raw_data: { focus: '503A/B compounding', model: 'Patient-specific and bulk compounding', notes: 'Supplies multiple telehealth platforms' }
  },

  // Peptides and Longevity
  {
    competitor: 'AGELESS_RX',
    external_name: 'Rapamycin',
    url: 'https://www.agelessrx.com',
    category: 'Longevity',
    requires_prescription: true,
    requires_consultation: true,
    price: 150,
    raw_data: { focus: 'Longevity', model: 'Anti-aging medications via telehealth', notes: 'Rapamycin, metformin, NAD+ precursors' }
  },
  {
    competitor: 'AGELESS_RX',
    external_name: 'Metformin for Longevity',
    url: 'https://www.agelessrx.com',
    category: 'Longevity',
    requires_prescription: true,
    requires_consultation: true,
    price: 30,
    raw_data: { focus: 'Longevity', model: 'Anti-aging protocols', notes: 'Off-label metformin for aging' }
  },
  {
    competitor: 'IVY_RX',
    external_name: 'Peptide Therapy',
    url: 'https://ivyrx.com',
    category: 'Peptides',
    requires_prescription: true,
    requires_consultation: true,
    price: 200,
    raw_data: { focus: 'Peptides', model: 'Performance peptides', notes: 'BPC-157, PT-141, various peptides' }
  },
  {
    competitor: 'MAREK_HEALTH',
    external_name: 'TRT Protocol',
    url: 'https://marekhealth.com',
    category: 'Hormone Optimization',
    requires_prescription: true,
    requires_consultation: true,
    price: 250,
    raw_data: { focus: 'Performance optimization', model: 'Hormone + peptide optimization', notes: 'Fitness/biohacker focused, Derek from MPMD' }
  },

  // Discount Pharmacy
  {
    competitor: 'BLINK_HEALTH',
    external_name: 'Generic Medication',
    url: 'https://www.blinkhealth.com',
    category: 'Discount',
    requires_prescription: true,
    requires_consultation: false,
    price: null,
    raw_data: { focus: 'Prescription discounts', model: 'Pharmacy discount platform', notes: 'Negotiated prices, pick up at local pharmacy' }
  },
  {
    competitor: 'HONEYBEE_HEALTH',
    external_name: 'Affordable Generics',
    url: 'https://www.honeybeehealth.com',
    category: 'Discount',
    requires_prescription: true,
    requires_consultation: false,
    price: null,
    raw_data: { focus: 'Mail order', model: 'Transparent pricing mail-order pharmacy', notes: 'No hidden fees, shows actual costs' }
  },
  {
    competitor: 'ALTO_PHARMACY',
    external_name: 'Prescription Delivery',
    url: 'https://alto.com',
    category: 'Delivery',
    requires_prescription: true,
    requires_consultation: false,
    price: null,
    raw_data: { focus: 'Pharmacy delivery', model: 'Same-day delivery pharmacy', notes: 'Full-service pharmacy with courier delivery' }
  },
  {
    competitor: 'CAPSULE_PHARMACY',
    external_name: 'Prescription Delivery',
    url: 'https://www.capsule.com',
    category: 'Delivery',
    requires_prescription: true,
    requires_consultation: false,
    price: null,
    raw_data: { focus: 'Pharmacy delivery', model: 'Same-day delivery pharmacy', notes: 'Urban markets, same-day courier' }
  },

  // Existing competitors (to ensure they're in the list)
  {
    competitor: 'HIMS',
    external_name: 'Sildenafil',
    url: 'https://www.forhims.com/sexual-health',
    category: 'Mens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 2,
    raw_data: { focus: 'Mens health', model: 'Telehealth + pharmacy', notes: 'ED, hair loss, mental health, skincare' }
  },
  {
    competitor: 'HERS',
    external_name: 'Spironolactone',
    url: 'https://www.forhers.com',
    category: 'Womens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 29,
    raw_data: { focus: 'Womens health', model: 'Telehealth + pharmacy', notes: 'Skincare, hair loss, mental health, birth control' }
  },
  {
    competitor: 'COST_PLUS_DRUGS',
    external_name: 'Imatinib',
    url: 'https://costplusdrugs.com/medications/imatinib-100mg-tablet',
    category: 'Generic',
    requires_prescription: true,
    requires_consultation: false,
    price: 47,
    raw_data: { focus: 'Transparent pricing', model: 'Cost-plus pharmacy', notes: 'Mark Cuban company, transparent markup model' }
  },
  {
    competitor: 'RO',
    external_name: 'Sildenafil',
    url: 'https://ro.co/erectile-dysfunction',
    category: 'Mens Health',
    requires_prescription: true,
    requires_consultation: true,
    price: 1,
    raw_data: { focus: 'Mens health', model: 'Telehealth + pharmacy', notes: 'ED, hair loss, weight loss, quit smoking' }
  },
  {
    competitor: 'GOODRX',
    external_name: 'Discount Coupons',
    url: 'https://www.goodrx.com',
    category: 'Discount',
    requires_prescription: true,
    requires_consultation: false,
    price: null,
    raw_data: { focus: 'Rx discounts', model: 'Pharmacy benefit manager', notes: 'Coupons for local pharmacies, also has GoodRx Care telehealth' }
  },
];

const seedCompetitors = async () => {
  console.log('Starting competitor seeding...\n');

  try {
    const existingResult = await pool.query('SELECT COUNT(*) FROM competitor_drugs');
    console.log(`Existing competitor drug entries: ${existingResult.rows[0].count}`);

    let inserted = 0;
    let skipped = 0;

    for (const entry of competitors) {
      const existsResult = await pool.query(
        'SELECT id FROM competitor_drugs WHERE competitor = $1 AND external_name = $2',
        [entry.competitor, entry.external_name]
      );

      if (existsResult.rows.length > 0) {
        skipped++;
        continue;
      }

      await pool.query(
        `INSERT INTO competitor_drugs (
          id, competitor, drug_id, external_name, url, price, category,
          requires_prescription, requires_consultation, raw_data, scraped_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          uuid(),
          entry.competitor,
          null,
          entry.external_name,
          entry.url,
          entry.price,
          entry.category,
          entry.requires_prescription,
          entry.requires_consultation,
          JSON.stringify(entry.raw_data),
          new Date(),
        ]
      );
      inserted++;
    }

    console.log(`\nSeeding complete:`);
    console.log(`  - Inserted: ${inserted} new entries`);
    console.log(`  - Skipped: ${skipped} existing entries`);

    const competitorCounts = await pool.query(`
      SELECT competitor, COUNT(*) as count
      FROM competitor_drugs
      GROUP BY competitor
      ORDER BY competitor
    `);

    console.log(`\nCompetitors in database:`);
    for (const row of competitorCounts.rows) {
      console.log(`  - ${row.competitor}: ${row.count} drugs`);
    }

  } catch (error) {
    console.error('Error seeding competitors:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

seedCompetitors();
