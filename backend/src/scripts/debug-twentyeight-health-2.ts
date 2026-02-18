import puppeteer from 'puppeteer';

const debugTwentyeightHealth2 = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://www.twentyeighthealth.com/birth-control/the-patch',
    'https://www.twentyeighthealth.com/birth-control/the-ring',
    'https://www.twentyeighthealth.com/birth-control/the-shot',
    'https://www.twentyeighthealth.com/herpes-treatment',
    'https://www.twentyeighthealth.com/emergency-contraception',
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
          'xulane', 'nuvaring', 'annovera', 'depo-provera', 'depo provera',
          'valacyclovir', 'acyclovir', 'famciclovir',
          'plan b', 'ella', 'levonorgestrel',
          'yaz', 'yasmin', 'lo loestrin', 'ortho', 'sprintec', 'tri-sprintec',
          'junel', 'microgestin', 'chateal', 'aubra', 'aviane', 'levlen',
          'norethindrone', 'norgestimate', 'drospirenone', 'desogestrel'
        ];
        const foundDrugs = drugKeywords.filter(d => bodyText.toLowerCase().includes(d));

        return { headings, priceMatches: [...new Set(priceMatches)], foundDrugs };
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

debugTwentyeightHealth2();
