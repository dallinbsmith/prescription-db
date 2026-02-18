import puppeteer from 'puppeteer';

const debugSite = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  const urls = [
    'https://www.hims.com/erectile-dysfunction',
    'https://www.hims.com/hair-loss',
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

      // Get first 500 chars of body text
      const bodyText = await page.evaluate(() => {
        return document.body?.innerText?.slice(0, 500) || 'No body text';
      });
      console.log(`Body preview: ${bodyText.slice(0, 200)}...`);

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  await browser.close();
};

debugSite();
