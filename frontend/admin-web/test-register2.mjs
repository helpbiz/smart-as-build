import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigate to register page...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
    
    console.log('2. Fill form...');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]:nth-of-type(1)', 'password123');
    await page.fill('input[type="password"]:nth-of-type(2)', 'password123');
    
    console.log('3. Check button state...');
    const button = await page.locator('button[type="submit"]');
    const isDisabled = await button.isDisabled();
    console.log('Button disabled:', isDisabled);
    
    console.log('4. Click submit button...');
    await button.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check URL
    console.log('Current URL:', page.url());
    
    // Check for any alerts or errors
    const dialog = page.locator('[role="alert"]');
    if (await dialog.count() > 0) {
      console.log('Alert visible:', await dialog.textContent());
    }
    
  } catch (e) {
    console.error('Test error:', e.message);
  } finally {
    await browser.close();
  }
}

test();
