import puppeteer from 'puppeteer';

const debugTwentyeightHealth = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://www.twentyeighthealth.com',
    'https://www.twentyeighthealth.com/birth-control',
    'https://www.twentyeighthealth.com/acne',
    'https://www.twentyeighthealth.com/uti',
    'https://www.twentyeighthealth.com/herpes',
    'https://www.twentyeighthealth.com/pricing',
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
          .slice(0, 30);

        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent?.trim().slice(0, 80))
          .filter(h => h && h.length > 2)
          .slice(0, 20);

        const cards = Array.from(document.querySelectorAll('[class*="product"], [class*="card"], [class*="treatment"], [class*="medication"], [class*="pill"], [class*="option"]'))
          .map(c => {
            const name = c.querySelector('h2, h3, h4, p, [class*="title"], [class*="name"]')?.textContent?.trim().slice(0, 60);
            const price = c.textContent?.match(/\$[\d.]+/)?.[0];
            const link = c.querySelector('a')?.getAttribute('href');
            return { name, price, link };
          })
          .filter(c => c.name && c.name.length > 2)
          .slice(0, 20);

        const bodyText = document.body?.innerText?.toLowerCase() || '';
        const drugKeywords = [
          'spironolactone', 'tretinoin', 'doxycycline', 'valacyclovir', 'acyclovir',
          'yaz', 'nuvaring', 'xulane', 'lo loestrin', 'ortho tri-cyclen',
          'nitrofurantoin', 'trimethoprim', 'azithromycin',
          'norethindrone', 'levonorgestrel', 'desogestrel', 'drospirenone',
          'plan b', 'ella', 'emergency contraception'
        ];
        const foundDrugs = drugKeywords.filter(d => bodyText.includes(d));

        return { links, headings, cards, foundDrugs };
      });

      console.log('\nLinks (filtered):', JSON.stringify(data.links.filter(l => 
        l.href?.includes('birth-control') || 
        l.href?.includes('acne') || 
        l.href?.includes('uti') ||
        l.href?.includes('herpes') ||
        l.href?.includes('emergency') ||
        l.href?.includes('treatment')
      ), null, 2));
      console.log('\nHeadings:', data.headings);
      console.log('\nProduct Cards:', JSON.stringify(data.cards, null, 2));
      console.log('\nDrug Keywords Found:', data.foundDrugs);

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugTwentyeightHealth();
