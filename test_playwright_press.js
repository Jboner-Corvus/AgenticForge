// Manual Playwright Press Test
// Testing keyboard press functionality

import { chromium } from 'playwright';

async function testPlaywrightPress() {
    console.log('🚀 Starting Playwright Press Test...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Test 1: Navigate to key press test site
        console.log('📍 Navigating to key press test site...');
        await page.goto('https://the-internet.herokuapp.com/key_presses');
        await page.waitForLoadState('networkidle');
        
        // Test 2: Test various key presses
        console.log('⌨️ Testing key press functionality...');
        
        // Press ENTER key
        await page.press('body', 'Enter');
        await page.waitForTimeout(1000);
        
        let result = await page.locator('#result').textContent();
        console.log('✅ ENTER key result:', result);
        
        // Press TAB key
        await page.press('body', 'Tab');
        await page.waitForTimeout(1000);
        
        result = await page.locator('#result').textContent();
        console.log('✅ TAB key result:', result);
        
        // Press SPACE key
        await page.press('body', 'Space');
        await page.waitForTimeout(1000);
        
        result = await page.locator('#result').textContent();
        console.log('✅ SPACE key result:', result);
        
        // Press Arrow keys
        await page.press('body', 'ArrowUp');
        await page.waitForTimeout(1000);
        
        result = await page.locator('#result').textContent();
        console.log('✅ ARROW UP key result:', result);
        
        await page.press('body', 'ArrowDown');
        await page.waitForTimeout(1000);
        
        result = await page.locator('#result').textContent();
        console.log('✅ ARROW DOWN key result:', result);
        
        // Press Escape key
        await page.press('body', 'Escape');
        await page.waitForTimeout(1000);
        
        result = await page.locator('#result').textContent();
        console.log('✅ ESCAPE key result:', result);
        
        // Test 3: Take screenshot for verification
        console.log('📸 Taking final screenshot...');
        await page.screenshot({ 
            path: '/home/demon/agentforge/AgenticForge2/AgenticForge/playwright_press_test.png',
            fullPage: true 
        });
        
        console.log('✅ Playwright Press Test completed successfully!');
        console.log('📁 Screenshot saved to: playwright_press_test.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testPlaywrightPress().catch(console.error);