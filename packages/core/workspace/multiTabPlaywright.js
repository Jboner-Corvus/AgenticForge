const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Create multiple contexts for separate sessions
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const context3 = await browser.newContext();

  // Open pages in different contexts
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  const page3 = await context3.newPage();

  // Navigate to URLs simultaneously
  await Promise.all([
    page1.goto('https://example.com'),
    page2.goto('https://httpbin.org/json'),
    page3.goto('https://httpbin.org/html')
  ]);

  console.log('Opened example.com, httpbin.org/json, and httpbin.org/html in separate tabs/contexts.');

  // Store pages for later use
  global.page1 = page1;
  global.page2 = page2;
  global.page3 = page3;

  global.context1 = context1;
  global.context2 = context2;
  global.context3 = context3;

  // Keep browser open for subsequent actions
  // In a real scenario, you'd perform actions here and then close.
  // For this interactive session, we'll keep it open temporarily.
  // await browser.close(); 
})();
