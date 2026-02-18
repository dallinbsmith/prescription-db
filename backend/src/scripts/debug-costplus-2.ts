import puppeteer from 'puppeteer';

const debugCostPlus2 = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1920, height: 1080 });

  // Try specific drug pages
  const urls = [
    'https://costplusdrugs.com/medications/sildenafil-20mg-tablet/',
    'https://costplusdrugs.com/medications/tadalafil-5mg-tablet/',
    'https://costplusdrugs.com/medications/finasteride-1mg-tablet/',
    'https://costplusdrugs.com/medications/metformin-500mg-tablet/',
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
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent?.trim().slice(0, 80))
          .filter(h => h && h.length > 2)
          .slice(0, 15);

        const bodyText = document.body?.innerText || '';
        const priceMatches = bodyText.match(/\$\d+(?:\.\d{2})?/g) || [];

        return { 
          headings, 
          priceMatches: [...new Set(priceMatches)].slice(0, 10),
          bodyPreview: bodyText.slice(0, 500)
        };
      });

      console.log('Headings:', data.headings);
      console.log('Prices found:', data.priceMatches);

    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  // Try the search functionality
  console.log('\n\n=== Trying Search ===');
  try {
    await page.goto('https://www.costplusdrugs.com/medications/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    await page.waitForTimeout(3000);
    
    // Look for search input
    const searchInput = await page.$('input[type="search"], input[placeholder*="search"], input[name*="search"]');
    if (searchInput) {
      console.log('Found search input');
      await searchInput.type('sildenafil');
      await page.waitForTimeout(2000);
      
      const results = await page.evaluate(() => {
        return document.body.innerText.slice(0, 1000);
      });
      console.log('Search results preview:', results.slice(0, 500));
    } else {
      console.log('No search input found');
    }
  } catch (error: any) {
    console.log(`Search error: ${error.message}`);
  }

  await browser.close();
};

debugCostPlus2();
