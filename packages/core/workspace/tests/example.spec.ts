import { test, expect } from '@playwright/test';

test('Advanced Playwright Automation Test', async ({ page }) => {
  // 1. Navigate to a target URL
  await page.goto('https://www.google.com');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/01_homepage.png' });

  // 2. Implement element interaction (typing into search field, clicking search button)
  await page.type('textarea[name="q"]', 'Playwright automation example');
  await page.screenshot({ path: 'screenshots/02_typed_text.png' });
  await page.press('textarea[name="q"]', 'Enter');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/03_search_results.png' });

  // 3. Add data extraction functionality (get title of the page and first search result)
  const pageTitle = await page.title();
  console.log('Page Title:', pageTitle);
  expect(pageTitle).toContain('Playwright automation example');

  const firstSearchResult = await page.textContent('h3');
  console.log('First Search Result:', firstSearchResult);
  expect(firstSearchResult).toBeDefined();

  // 4. Navigate to the first search result (example: clicking the first link)
  await page.click('h3 >> nth=0');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/04_first_result_page.png' });

  // Verify navigation
  const currentUrl = page.url();
  expect(currentUrl).not.toContain('google.com'); // Should have navigated away from Google
});
