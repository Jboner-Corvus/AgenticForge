const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to the local HTML file
  await page.goto('file://' + process.cwd() + '/test.html');
  
  // Take a screenshot
  await page.screenshot({ path: 'test-screenshot.png' });
  
  await browser.close();
  console.log('Screenshot saved as test-screenshot.png');
})();
