import puppeteer from 'puppeteer';

const debugCostPlus = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://costplusdrugs.com',
    'https://costplusdrugs.com/medications/',
    'https://costplusdrugs.com/medications/?category=erectile-dysfunction',
    'https://costplusdrugs.com/medications/?category=hair-loss',
  ];

  for (const url of urls) {
    console.log(`\n${'='.repeat(60)}\n=== ${url} ===\n${'='.repeat(60)}`);
    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      console.log(`Status: ${response?.status()}`);
      console.log(`Final URL: ${page.url()}`);
      console.log(`Title: ${await page.title()}`);

      const data = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
          .map(a => ({
            text: a.textContent?.trim().slice(0, 60),
            href: a.getAttribute('href')
          }))
          .filter(l => l.text && l.href && l.text.length > 2)
          .slice(0, 50);

        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent?.trim().slice(0, 80))
          .filter(h => h && h.length > 2)
          .slice(0, 25);

        const bodyText = document.body?.innerText || '';
        const priceMatches = bodyText.match(/\$\d+(?:\.\d{2})?/g) || [];

        // Look for medication cards/items
        const medications = Array.from(document.querySelectorAll('[class*="medication"], [class*="product"], [class*="drug"], [class*="card"]'))
          .map(el => {
            const name = el.querySelector('h2, h3, h4, [class*="name"], [class*="title"]')?.textContent?.trim();
            const price = el.textContent?.match(/\$[\d.]+/)?.[0];
            return { name, price };
          })
          .filter(m => m.name && m.name.length > 2)
          .slice(0, 20);

        return { 
          links: links.filter(l => l.href?.includes('/medications')).slice(0, 30),
          headings, 
          priceMatches: [...new Set(priceMatches)].slice(0, 20),
          medications
        };
      });

      console.log('\nMedication Links:', JSON.stringify(data.links.slice(0, 15), null, 2));
      console.log('\nHeadings:', data.headings);
      console.log('\nPrices found:', data.priceMatches);
      console.log('\nMedication Cards:', JSON.stringify(data.medications, null, 2));

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugCostPlus();
