import puppeteer from 'puppeteer';

const debugPillPack = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://pharmacy.amazon.com',
    'https://pharmacy.amazon.com/search',
    'https://pharmacy.amazon.com/categories',
  ];

  for (const url of urls) {
    console.log(`\n=== Checking: ${url} ===`);
    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      console.log(`Status: ${response?.status()}`);
      console.log(`Final URL: ${page.url()}`);

      const title = await page.title();
      console.log(`Title: ${title}`);

      // Get page structure
      const structure = await page.evaluate(() => {
        const nav = document.querySelector('nav, header');
        const navLinks = nav ? Array.from(nav.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim().slice(0, 50),
          href: a.getAttribute('href')
        })).filter(l => l.text && l.href) : [];

        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).slice(0, 15).map(h => h.textContent?.trim().slice(0, 60));

        const links = Array.from(document.querySelectorAll('a'))
          .map(a => ({
            text: a.textContent?.trim().slice(0, 50),
            href: a.getAttribute('href')
          }))
          .filter(l => l.text && l.href && (
            l.href.includes('medication') ||
            l.href.includes('drug') ||
            l.href.includes('prescription') ||
            l.href.includes('pharmacy')
          ))
          .slice(0, 20);

        return { navLinks: navLinks.slice(0, 15), headings, drugLinks: links };
      });

      console.log('\nNav Links:', JSON.stringify(structure.navLinks, null, 2));
      console.log('\nHeadings:', structure.headings);
      console.log('\nDrug/Medication Links:', JSON.stringify(structure.drugLinks, null, 2));

      // Get body text preview
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 1500) || '');
      console.log('\nBody preview:', bodyText.slice(0, 500));

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugPillPack();
