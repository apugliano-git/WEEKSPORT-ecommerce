const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 412, height: 915 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  const metrics = await page.evaluate(() => {
    // 1. Logo scale
    const logoImg = document.querySelector('header img');
    
    // 2. Margin collapse
    const storeSection = document.querySelector('section.max-w-7xl');
    const categoryGridWrapper = storeSection ? storeSection.children[0] : null;

    // 3. Mobile Padding
    // Text wrapper in HeroBanner
    const heroTextWrapper = document.querySelector('section.h-\\[65vh\\] > div.relative.z-10');
    // First card in CategoryGrid
    const firstCard = document.querySelector('.grid.grid-cols-2 > button');
    // The StoreClient section
    const storeClientSection = document.querySelector('section.max-w-7xl');

    function getMetrics(el) {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        className: el.className,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        padding: s.padding,
        paddingInline: s.paddingInline,
        paddingLeft: s.paddingLeft,
        paddingBottom: s.paddingBottom,
        marginBottom: s.marginBottom,
        paddingRight: s.paddingRight
      };
    }

    return {
      logoImg: getMetrics(logoImg),
      categoryGridWrapper: getMetrics(categoryGridWrapper),
      heroTextWrapper: getMetrics(heroTextWrapper),
      firstCard: getMetrics(firstCard),
      storeClientSection: getMetrics(storeClientSection)
    };
  });

  console.log(JSON.stringify(metrics, null, 2));
  
  await browser.close();
})();
