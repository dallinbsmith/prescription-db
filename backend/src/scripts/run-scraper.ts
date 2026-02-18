import { runScraper } from '../scrapers/index.js';

const competitor = process.argv[2] || 'FRIDAYS';

console.log(`Running scraper for: ${competitor}`);

runScraper(competitor)
  .then(result => {
    console.log('\nResult:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
