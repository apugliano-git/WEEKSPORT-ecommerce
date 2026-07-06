const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 412, height: 915 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    document.getElementById('catalogo').scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    window.scrollTo(0, 0); // scroll back up
  });
  await new Promise(r => setTimeout(r, 500));

  const metrics = await page.evaluate(() => {
    const headerHeight = 64; // in mobile
    const cards = Array.from(document.querySelectorAll('#catalogo .grid > button'));
    if (cards.length === 0) return { error: 'No cards found' };
    
    // Altura de una card
    const firstCard = cards[0];
    const rect = firstCard.getBoundingClientRect();
    const cardHeight = rect.height;
    
    // Altura visible (915 - 64 header - padding)
    const storeSection = document.querySelector('section.max-w-7xl');
    const storeStyle = window.getComputedStyle(storeSection);
    // Usually padding-top in mobile is py-20 => 5rem = 80px
    const paddingTop = parseFloat(storeStyle.paddingTop) || 80;
    
    const availableHeight = 915 - headerHeight - paddingTop;
    const cardsPerColumn = availableHeight / cardHeight;
    
    let visibleCards = 0;
    cards.forEach(c => {
      const cRect = c.getBoundingClientRect();
      if (cRect.top < 850) {
        visibleCards++;
      }
    });

    return {
      cardHeight,
      cardsPerColumn,
      visibleCards,
      firstCardTop: rect.top,
      storePaddingTop: paddingTop,
      firstCardRect: {
        width: rect.width,
        height: rect.height,
        top: rect.top
      }
    };
  });

  // Take screenshot
  await page.screenshot({ path: 'mobile_compact.png' });

  console.log(JSON.stringify(metrics, null, 2));
  
  await browser.close();
})();
