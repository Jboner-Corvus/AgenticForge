// Complex Multi-Step Playwright Automation Test
// Testing comprehensive browser automation workflow

import { chromium } from 'playwright';

async function testPlaywrightMultiStep() {
    console.log('🚀 Starting Complex Multi-Step Playwright Test...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Step 1: Navigation and Page Load
        console.log('📍 Step 1: Navigation to form testing site...');
        await page.goto('https://the-internet.herokuapp.com/login');
        await page.waitForLoadState('networkidle');
        
        // Step 2: Form Interaction - Login
        console.log('📝 Step 2: Testing login form...');
        await page.fill('#username', 'tomsmith');
        await page.fill('#password', 'SuperSecretPassword!');
        
        // Take screenshot before submit
        await page.screenshot({ 
            path: '/home/demon/agentforge/AgenticForge2/AgenticForge/step2_before_login.png',
            fullPage: true 
        });
        console.log('📸 Screenshot taken: step2_before_login.png');
        
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        
        // Verify login success
        const successMessage = await page.locator('.flash.success').textContent();
        console.log('✅ Login result:', successMessage.trim());
        
        // Step 3: Navigation to different section
        console.log('📍 Step 3: Navigating to dropdown test...');
        await page.goto('https://the-internet.herokuapp.com/dropdown');
        await page.waitForLoadState('networkidle');
        
        // Step 4: Dropdown Selection
        console.log('📋 Step 4: Testing dropdown selection...');
        const dropdown = page.locator('#dropdown');
        
        // Test selecting different options
        await dropdown.selectOption('1');
        await page.waitForTimeout(1000);
        console.log('✅ Selected Option 1');
        
        await dropdown.selectOption('2');
        await page.waitForTimeout(1000);
        console.log('✅ Selected Option 2');
        
        // Step 5: Navigation to drag and drop
        console.log('📍 Step 5: Navigating to drag and drop test...');
        await page.goto('https://the-internet.herokuapp.com/drag_and_drop');
        await page.waitForLoadState('networkidle');
        
        // Step 6: Drag and Drop Operation
        console.log('🔄 Step 6: Testing drag and drop...');
        const sourceElement = page.locator('#column-a');
        const targetElement = page.locator('#column-b');
        
        // Get initial states
        const initialA = await sourceElement.locator('header').textContent();
        const initialB = await targetElement.locator('header').textContent();
        console.log(`🔍 Initial state: A=${initialA}, B=${initialB}`);
        
        // Perform drag and drop
        await sourceElement.dragTo(targetElement);
        await page.waitForTimeout(2000);
        
        // Verify drag and drop result
        const finalA = await sourceElement.locator('header').textContent();
        const finalB = await targetElement.locator('header').textContent();
        console.log(`🔍 After drag/drop: A=${finalA}, B=${finalB}`);
        
        // Step 7: Navigation to JavaScript alerts
        console.log('📍 Step 7: Navigating to JavaScript alerts test...');
        await page.goto('https://the-internet.herokuapp.com/javascript_alerts');
        await page.waitForLoadState('networkidle');
        
        // Step 8: JavaScript Alert Handling
        console.log('⚠️ Step 8: Testing JavaScript alert handling...');
        
        // Handle different types of alerts
        page.on('dialog', async dialog => {
            console.log(`🔔 Alert detected: ${dialog.type()} - "${dialog.message()}"`);
            await dialog.accept();
        });
        
        // Test simple alert
        await page.click('button[onclick="jsAlert()"]');
        await page.waitForTimeout(1000);
        
        let result = await page.locator('#result').textContent();
        console.log('✅ Simple Alert result:', result);
        
        // Test confirm dialog
        await page.click('button[onclick="jsConfirm()"]');
        await page.waitForTimeout(1000);
        
        result = await page.locator('#result').textContent();
        console.log('✅ Confirm Dialog result:', result);
        
        // Step 9: Navigation to file upload
        console.log('📍 Step 9: Navigating to file upload test...');
        await page.goto('https://the-internet.herokuapp.com/upload');
        await page.waitForLoadState('networkidle');
        
        // Step 10: File Upload Simulation
        console.log('📁 Step 10: Testing file upload simulation...');
        
        // Create a temporary test file
        const fs = await import('fs/promises');
        const testFilePath = '/tmp/test_upload.txt';
        await fs.writeFile(testFilePath, 'This is a test file for Playwright upload testing.');
        
        // Upload the file
        await page.setInputFiles('#file-upload', testFilePath);
        await page.click('#file-submit');
        await page.waitForLoadState('networkidle');
        
        // Verify upload result
        const uploadResult = await page.locator('h3').textContent();
        console.log('✅ File Upload result:', uploadResult);
        
        // Step 11: Final comprehensive screenshot
        console.log('📸 Step 11: Taking final comprehensive screenshot...');
        await page.screenshot({ 
            path: '/home/demon/agentforge/AgenticForge2/AgenticForge/playwright_multistep_final.png',
            fullPage: true 
        });
        
        // Step 12: Performance and accessibility check
        console.log('⚡ Step 12: Checking page performance...');
        const metrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                loadTime: navigation.loadEventEnd - navigation.fetchStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
                pageTitle: document.title,
                pageUrl: window.location.href
            };
        });
        
        console.log('📊 Performance metrics:', JSON.stringify(metrics, null, 2));
        
        console.log('✅ Complex Multi-Step Playwright Test completed successfully!');
        console.log('📁 Screenshots saved: step2_before_login.png, playwright_multistep_final.png');
        console.log('🧹 Cleaning up temporary file...');
        await fs.unlink(testFilePath);
        
    } catch (error) {
        console.error('❌ Multi-step test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testPlaywrightMultiStep().catch(console.error);