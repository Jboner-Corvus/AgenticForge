// screenshot.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file://' + __dirname + '/test.html');
  await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
  await browser.close();
})();