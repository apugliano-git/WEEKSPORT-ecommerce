const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1600, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  const styles = await page.evaluate(() => {
    const headerDiv = document.querySelector('header > div');
    const logoImg = document.querySelector('header img');
    
    // The user wants the div that wraps CategoryGrid, which has mb-24 md:mb-32.
    // It's the first child of the section in StoreClient.
    const storeSection = document.querySelector('section.max-w-7xl');
    const categoryGridWrapper = storeSection ? storeSection.children[0] : null;

    function getPixels(el, prop) {
      if (!el) return null;
      return window.getComputedStyle(el)[prop];
    }

    return {
      headerDivHeight: getPixels(headerDiv, 'height'),
      headerClassName: headerDiv ? headerDiv.className : null,
      logoImgHeight: getPixels(logoImg, 'height'),
      logoClassName: logoImg ? logoImg.className : null,
      categoryGridWrapperMarginBottom: getPixels(categoryGridWrapper, 'marginBottom'),
      categoryGridWrapperClassName: categoryGridWrapper ? categoryGridWrapper.className : null
    };
  });

  console.log(JSON.stringify(styles, null, 2));
  
  await browser.close();
})();
