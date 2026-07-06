const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Set a wide viewport to reproduce the issue
  await page.setViewport({ width: 375, height: 667 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  const getLayout = async () => page.evaluate(() => {
    const main = document.querySelector('main');
    const header = document.querySelector('header > div');
    const heroText = document.querySelector('section.h-\\[65vh\\] > div.relative.z-10');
    const categoryGrid = document.querySelector('.grid.grid-cols-2');
    
    function getStyles(el) {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        className: el.className,
        width: s.width,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        rect: { left: rect.left, right: rect.right, width: rect.width }
      };
    }

    return {
      header: getStyles(header),
      heroText: getStyles(heroText),
      categoryGrid: getStyles(categoryGrid)
    };
  });

  const mobileLayout = await getLayout();
  
  await page.setViewport({ width: 1600, height: 900 });
  // wait a bit for layout to settle
  await new Promise(r => setTimeout(r, 500));
  const desktopLayout = await getLayout();

  console.log(JSON.stringify({ mobile: mobileLayout, desktop: desktopLayout }, null, 2));
  
  await browser.close();
})();
