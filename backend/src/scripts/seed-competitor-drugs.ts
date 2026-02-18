import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/prescription_db',
});

interface DrugEntry {
  competitor: string;
  external_name: string;
  url: string;
  category: string;
  requires_prescription: boolean;
  requires_consultation: boolean;
  price: number | null;
  raw_data: object;
}

const competitorDrugs: DrugEntry[] = [
  // =====================
  // HIMS - Complete Drug List
  // =====================
  // ED
  { competitor: 'HIMS', external_name: 'Sildenafil 25mg', url: 'https://www.hims.com/erectile-dysfunction/sildenafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 4, raw_data: { form: 'tablet', generic: true, brandName: 'Viagra' } },
  { competitor: 'HIMS', external_name: 'Sildenafil 50mg', url: 'https://www.hims.com/erectile-dysfunction/sildenafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 4, raw_data: { form: 'tablet', generic: true, brandName: 'Viagra' } },
  { competitor: 'HIMS', external_name: 'Sildenafil 100mg', url: 'https://www.hims.com/erectile-dysfunction/sildenafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 4, raw_data: { form: 'tablet', generic: true, brandName: 'Viagra' } },
  { competitor: 'HIMS', external_name: 'Sildenafil Chewable', url: 'https://www.hims.com/erectile-dysfunction/sildenafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 6, raw_data: { form: 'chewable', compounded: true } },
  { competitor: 'HIMS', external_name: 'Tadalafil 5mg Daily', url: 'https://www.hims.com/erectile-dysfunction/tadalafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 32, raw_data: { form: 'tablet', generic: true, brandName: 'Cialis', dosing: 'daily', priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Tadalafil 10mg', url: 'https://www.hims.com/erectile-dysfunction/tadalafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 6, raw_data: { form: 'tablet', generic: true, brandName: 'Cialis', dosing: 'as-needed' } },
  { competitor: 'HIMS', external_name: 'Tadalafil 20mg', url: 'https://www.hims.com/erectile-dysfunction/tadalafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 6, raw_data: { form: 'tablet', generic: true, brandName: 'Cialis', dosing: 'as-needed' } },
  { competitor: 'HIMS', external_name: 'Tadalafil Chewable', url: 'https://www.hims.com/erectile-dysfunction/tadalafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 6, raw_data: { form: 'chewable', compounded: true } },
  { competitor: 'HIMS', external_name: 'Vardenafil', url: 'https://www.hims.com/erectile-dysfunction', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'tablet', generic: true, brandName: 'Levitra' } },
  { competitor: 'HIMS', external_name: 'Avanafil', url: 'https://www.hims.com/erectile-dysfunction', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'tablet', generic: true, brandName: 'Stendra' } },
  // Hair Loss
  { competitor: 'HIMS', external_name: 'Finasteride 1mg Oral', url: 'https://www.hims.com/hair-loss', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: 22, raw_data: { form: 'tablet', generic: true, brandName: 'Propecia', priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Topical Finasteride 0.3%', url: 'https://www.hims.com/hair-loss/topical-finasteride', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: 35, raw_data: { form: 'topical spray', priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Minoxidil 5% Solution', url: 'https://www.hims.com/hair-loss', category: 'Hair Loss', requires_prescription: false, requires_consultation: false, price: 35, raw_data: { form: 'topical solution', priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Minoxidil 6% Spray', url: 'https://www.hims.com/hair-loss', category: 'Hair Loss', requires_prescription: false, requires_consultation: false, price: 35, raw_data: { form: 'topical spray', priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Finasteride + Minoxidil Topical', url: 'https://www.hims.com/hair-loss', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: 35, raw_data: { form: 'topical spray', concentration: '0.3% fin + 6% min', priceType: 'monthly' } },
  // Weight Loss
  { competitor: 'HIMS', external_name: 'Compounded Semaglutide Injectable', url: 'https://www.hims.com/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 199, raw_data: { form: 'injectable', compounded: true, priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Compounded Semaglutide Oral', url: 'https://www.hims.com/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 49, raw_data: { form: 'oral pill', compounded: true, priceType: 'monthly', introPrice: true } },
  { competitor: 'HIMS', external_name: 'Wegovy', url: 'https://www.hims.com/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', brand: true, genericName: 'semaglutide' } },
  { competitor: 'HIMS', external_name: 'Tirzepatide', url: 'https://www.hims.com/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', brandNames: ['Mounjaro', 'Zepbound'] } },
  { competitor: 'HIMS', external_name: 'Oral Weight Loss Kit (Metformin + Bupropion)', url: 'https://www.hims.com/weight-loss/oral-weight-loss-medication-kits', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 69, raw_data: { form: 'oral kit', contents: ['metformin', 'bupropion'], priceType: 'monthly' } },
  // Mental Health
  { competitor: 'HIMS', external_name: 'Sertraline (Zoloft)', url: 'https://www.hims.com/mental-health', category: 'Mental Health', requires_prescription: true, requires_consultation: true, price: 49, raw_data: { form: 'tablet', generic: true, priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Escitalopram (Lexapro)', url: 'https://www.hims.com/mental-health', category: 'Mental Health', requires_prescription: true, requires_consultation: true, price: 49, raw_data: { form: 'tablet', generic: true, priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Fluoxetine (Prozac)', url: 'https://www.hims.com/mental-health', category: 'Mental Health', requires_prescription: true, requires_consultation: true, price: 49, raw_data: { form: 'tablet', generic: true, priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Bupropion XL (Wellbutrin)', url: 'https://www.hims.com/mental-health', category: 'Mental Health', requires_prescription: true, requires_consultation: true, price: 49, raw_data: { form: 'tablet', generic: true, priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Duloxetine (Cymbalta)', url: 'https://www.hims.com/mental-health', category: 'Mental Health', requires_prescription: true, requires_consultation: true, price: 49, raw_data: { form: 'capsule', generic: true, priceType: 'monthly' } },
  // Skin Care
  { competitor: 'HIMS', external_name: 'Tretinoin Anti-Aging Cream', url: 'https://www.hims.com/skin-care/anti-aging', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: 45, raw_data: { form: 'cream', ingredients: ['tretinoin', 'azelaic acid', 'niacinamide'], priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Acne Cream (Tretinoin + Clindamycin)', url: 'https://www.hims.com/skin-care/acne-treatment', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: 45, raw_data: { form: 'cream', ingredients: ['tretinoin', 'clindamycin', 'zinc pyrithione'], priceType: 'monthly' } },
  // Sexual Health
  { competitor: 'HIMS', external_name: 'Valacyclovir (Valtrex)', url: 'https://www.hims.com/sexual-health/valacyclovir', category: 'Herpes', requires_prescription: true, requires_consultation: true, price: 24, raw_data: { form: 'tablet', generic: true, priceType: 'monthly' } },
  { competitor: 'HIMS', external_name: 'Sertraline for PE', url: 'https://www.hims.com/premature-ejaculation', category: 'Premature Ejaculation', requires_prescription: true, requires_consultation: true, price: 24, raw_data: { form: 'tablet', offLabel: true, priceType: 'monthly' } },
  // Heart Health
  { competitor: 'HIMS', external_name: 'Atorvastatin (Lipitor)', url: 'https://www.hims.com/heart-health', category: 'Heart Health', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'tablet', generic: true, use: 'cholesterol' } },
  { competitor: 'HIMS', external_name: 'Rosuvastatin (Crestor)', url: 'https://www.hims.com/heart-health', category: 'Heart Health', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'tablet', generic: true, use: 'cholesterol' } },

  // =====================
  // RO - Complete Drug List
  // =====================
  // ED
  { competitor: 'RO', external_name: 'Sildenafil (Generic Viagra)', url: 'https://ro.co/erectile-dysfunction/sildenafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 2, raw_data: { dosages: ['25mg', '50mg', '100mg'] } },
  { competitor: 'RO', external_name: 'Tadalafil (Generic Cialis)', url: 'https://ro.co/erectile-dysfunction/tadalafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 2, raw_data: { dosages: ['5mg', '10mg', '20mg'] } },
  { competitor: 'RO', external_name: 'Ro Sparks (Sildenafil + Tadalafil)', url: 'https://ro.co/erectile-dysfunction/sparks', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'combination', proprietary: true } },
  { competitor: 'RO', external_name: 'Daily Rise Gummies (Tadalafil)', url: 'https://ro.co/erectile-dysfunction/daily-rise-gummies', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'gummy', tadalafil: '7mg' } },
  // Hair Loss
  { competitor: 'RO', external_name: 'Finasteride 1mg', url: 'https://ro.co/medications/finasteride', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'tablet', generic: true } },
  { competitor: 'RO', external_name: 'Ro Mane Spray (Finasteride + Minoxidil)', url: 'https://ro.co/medications/ro-mane-spray', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'topical spray', combination: true } },
  { competitor: 'RO', external_name: 'Oral Minoxidil', url: 'https://ro.co/medications/oral-minoxidil', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'tablet' } },
  { competitor: 'RO', external_name: 'Topical Minoxidil 5%', url: 'https://ro.co/medications/minoxidil', category: 'Hair Loss', requires_prescription: false, requires_consultation: false, price: null, raw_data: { form: 'topical' } },
  // Weight Loss
  { competitor: 'RO', external_name: 'Wegovy (Semaglutide)', url: 'https://ro.co/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', brand: true } },
  { competitor: 'RO', external_name: 'Zepbound (Tirzepatide)', url: 'https://ro.co/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', brand: true } },
  { competitor: 'RO', external_name: 'Compounded Semaglutide', url: 'https://ro.co/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', compounded: true } },
  // Herpes
  { competitor: 'RO', external_name: 'Valacyclovir (Valtrex)', url: 'https://ro.co/medications/valacyclovir', category: 'Herpes', requires_prescription: true, requires_consultation: true, price: null, raw_data: { dosages: ['500mg', '1000mg'], uses: ['cold sores', 'genital herpes'] } },
  // PE
  { competitor: 'RO', external_name: 'Roman Swipes (Benzocaine)', url: 'https://ro.co/products/swipes', category: 'Premature Ejaculation', requires_prescription: false, requires_consultation: false, price: null, raw_data: { form: 'topical wipes', otc: true } },
  { competitor: 'RO', external_name: 'Sertraline for PE', url: 'https://ro.co/medications/sertraline', category: 'Premature Ejaculation', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'tablet', offLabel: true } },
  // Dermatology
  { competitor: 'RO', external_name: 'Custom Rx Treatment (Dermatology)', url: 'https://ro.co/dermatology/custom-rx-treatment', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'topical', compounded: true } },
  { competitor: 'RO', external_name: 'Latisse (Bimatoprost)', url: 'https://ro.co/medications/latisse', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { use: 'eyelash growth' } },

  // =====================
  // BLUECHEW - Complete Drug List
  // =====================
  { competitor: 'BLUECHEW', external_name: 'Sildenafil Chewable 30mg', url: 'https://bluechew.com/plans', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 2.94, raw_data: { form: 'chewable', productName: 'SIL' } },
  { competitor: 'BLUECHEW', external_name: 'Sildenafil Chewable 45mg', url: 'https://bluechew.com/plans', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 2.94, raw_data: { form: 'chewable', productName: 'SIL' } },
  { competitor: 'BLUECHEW', external_name: 'Tadalafil Chewable 6mg', url: 'https://bluechew.com/plans', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 3.57, raw_data: { form: 'chewable', productName: 'TAD' } },
  { competitor: 'BLUECHEW', external_name: 'Tadalafil Chewable 9mg', url: 'https://bluechew.com/plans', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 3.57, raw_data: { form: 'chewable', productName: 'TAD' } },
  { competitor: 'BLUECHEW', external_name: 'Vardenafil Chewable 8mg', url: 'https://bluechew.com/plans', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 4.33, raw_data: { form: 'chewable', productName: 'VAR' } },
  { competitor: 'BLUECHEW', external_name: 'MAX (Sildenafil 45mg + Tadalafil 18mg)', url: 'https://bluechew.com/plans', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 5.63, raw_data: { form: 'combination chewable' } },
  { competitor: 'BLUECHEW', external_name: 'VMAX (Vardenafil 14mg + Tadalafil 18mg)', url: 'https://bluechew.com/plans', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 5.63, raw_data: { form: 'combination chewable' } },
  { competitor: 'BLUECHEW', external_name: 'DailyTAD (Tadalafil 9mg + Vitamins)', url: 'https://bluechew.com/plans', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 2.22, raw_data: { form: 'daily chewable' } },

  // =====================
  // KEEPS - Complete Drug List
  // =====================
  { competitor: 'KEEPS', external_name: 'Finasteride 1mg', url: 'https://www.keeps.com/our-products', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: 26.67, raw_data: { form: 'tablet', quantity: 90, priceFor: '3 months' } },
  { competitor: 'KEEPS', external_name: 'Topical Finasteride + Minoxidil Gel', url: 'https://www.keeps.com/our-products/topical-finasteride-and-minoxidil', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: 60, raw_data: { form: 'gel', concentration: '0.25% fin + 5% min', priceType: 'monthly' } },
  { competitor: 'KEEPS', external_name: 'Topical Finasteride + Minoxidil Foam', url: 'https://www.keeps.com/our-products/topical-finasteride-minoxidil-foam', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: 50, raw_data: { form: 'foam', concentration: '0.25% fin + 5% min', priceType: 'monthly' } },
  { competitor: 'KEEPS', external_name: 'Minoxidil 5% Solution', url: 'https://www.keeps.com/our-products', category: 'Hair Loss', requires_prescription: false, requires_consultation: false, price: 60, raw_data: { form: 'solution', priceFor: '3 months' } },
  { competitor: 'KEEPS', external_name: 'Minoxidil 5% Foam', url: 'https://www.keeps.com/our-products', category: 'Hair Loss', requires_prescription: false, requires_consultation: false, price: null, raw_data: { form: 'foam' } },
  { competitor: 'KEEPS', external_name: 'Ketoconazole 2% Shampoo', url: 'https://www.keeps.com/our-products', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: 11, raw_data: { form: 'shampoo', priceFor: '3 months' } },

  // =====================
  // REX MD - Complete Drug List
  // =====================
  // ED
  { competitor: 'REX_MD', external_name: 'Sildenafil 20mg', url: 'https://rexmd.com/our-medications', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 2, raw_data: { perDose: true } },
  { competitor: 'REX_MD', external_name: 'Sildenafil 50mg', url: 'https://rexmd.com/our-medications', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 6, raw_data: { perDose: true } },
  { competitor: 'REX_MD', external_name: 'Sildenafil 100mg', url: 'https://rexmd.com/our-medications', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 6, raw_data: { perDose: true } },
  { competitor: 'REX_MD', external_name: 'Tadalafil 10mg', url: 'https://rexmd.com/our-medications', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 6, raw_data: { perDose: true } },
  { competitor: 'REX_MD', external_name: 'Tadalafil 20mg', url: 'https://rexmd.com/our-medications', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 6, raw_data: { perDose: true } },
  { competitor: 'REX_MD', external_name: 'Daily Tadalafil 2.5mg', url: 'https://rexmd.com/our-medications', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 2, raw_data: { perDose: true, daily: true } },
  { competitor: 'REX_MD', external_name: 'Daily Tadalafil 5mg', url: 'https://rexmd.com/our-medications', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 2, raw_data: { perDose: true, daily: true } },
  // Testosterone
  { competitor: 'REX_MD', external_name: 'Testosterone Cypionate', url: 'https://rexmd.com/testosterone', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: 99, raw_data: { form: 'injectable', starting: true } },
  { competitor: 'REX_MD', external_name: 'Testosterone Gel', url: 'https://rexmd.com/testosterone', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: 99, raw_data: { form: 'topical', starting: true } },
  { competitor: 'REX_MD', external_name: 'Clomiphene (Clomid)', url: 'https://rexmd.com/testosterone', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'oral' } },
  { competitor: 'REX_MD', external_name: 'Sermorelin', url: 'https://rexmd.com/testosterone', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable' } },
  // Hair Loss
  { competitor: 'REX_MD', external_name: 'Finasteride 1mg', url: 'https://rexmd.com/our-medications', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: 13.5, raw_data: { priceType: 'monthly', quarterly: true } },
  // PE
  { competitor: 'REX_MD', external_name: 'Sertraline for PE', url: 'https://rexmd.com/our-medications', category: 'Premature Ejaculation', requires_prescription: true, requires_consultation: true, price: 27, raw_data: { priceType: 'monthly' } },
  // Sleep
  { competitor: 'REX_MD', external_name: 'Doxepin 10mg', url: 'https://rexmd.com/our-medications', category: 'Sleep', requires_prescription: true, requires_consultation: true, price: 1.7, raw_data: { perDose: true } },
  { competitor: 'REX_MD', external_name: 'Ramelteon 8mg', url: 'https://rexmd.com/our-medications', category: 'Sleep', requires_prescription: true, requires_consultation: true, price: 2.11, raw_data: { perDose: true } },
  // Herpes
  { competitor: 'REX_MD', external_name: 'Valacyclovir', url: 'https://rexmd.com/our-medications', category: 'Herpes', requires_prescription: true, requires_consultation: true, price: 27, raw_data: { priceType: 'monthly' } },
  // Weight Loss
  { competitor: 'REX_MD', external_name: 'Zepbound (Tirzepatide)', url: 'https://rexmd.com/our-medications', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 75, raw_data: { starting: true } },
  { competitor: 'REX_MD', external_name: 'Wegovy (Semaglutide)', url: 'https://rexmd.com/our-medications', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 75, raw_data: { starting: true } },

  // =====================
  // NURX - Birth Control (Sample of 100+)
  // =====================
  { competitor: 'NURX', external_name: 'Yaz', url: 'https://www.nurx.com/birth-control/combination-pill/yaz', category: 'Birth Control', requires_prescription: true, requires_consultation: true, price: 15, raw_data: { type: 'combination pill' } },
  { competitor: 'NURX', external_name: 'Yasmin', url: 'https://www.nurx.com/birth-control/combination-pill/yasmin', category: 'Birth Control', requires_prescription: true, requires_consultation: true, price: 15, raw_data: { type: 'combination pill' } },
  { competitor: 'NURX', external_name: 'Sprintec', url: 'https://www.nurx.com/birth-control/combination-pill/sprintec', category: 'Birth Control', requires_prescription: true, requires_consultation: true, price: 15, raw_data: { type: 'combination pill' } },
  { competitor: 'NURX', external_name: 'Lo Loestrin FE', url: 'https://www.nurx.com/birth-control/combination-pill/lo-loestrin-fe', category: 'Birth Control', requires_prescription: true, requires_consultation: true, price: 15, raw_data: { type: 'combination pill' } },
  { competitor: 'NURX', external_name: 'Tri-Sprintec', url: 'https://www.nurx.com/birth-control/combination-pill/tri-sprintec', category: 'Birth Control', requires_prescription: true, requires_consultation: true, price: 15, raw_data: { type: 'triphasic pill' } },
  { competitor: 'NURX', external_name: 'Slynd', url: 'https://www.nurx.com/birth-control', category: 'Birth Control', requires_prescription: true, requires_consultation: true, price: 15, raw_data: { type: 'progestin-only pill' } },
  { competitor: 'NURX', external_name: 'Xulane Patch', url: 'https://www.nurx.com/birth-control/categories/patch', category: 'Birth Control', requires_prescription: true, requires_consultation: true, price: null, raw_data: { type: 'patch' } },
  { competitor: 'NURX', external_name: 'NuvaRing', url: 'https://www.nurx.com/birth-control', category: 'Birth Control', requires_prescription: true, requires_consultation: true, price: null, raw_data: { type: 'ring' } },
  { competitor: 'NURX', external_name: 'Ella (Emergency)', url: 'https://www.nurx.com/emergencycontraception', category: 'Emergency Contraception', requires_prescription: true, requires_consultation: true, price: null, raw_data: { type: 'emergency contraception' } },
  // Acne
  { competitor: 'NURX', external_name: 'Tretinoin Cream 0.025%', url: 'https://www.nurx.com/acne-treatment', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'cream' } },
  { competitor: 'NURX', external_name: 'Tretinoin Cream 0.05%', url: 'https://www.nurx.com/acne-treatment', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'cream' } },
  { competitor: 'NURX', external_name: 'Spironolactone', url: 'https://www.nurx.com/acne-treatment', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'tablet', use: 'hormonal acne' } },
  { competitor: 'NURX', external_name: 'Clindamycin 1%', url: 'https://www.nurx.com/acne-treatment', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'topical' } },
  // Herpes
  { competitor: 'NURX', external_name: 'Valacyclovir', url: 'https://www.nurx.com/herpes', category: 'Herpes', requires_prescription: true, requires_consultation: true, price: 15, raw_data: { priceType: 'monthly' } },
  // PrEP
  { competitor: 'NURX', external_name: 'PrEP (Emtricitabine/Tenofovir)', url: 'https://www.nurx.com', category: 'HIV Prevention', requires_prescription: true, requires_consultation: true, price: null, raw_data: { genericFor: 'Truvada' } },

  // =====================
  // WISP - Complete Drug List
  // =====================
  // UTI
  { competitor: 'WISP', external_name: 'Nitrofurantoin (Macrobid)', url: 'https://hellowisp.com/products/uti-antibiotics', category: 'UTI', requires_prescription: true, requires_consultation: true, price: 59, raw_data: {} },
  { competitor: 'WISP', external_name: 'Trimethoprim-Sulfamethoxazole (Bactrim)', url: 'https://hellowisp.com/products/uti-antibiotics', category: 'UTI', requires_prescription: true, requires_consultation: true, price: 59, raw_data: {} },
  // BV
  { competitor: 'WISP', external_name: 'Metronidazole Gel', url: 'https://hellowisp.com/products/bv-antibiotics', category: 'Bacterial Vaginosis', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'gel' } },
  { competitor: 'WISP', external_name: 'Clindamycin Cream', url: 'https://hellowisp.com/products/clindamycin-cream', category: 'Bacterial Vaginosis', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'cream' } },
  // Yeast
  { competitor: 'WISP', external_name: 'Fluconazole (Diflucan)', url: 'https://hellowisp.com/products/yeast-antifungals', category: 'Yeast Infection', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'oral' } },
  // Herpes
  { competitor: 'WISP', external_name: 'Valacyclovir', url: 'https://hellowisp.com/products/valacyclovir-and-acyclovir', category: 'Herpes', requires_prescription: true, requires_consultation: true, price: null, raw_data: {} },
  { competitor: 'WISP', external_name: 'Acyclovir', url: 'https://hellowisp.com/products/valacyclovir-and-acyclovir', category: 'Herpes', requires_prescription: true, requires_consultation: true, price: null, raw_data: {} },
  // Emergency Contraception
  { competitor: 'WISP', external_name: 'Plan B (Levonorgestrel)', url: 'https://hellowisp.com/products/plan-b', category: 'Emergency Contraception', requires_prescription: false, requires_consultation: false, price: 12.5, raw_data: { otc: true } },
  { competitor: 'WISP', external_name: 'Ella (Ulipristal)', url: 'https://hellowisp.com/products/ella', category: 'Emergency Contraception', requires_prescription: true, requires_consultation: true, price: 44, raw_data: {} },

  // =====================
  // EVERNOW - Complete Drug List
  // =====================
  // HRT
  { competitor: 'EVERNOW', external_name: 'Estradiol Patch', url: 'https://www.evernow.com/prescription/hormone-therapy/estradiol-patch', category: 'Menopause', requires_prescription: true, requires_consultation: true, price: 149, raw_data: { form: 'transdermal', priceType: 'monthly' } },
  { competitor: 'EVERNOW', external_name: 'Estradiol Pill', url: 'https://www.evernow.com/prescription/hormone-therapy/estradiol-pill', category: 'Menopause', requires_prescription: true, requires_consultation: true, price: 149, raw_data: { form: 'oral', priceType: 'monthly' } },
  { competitor: 'EVERNOW', external_name: 'Progesterone', url: 'https://www.evernow.com/prescription/hormone-therapy/progesterone', category: 'Menopause', requires_prescription: true, requires_consultation: true, price: 149, raw_data: { form: 'oral', priceType: 'monthly' } },
  { competitor: 'EVERNOW', external_name: 'Vaginal Estrogen Cream', url: 'https://www.evernow.com/prescription/hormone-therapy', category: 'Menopause', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'topical' } },
  { competitor: 'EVERNOW', external_name: 'Veozah (Fezolinetant)', url: 'https://www.evernow.com/prescription', category: 'Menopause', requires_prescription: true, requires_consultation: true, price: null, raw_data: { nonHormonal: true, use: 'hot flashes' } },
  // Hair Loss
  { competitor: 'EVERNOW', external_name: 'Oral Minoxidil', url: 'https://www.evernow.com/prescription/hair-loss', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'oral' } },
  { competitor: 'EVERNOW', external_name: 'Topical Finasteride + Minoxidil', url: 'https://www.evernow.com/prescription/hair-loss', category: 'Hair Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'topical' } },
  // Anti-Aging
  { competitor: 'EVERNOW', external_name: 'Tretinoin Face Cream', url: 'https://www.evernow.com/prescription/anti-aging', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'cream' } },
  // Sexual Health
  { competitor: 'EVERNOW', external_name: 'Sildenafil Arousal Cream', url: 'https://www.evernow.com/prescription/sexual-health', category: 'Sexual Wellness', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'topical', compounded: true } },
  { competitor: 'EVERNOW', external_name: 'Addyi (Flibanserin)', url: 'https://www.evernow.com/prescription/sexual-health', category: 'Sexual Wellness', requires_prescription: true, requires_consultation: true, price: null, raw_data: { use: 'HSDD' } },
  // Weight Loss
  { competitor: 'EVERNOW', external_name: 'Wegovy (Semaglutide)', url: 'https://www.evernow.com/prescription/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable' } },
  { competitor: 'EVERNOW', external_name: 'Zepbound (Tirzepatide)', url: 'https://www.evernow.com/prescription/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable' } },
  { competitor: 'EVERNOW', external_name: 'Compounded Semaglutide', url: 'https://www.evernow.com/prescription/weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', compounded: true } },

  // =====================
  // CUROLOGY - Complete Drug List
  // =====================
  { competitor: 'CUROLOGY', external_name: 'Custom Acne Formula (Tretinoin)', url: 'https://curology.com/products/custom-formula-acne', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: 30, raw_data: { form: 'cream', customized: true, priceType: 'monthly' } },
  { competitor: 'CUROLOGY', external_name: 'Custom Anti-Aging Formula', url: 'https://curology.com/products/future-proof-anti-aging', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: 30, raw_data: { form: 'cream', customized: true, priceType: 'monthly' } },
  { competitor: 'CUROLOGY', external_name: 'Tretinoin 0.025%', url: 'https://curology.com/ingredients/tretinoin', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { ingredient: true } },
  { competitor: 'CUROLOGY', external_name: 'Tretinoin 0.05%', url: 'https://curology.com/ingredients/tretinoin', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { ingredient: true } },
  { competitor: 'CUROLOGY', external_name: 'Clindamycin 1%', url: 'https://curology.com/ingredients', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { ingredient: true } },
  { competitor: 'CUROLOGY', external_name: 'Azelaic Acid', url: 'https://curology.com/ingredients', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { ingredient: true } },
  { competitor: 'CUROLOGY', external_name: 'Niacinamide 4%', url: 'https://curology.com/ingredients', category: 'Skincare', requires_prescription: true, requires_consultation: true, price: null, raw_data: { ingredient: true } },

  // =====================
  // Weight Loss Specialists
  // =====================
  // HENRY MEDS
  { competitor: 'HENRY_MEDS', external_name: 'Compounded Semaglutide Injectable', url: 'https://henrymeds.com/semaglutide', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 297, raw_data: { form: 'injectable', compounded: true, priceType: 'monthly' } },
  { competitor: 'HENRY_MEDS', external_name: 'Compounded Semaglutide Oral', url: 'https://henrymeds.com/semaglutide-oral', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'oral dissolvable', compounded: true } },
  { competitor: 'HENRY_MEDS', external_name: 'Compounded Tirzepatide Tablets', url: 'https://henrymeds.com/tirzepatide-tablets', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 299, raw_data: { form: 'oral', compounded: true, priceType: 'monthly' } },
  { competitor: 'HENRY_MEDS', external_name: 'Phentermine 37.5mg', url: 'https://henrymeds.com/weight-management', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 149, raw_data: { form: 'oral', priceType: 'monthly' } },

  // MOCHI HEALTH
  { competitor: 'MOCHI_HEALTH', external_name: 'Compounded Semaglutide (All Doses)', url: 'https://joinmochi.com/medications', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 99, raw_data: { form: 'injectable', flatRate: true, priceType: 'monthly' } },
  { competitor: 'MOCHI_HEALTH', external_name: 'Compounded Tirzepatide (All Doses)', url: 'https://joinmochi.com/medications', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 199, raw_data: { form: 'injectable', flatRate: true, priceType: 'monthly' } },
  { competitor: 'MOCHI_HEALTH', external_name: 'Compounded Oral Semaglutide', url: 'https://joinmochi.com/compounded-semaglutide-oral', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 99, raw_data: { form: 'oral', compounded: true, priceType: 'monthly' } },
  { competitor: 'MOCHI_HEALTH', external_name: 'Metformin', url: 'https://joinmochi.com/medications', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'oral' } },

  // CALIBRATE
  { competitor: 'CALIBRATE', external_name: 'Wegovy (Semaglutide)', url: 'https://www.joincalibrate.com/medications/wegovy', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: 25, raw_data: { form: 'injectable', brand: true, priceNote: 'with insurance after deductible' } },
  { competitor: 'CALIBRATE', external_name: 'Ozempic (Semaglutide)', url: 'https://www.joincalibrate.com/medications/ozempic', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', brand: true } },
  { competitor: 'CALIBRATE', external_name: 'Mounjaro (Tirzepatide)', url: 'https://www.joincalibrate.com/medications/mounjaro-tirzepatide-weight-loss', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', brand: true } },
  { competitor: 'CALIBRATE', external_name: 'Zepbound (Tirzepatide)', url: 'https://www.joincalibrate.com/medication', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', brand: true } },
  { competitor: 'CALIBRATE', external_name: 'Saxenda (Liraglutide)', url: 'https://www.joincalibrate.com/medication', category: 'Weight Loss', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable', brand: true } },

  // =====================
  // TRT & Hormone Specialists
  // =====================
  // HONE HEALTH
  { competitor: 'HONE_HEALTH', external_name: 'Testosterone Cypionate 200mg/mL', url: 'https://honehealth.com/mens/buy-testosterone', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: 28, raw_data: { form: 'injectable', priceType: 'monthly' } },
  { competitor: 'HONE_HEALTH', external_name: 'Testosterone Cream', url: 'https://honehealth.com/mens/testosterone-replacement-therapy', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: 60, raw_data: { form: 'topical', priceType: 'monthly' } },
  { competitor: 'HONE_HEALTH', external_name: 'Enclomiphene 12.5mg', url: 'https://honehealth.com/mens/enclomiphene', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: 42, raw_data: { form: 'oral', priceType: 'monthly' } },
  { competitor: 'HONE_HEALTH', external_name: 'Enclomiphene 25mg', url: 'https://honehealth.com/mens/enclomiphene', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: 42, raw_data: { form: 'oral', priceType: 'monthly' } },
  { competitor: 'HONE_HEALTH', external_name: 'Anastrozole', url: 'https://honehealth.com/mens/testosterone-replacement-therapy', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: 22, raw_data: { form: 'oral', use: 'estrogen blocker', priceType: 'monthly' } },
  { competitor: 'HONE_HEALTH', external_name: 'Sildenafil', url: 'https://honehealth.com/mens/sildenafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 25, raw_data: { priceType: 'monthly' } },
  { competitor: 'HONE_HEALTH', external_name: 'Tadalafil', url: 'https://honehealth.com/mens/tadalafil', category: 'Erectile Dysfunction', requires_prescription: true, requires_consultation: true, price: 30, raw_data: { priceType: 'monthly' } },

  // TRT NATION
  { competitor: 'TRT_NATION', external_name: 'TRT Program (Testosterone Cypionate)', url: 'https://trtnation.com/testosterone-replacement-therapy', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: 99, raw_data: { form: 'injectable', allInclusive: true, priceType: 'monthly' } },
  { competitor: 'TRT_NATION', external_name: 'HCG Therapy', url: 'https://trtnation.com/hcg-therapy', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: null, raw_data: { addOn: true } },
  { competitor: 'TRT_NATION', external_name: 'Enclomiphene', url: 'https://trtnation.com/testosterone-replacement-therapy', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: null, raw_data: { addOn: true } },
  { competitor: 'TRT_NATION', external_name: 'Anastrozole', url: 'https://trtnation.com/testosterone-replacement-therapy', category: 'Hormone Therapy', requires_prescription: true, requires_consultation: true, price: null, raw_data: { addOn: true } },
  { competitor: 'TRT_NATION', external_name: 'BPC-157', url: 'https://trtnation.com/bpc-157', category: 'Peptides', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable' } },
  { competitor: 'TRT_NATION', external_name: 'Tesamorelin', url: 'https://trtnation.com/tesamorelin-therapy', category: 'Peptides', requires_prescription: true, requires_consultation: true, price: null, raw_data: { form: 'injectable' } },
];

const seedCompetitorDrugs = async () => {
  console.log('Seeding comprehensive competitor drug data...\n');

  try {
    const existingResult = await pool.query('SELECT COUNT(*) FROM competitor_drugs');
    console.log(`Existing entries before seeding: ${existingResult.rows[0].count}`);

    let inserted = 0;
    let skipped = 0;

    for (const drug of competitorDrugs) {
      const existsResult = await pool.query(
        'SELECT id FROM competitor_drugs WHERE competitor = $1 AND external_name = $2',
        [drug.competitor, drug.external_name]
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
          drug.competitor,
          null,
          drug.external_name,
          drug.url,
          drug.price,
          drug.category,
          drug.requires_prescription,
          drug.requires_consultation,
          JSON.stringify(drug.raw_data),
          new Date(),
        ]
      );
      inserted++;
    }

    console.log(`\nSeeding complete:`);
    console.log(`  - Inserted: ${inserted} new entries`);
    console.log(`  - Skipped: ${skipped} existing entries`);

    // Show summary by competitor
    const summary = await pool.query(`
      SELECT competitor, COUNT(*) as drug_count
      FROM competitor_drugs
      GROUP BY competitor
      ORDER BY drug_count DESC
    `);

    console.log(`\nDrugs by competitor:`);
    for (const row of summary.rows) {
      console.log(`  ${row.competitor}: ${row.drug_count} drugs`);
    }

    // Show summary by category
    const categories = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM competitor_drugs
      GROUP BY category
      ORDER BY count DESC
    `);

    console.log(`\nDrugs by category:`);
    for (const row of categories.rows) {
      console.log(`  ${row.category}: ${row.count}`);
    }

  } catch (error) {
    console.error('Error seeding:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

seedCompetitorDrugs();
