import puppeteer from 'puppeteer';

const debugKeeps = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://www.keeps.com',
    'https://www.keeps.com/treatments',
    'https://www.keeps.com/learn/finasteride',
    'https://www.keeps.com/learn/minoxidil',
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
          .slice(0, 40);

        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent?.trim().slice(0, 80))
          .filter(h => h && h.length > 2)
          .slice(0, 25);

        const bodyText = document.body?.innerText || '';
        const priceMatches = bodyText.match(/\$\d+(?:\.\d{2})?/g) || [];
        
        const drugKeywords = [
          'finasteride', 'minoxidil', 'ketoconazole', 'biotin', 'saw palmetto',
          'dutasteride', 'propecia', 'rogaine'
        ];
        const foundDrugs = drugKeywords.filter(d => bodyText.toLowerCase().includes(d));

        return { 
          links: links.filter(l => 
            l.href?.includes('/treatment') || 
            l.href?.includes('/product') || 
            l.href?.includes('/learn') ||
            l.href?.includes('finasteride') ||
            l.href?.includes('minoxidil')
          ), 
          headings, 
          priceMatches: [...new Set(priceMatches)].slice(0, 15), 
          foundDrugs 
        };
      });

      console.log('\nRelevant Links:', JSON.stringify(data.links, null, 2));
      console.log('\nHeadings:', data.headings);
      console.log('\nPrices found:', data.priceMatches);
      console.log('\nDrug Keywords Found:', data.foundDrugs);

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugKeeps();
