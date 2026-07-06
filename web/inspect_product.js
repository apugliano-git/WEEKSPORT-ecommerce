const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Test Mobile
  console.log("Tomando captura de producto en mobile...");
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 412, height: 915 });
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Click en el primer producto
  await pageMobile.waitForSelector('a[href^="/producto/"]');
  const href = await pageMobile.$eval('a[href^="/producto/"]', el => el.getAttribute('href'));
  console.log("Navegando a:", href);
  
  await pageMobile.goto('http://localhost:3000' + href, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  // Set long text to test overflow
  await pageMobile.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('h3'));
    const desc = headers.find(h => h.textContent.includes("Descripción"))?.nextElementSibling;
    if(desc) desc.textContent = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  });
  const mobileWidth = await pageMobile.evaluate(() => document.body.scrollWidth);
  console.log("Mobile body width:", mobileWidth, "Viewport: 412");

  await pageMobile.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  await pageMobile.screenshot({ path: 'product_mobile.png', fullPage: true });

  // Test Desktop
  console.log("Tomando captura de producto en desktop...");
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1600, height: 900 });
  await pageDesktop.goto('http://localhost:3000' + href, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const desktopWidth = await pageDesktop.evaluate(() => document.body.scrollWidth);
  console.log("Desktop body width:", desktopWidth, "Viewport: 1600");
  
  await pageDesktop.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));
  await pageDesktop.screenshot({ path: 'product_desktop.png', fullPage: true });

  await browser.close();
  console.log("¡Capturas guardadas como product_mobile.png y product_desktop.png!");
})();
