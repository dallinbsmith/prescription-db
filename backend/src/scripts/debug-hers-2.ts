import puppeteer from 'puppeteer';

const debugHers2 = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://www.forhers.com/skin-care',
    'https://www.forhers.com/skin-care/anti-aging',
    'https://www.forhers.com/hair-loss/latisse',
    'https://www.forhers.com/hair-loss/oral-minoxidil',
  ];

  for (const url of urls) {
    console.log(`\n${'='.repeat(60)}\n=== ${url} ===\n${'='.repeat(60)}`);
    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      console.log(`Status: ${response?.status()}`);
      console.log(`Title: ${await page.title()}`);

      const data = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
          .map(h => h.textContent?.trim().slice(0, 80))
          .filter(h => h && h.length > 2)
          .slice(0, 20);

        const bodyText = document.body?.innerText || '';
        const priceMatches = bodyText.match(/\$\d+(?:\.\d{2})?/g) || [];
        
        const drugKeywords = [
          'tretinoin', 'niacinamide', 'hyaluronic', 'retinol', 'vitamin c',
          'minoxidil', 'spironolactone', 'finasteride', 'latisse', 'bimatoprost',
          'hydroquinone', 'azelaic acid', 'clindamycin'
        ];
        const foundDrugs = drugKeywords.filter(d => bodyText.toLowerCase().includes(d));

        return { headings, priceMatches: [...new Set(priceMatches)].slice(0, 10), foundDrugs };
      });

      console.log('Headings:', data.headings);
      console.log('Prices found:', data.priceMatches);
      console.log('Drug Keywords Found:', data.foundDrugs);

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugHers2();
