const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 412, height: 915 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Scroll to catalog to make sure images load if lazy
  await page.evaluate(() => {
    document.getElementById('catalogo').scrollIntoView();
  });
  // Wait a bit
  await new Promise(r => setTimeout(r, 1000));

  const metrics = await page.evaluate(() => {
    // Select all cards
    const cards = Array.from(document.querySelectorAll('#catalogo .grid > div'));
    
    if (cards.length < 2) {
      return { error: 'Not enough cards', count: cards.length };
    }

    const firstCard = cards[0].getBoundingClientRect();
    const secondCard = cards[1].getBoundingClientRect();

    return {
      count: cards.length,
      firstCard: {
        left: firstCard.left,
        right: firstCard.right,
        width: firstCard.width
      },
      secondCard: {
        left: secondCard.left,
        right: secondCard.right,
        width: secondCard.width
      },
      gapBetween: secondCard.left - firstCard.right,
      firstRowY: firstCard.y,
      secondRowY: secondCard.y
    };
  });

  // Take screenshot
  await page.screenshot({ path: 'mobile_catalog.png' });

  console.log(JSON.stringify(metrics, null, 2));
  
  await browser.close();
})();
