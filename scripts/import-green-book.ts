import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prescription_db',
});

const DATA_DIR = path.join(__dirname, '../data');

interface GreenBookEntry {
  applicationNumber: string;
  productName: string;
  activeIngredients: string;
  dosageForm: string;
  route: string;
  sponsor: string;
  approvalDate: string;
  species: string;
}

const parseGreenBookCsv = (content: string): GreenBookEntry[] => {
  const lines = content.split('\n');
  const entries: GreenBookEntry[] = [];

  let isHeader = true;
  for (const line of lines) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    const fields = line.split(',').map(f => f.replace(/^"|"$/g, '').trim());
    if (fields.length < 7) continue;

    entries.push({
      applicationNumber: fields[0],
      productName: fields[1],
      activeIngredients: fields[2],
      dosageForm: fields[3],
      route: fields[4],
      sponsor: fields[5],
      approvalDate: fields[6],
      species: fields[7] || 'ANIMAL',
    });
  }

  return entries;
};

const importGreenBook = async () => {
  console.log('Importing Green Book (Animal Drugs)...');

  const greenBookFile = path.join(DATA_DIR, 'green_book.csv');

  if (!fs.existsSync(greenBookFile)) {
    console.log('green_book.csv not found.');
    console.log('Please download the Green Book Excel file from FDA and convert to CSV:');
    console.log('https://www.fda.gov/animal-veterinary/products/approved-animal-drug-products-green-book');
    console.log('Save as data/green_book.csv');
    return;
  }

  const content = fs.readFileSync(greenBookFile, 'utf-8');
  const entries = parseGreenBookCsv(content);

  const client = await pool.connect();

  try {
    let count = 0;

    for (const entry of entries) {
      const id = uuid();

      const activeIngredients = entry.activeIngredients.split(';').map(name => ({
        name: name.trim(),
        strength: '',
        unit: '',
      }));

      await client.query(`
        INSERT INTO drugs (
          id, ndc, name, generic_name, dosage_form, route,
          manufacturer, rx_otc, species, active_ingredients,
          fda_application_number, source, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (ndc) DO UPDATE SET
          name = EXCLUDED.name,
          dosage_form = EXCLUDED.dosage_form,
          route = EXCLUDED.route,
          manufacturer = EXCLUDED.manufacturer,
          active_ingredients = EXCLUDED.active_ingredients,
          fda_application_number = EXCLUDED.fda_application_number,
          raw_data = EXCLUDED.raw_data,
          updated_at = NOW()
      `, [
        id,
        `GB-${entry.applicationNumber}`,
        entry.productName,
        entry.activeIngredients,
        entry.dosageForm,
        entry.route,
        entry.sponsor,
        'RX',
        'ANIMAL',
        JSON.stringify(activeIngredients),
        entry.applicationNumber,
        'GREEN_BOOK',
        JSON.stringify(entry),
      ]);

      count++;
      if (count % 100 === 0) {
        console.log(`Imported ${count} animal drugs...`);
      }
    }

    console.log(`Green Book import complete. Total: ${count} animal drugs`);
  } finally {
    client.release();
    await pool.end();
  }
};

importGreenBook().catch(console.error);
