// Manual Playwright Checkbox Test
// Testing check/uncheck functionality

import { chromium } from 'playwright';

async function testPlaywrightCheckbox() {
    console.log('🚀 Starting Playwright Checkbox Test...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Test 1: Navigate to checkbox test site
        console.log('📍 Navigating to checkbox test site...');
        await page.goto('https://the-internet.herokuapp.com/checkboxes');
        await page.waitForLoadState('networkidle');
        
        // Test 2: Get initial checkbox states
        console.log('🔍 Getting initial checkbox states...');
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        
        for (let i = 0; i < checkboxes.length; i++) {
            const isChecked = await checkboxes[i].isChecked();
            console.log(`📦 Checkbox ${i + 1} initial state: ${isChecked ? 'CHECKED' : 'UNCHECKED'}`);
        }
        
        // Test 3: Check unchecked boxes
        console.log('✅ Testing check functionality...');
        for (let i = 0; i < checkboxes.length; i++) {
            const isChecked = await checkboxes[i].isChecked();
            if (!isChecked) {
                await checkboxes[i].check();
                console.log(`✅ Checked checkbox ${i + 1}`);
                await page.waitForTimeout(500);
            }
        }
        
        // Test 4: Verify all boxes are now checked
        console.log('🔍 Verifying all checkboxes are checked...');
        for (let i = 0; i < checkboxes.length; i++) {
            const isChecked = await checkboxes[i].isChecked();
            console.log(`📦 Checkbox ${i + 1} after check: ${isChecked ? 'CHECKED' : 'UNCHECKED'}`);
        }
        
        // Test 5: Uncheck all boxes
        console.log('❌ Testing uncheck functionality...');
        for (let i = 0; i < checkboxes.length; i++) {
            const isChecked = await checkboxes[i].isChecked();
            if (isChecked) {
                await checkboxes[i].uncheck();
                console.log(`❌ Unchecked checkbox ${i + 1}`);
                await page.waitForTimeout(500);
            }
        }
        
        // Test 6: Verify all boxes are now unchecked
        console.log('🔍 Verifying all checkboxes are unchecked...');
        for (let i = 0; i < checkboxes.length; i++) {
            const isChecked = await checkboxes[i].isChecked();
            console.log(`📦 Checkbox ${i + 1} after uncheck: ${isChecked ? 'CHECKED' : 'UNCHECKED'}`);
        }
        
        // Test 7: Test toggle functionality
        console.log('🔄 Testing toggle functionality...');
        for (let i = 0; i < checkboxes.length; i++) {
            const initialState = await checkboxes[i].isChecked();
            await checkboxes[i].click(); // Toggle
            await page.waitForTimeout(500);
            const newState = await checkboxes[i].isChecked();
            console.log(`🔄 Checkbox ${i + 1} toggled: ${initialState} → ${newState}`);
        }
        
        // Test 8: Take screenshot for verification
        console.log('📸 Taking final screenshot...');
        await page.screenshot({ 
            path: '/home/demon/agentforge/AgenticForge2/AgenticForge/playwright_checkbox_test.png',
            fullPage: true 
        });
        
        console.log('✅ Playwright Checkbox Test completed successfully!');
        console.log('📁 Screenshot saved to: playwright_checkbox_test.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testPlaywrightCheckbox().catch(console.error);