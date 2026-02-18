import fs from 'fs';
import path from 'path';

const name = process.argv[2];

if (!name) {
  console.error('Usage: npm run migrate:create <migration-name>');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const filename = `${timestamp}_${name}.sql`;
const filepath = path.join(__dirname, 'migrations', filename);

fs.writeFileSync(filepath, `-- Migration: ${name}\n-- Created: ${new Date().toISOString()}\n\n`);
console.log(`Created migration: ${filename}`);
