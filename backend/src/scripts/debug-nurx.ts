import puppeteer from 'puppeteer';

const debugNurx = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://www.nurx.com',
    'https://www.nurx.com/birthcontrol/',
    'https://www.nurx.com/sti/',
    'https://www.nurx.com/skin/',
    'https://www.nurx.com/migraine/',
    'https://www.nurx.com/menopause/',
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
          .filter(l => l.text && l.href && (
            l.href.includes('/birthcontrol') ||
            l.href.includes('/sti') ||
            l.href.includes('/skin') ||
            l.href.includes('/migraine') ||
            l.href.includes('/herpes') ||
            l.href.includes('/genital') ||
            l.href.includes('/acne') ||
            l.href.includes('/treatment') ||
            l.href.includes('/menopause')
          ))
          .slice(0, 30);

        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent?.trim().slice(0, 80))
          .filter(h => h && h.length > 2)
          .slice(0, 20);

        const cards = Array.from(document.querySelectorAll('[class*="product"], [class*="card"], [class*="treatment"], [class*="medication"]'))
          .map(c => {
            const name = c.querySelector('h2, h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim().slice(0, 60);
            const price = c.textContent?.match(/\$[\d.]+/)?.[0];
            return { name, price };
          })
          .filter(c => c.name)
          .slice(0, 20);

        const bodyText = document.body?.innerText?.toLowerCase() || '';
        const drugKeywords = [
          'spironolactone', 'tretinoin', 'doxycycline', 'valacyclovir', 'acyclovir',
          'sumatriptan', 'rizatriptan', 'nurtec', 'ubrelvy', 'qulipta',
          'yaz', 'nuvaring', 'xulane', 'lo loestrin', 'sprintec',
          'estradiol', 'progesterone', 'estriol'
        ];
        const foundDrugs = drugKeywords.filter(d => bodyText.includes(d));

        return { links, headings, cards, foundDrugs };
      });

      console.log('\nRelevant Links:', JSON.stringify(data.links, null, 2));
      console.log('\nHeadings:', data.headings);
      console.log('\nProduct Cards:', JSON.stringify(data.cards, null, 2));
      console.log('\nDrug Keywords Found:', data.foundDrugs);

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugNurx();
