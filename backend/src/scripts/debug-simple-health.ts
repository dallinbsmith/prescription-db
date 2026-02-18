import puppeteer from 'puppeteer';

const debugSimpleHealth = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://www.simplehealth.com',
    'https://www.simplehealth.com/birth-control',
    'https://www.simplehealth.com/acne',
    'https://www.simplehealth.com/uti',
    'https://www.simplehealth.com/herpes',
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
        const medLinks = Array.from(document.querySelectorAll('a'))
          .map(a => ({
            text: a.textContent?.trim().slice(0, 60),
            href: a.getAttribute('href')
          }))
          .filter(l => l.text && l.href && (
            l.href.includes('birth-control') ||
            l.href.includes('medication') ||
            l.href.includes('treatment') ||
            l.href.includes('acne') ||
            l.href.includes('uti') ||
            l.href.includes('herpes')
          ))
          .slice(0, 25);

        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent?.trim().slice(0, 60))
          .filter(h => h && h.length > 2)
          .slice(0, 15);

        const cards = Array.from(document.querySelectorAll('[class*="product"], [class*="card"], [class*="treatment"], [class*="medication"]'))
          .map(c => {
            const name = c.querySelector('h2, h3, h4, [class*="title"], [class*="name"]')?.textContent?.trim();
            const price = c.textContent?.match(/\$[\d.]+/)?.[0];
            const link = c.querySelector('a')?.getAttribute('href');
            return { name, price, link };
          })
          .filter(c => c.name)
          .slice(0, 15);

        const bodyText = document.body?.innerText?.toLowerCase() || '';
        const drugKeywords = ['spironolactone', 'tretinoin', 'doxycycline', 'valacyclovir', 'yaz', 'nuvaring', 'xulane', 'lo loestrin'];
        const foundDrugs = drugKeywords.filter(d => bodyText.includes(d));

        return { medLinks, headings, cards, foundDrugs };
      });

      console.log('\nMedication Links:', JSON.stringify(data.medLinks, null, 2));
      console.log('\nHeadings:', data.headings);
      console.log('\nProduct Cards:', JSON.stringify(data.cards, null, 2));
      console.log('\nDrug Keywords Found:', data.foundDrugs);

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugSimpleHealth();
