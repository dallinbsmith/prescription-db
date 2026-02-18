import puppeteer from 'puppeteer';

const debugWisp2 = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://www.hellowisp.com/shop/vaginal-health/uti',
    'https://www.hellowisp.com/shop/vaginal-health/yeast-infection',
    'https://www.hellowisp.com/shop/vaginal-health/bacterial-vaginosis',
    'https://www.hellowisp.com/shop/herpes',
    'https://www.hellowisp.com/shop/reproductive-health/birth-control',
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
          .slice(0, 25);

        const bodyText = document.body?.innerText || '';
        const priceMatches = bodyText.match(/\$\d+(?:\.\d{2})?/g) || [];
        
        const drugKeywords = [
          'fluconazole', 'metronidazole', 'clindamycin', 'nitrofurantoin', 'macrobid',
          'valacyclovir', 'acyclovir', 'azithromycin', 'doxycycline', 'diflucan',
          'boric acid', 'estradiol', 'norethindrone', 'levonorgestrel', 'plan b',
          'trimethoprim', 'sulfamethoxazole', 'tinidazole', 'secnidazole'
        ];
        const foundDrugs = drugKeywords.filter(d => bodyText.toLowerCase().includes(d));

        const productCards = Array.from(document.querySelectorAll('[class*="product"], [class*="card"], [data-testid*="product"]'))
          .map(c => {
            const name = c.querySelector('h2, h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim().slice(0, 60);
            const price = c.textContent?.match(/\$\d+(?:\.\d{2})?/)?.[0];
            return { name, price };
          })
          .filter(c => c.name)
          .slice(0, 15);

        return { headings, priceMatches: [...new Set(priceMatches)].slice(0, 15), foundDrugs, productCards };
      });

      console.log('Headings:', data.headings);
      console.log('Prices found:', data.priceMatches);
      console.log('Drug Keywords Found:', data.foundDrugs);
      console.log('Product Cards:', JSON.stringify(data.productCards, null, 2));

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugWisp2();
