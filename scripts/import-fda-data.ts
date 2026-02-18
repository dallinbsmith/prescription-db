import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { createWriteStream, createReadStream } from 'fs';
import { createInterface } from 'readline';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prescription_db',
});

const DATA_DIR = path.join(__dirname, '../data');
const NDC_URL = 'https://www.accessdata.fda.gov/cder/ndctext.zip';
const GREEN_BOOK_URL = 'https://www.fda.gov/media/76857/download';

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const downloadFile = (url: string, dest: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const parseNdcLine = (line: string): Record<string, string> | null => {
  const fields = line.split('\t');
  if (fields.length < 10) return null;

  return {
    productId: fields[0],
    productNdc: fields[1],
    productTypeName: fields[2],
    proprietaryName: fields[3],
    proprietaryNameSuffix: fields[4],
    nonproprietaryName: fields[5],
    dosageFormName: fields[6],
    routeName: fields[7],
    startMarketingDate: fields[8],
    endMarketingDate: fields[9],
    marketingCategoryName: fields[10] || '',
    applicationNumber: fields[11] || '',
    labelerName: fields[12] || '',
    substanceName: fields[13] || '',
    activeNumeratorStrength: fields[14] || '',
    activeIngredUnit: fields[15] || '',
    pharmClasses: fields[16] || '',
    deaSchedule: fields[17] || '',
    ndcExcludeFlag: fields[18] || '',
    listingRecordCertifiedThrough: fields[19] || '',
  };
};

const mapRxOtc = (productTypeName: string): 'RX' | 'OTC' | 'BOTH' => {
  const lower = productTypeName.toLowerCase();
  if (lower.includes('otc') && lower.includes('prescription')) return 'BOTH';
  if (lower.includes('otc')) return 'OTC';
  return 'RX';
};

const mapDeaSchedule = (schedule: string): 'I' | 'II' | 'III' | 'IV' | 'V' | null => {
  const match = schedule.match(/C(I{1,3}|IV|V)/);
  if (!match) return null;
  const roman = match[1];
  if (roman === 'I') return 'I';
  if (roman === 'II') return 'II';
  if (roman === 'III') return 'III';
  if (roman === 'IV') return 'IV';
  if (roman === 'V') return 'V';
  return null;
};

const parseActiveIngredients = (substanceName: string, strength: string, unit: string): object[] => {
  const substances = substanceName.split(';').map(s => s.trim()).filter(Boolean);
  const strengths = strength.split(';').map(s => s.trim());
  const units = unit.split(';').map(s => s.trim());

  return substances.map((name, i) => ({
    name,
    strength: strengths[i] || '',
    unit: units[i] || '',
  }));
};

const importNdcDirectory = async () => {
  console.log('Importing NDC Directory...');

  const productFile = path.join(DATA_DIR, 'product.txt');

  if (!fs.existsSync(productFile)) {
    console.log('product.txt not found. Please download and extract NDC files to data/');
    console.log(`Download from: ${NDC_URL}`);
    console.log('Extract product.txt and package.txt to the data/ directory');
    return;
  }

  const client = await pool.connect();

  try {
    const fileStream = createReadStream(productFile);
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

    let isHeader = true;
    let count = 0;
    let batch: string[][] = [];
    const batchSize = 500;

    for await (const line of rl) {
      if (isHeader) {
        isHeader = false;
        continue;
      }

      const data = parseNdcLine(line);
      if (!data || data.ndcExcludeFlag === 'Y') continue;

      const activeIngredients = parseActiveIngredients(
        data.substanceName,
        data.activeNumeratorStrength,
        data.activeIngredUnit
      );

      batch.push([
        uuid(),
        data.productNdc,
        data.proprietaryName || data.nonproprietaryName,
        data.nonproprietaryName,
        data.dosageFormName,
        data.activeNumeratorStrength,
        data.routeName,
        data.labelerName,
        mapRxOtc(data.productTypeName),
        mapDeaSchedule(data.deaSchedule),
        'HUMAN',
        JSON.stringify(activeIngredients),
        data.applicationNumber,
        data.marketingCategoryName,
        'NDC_DIRECTORY',
        JSON.stringify(data),
      ]);

      if (batch.length >= batchSize) {
        await insertBatch(client, batch);
        count += batch.length;
        console.log(`Imported ${count} drugs...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatch(client, batch);
      count += batch.length;
    }

    console.log(`NDC Directory import complete. Total: ${count} drugs`);
  } finally {
    client.release();
  }
};

const insertBatch = async (client: ReturnType<typeof pool.connect> extends Promise<infer C> ? C : never, batch: string[][]) => {
  const values: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const row of batch) {
    const placeholders = row.map(() => `$${paramIndex++}`).join(', ');
    values.push(`(${placeholders})`);
    params.push(...row);
  }

  await client.query(`
    INSERT INTO drugs (
      id, ndc, name, generic_name, dosage_form, strength, route,
      manufacturer, rx_otc, dea_schedule, species, active_ingredients,
      fda_application_number, marketing_status, source, raw_data
    ) VALUES ${values.join(', ')}
    ON CONFLICT (ndc) DO UPDATE SET
      name = EXCLUDED.name,
      generic_name = EXCLUDED.generic_name,
      dosage_form = EXCLUDED.dosage_form,
      strength = EXCLUDED.strength,
      route = EXCLUDED.route,
      manufacturer = EXCLUDED.manufacturer,
      rx_otc = EXCLUDED.rx_otc,
      dea_schedule = EXCLUDED.dea_schedule,
      active_ingredients = EXCLUDED.active_ingredients,
      fda_application_number = EXCLUDED.fda_application_number,
      marketing_status = EXCLUDED.marketing_status,
      raw_data = EXCLUDED.raw_data,
      updated_at = NOW()
  `, params);
};

const main = async () => {
  ensureDataDir();

  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  try {
    switch (command) {
      case 'ndc':
        await importNdcDirectory();
        break;
      case 'download':
        console.log('Downloading FDA NDC Directory...');
        await downloadFile(NDC_URL, path.join(DATA_DIR, 'ndctext.zip'));
        console.log('Downloaded. Please extract the zip file manually.');
        break;
      case 'all':
      default:
        await importNdcDirectory();
    }
  } finally {
    await pool.end();
  }
};

main().catch(console.error);
