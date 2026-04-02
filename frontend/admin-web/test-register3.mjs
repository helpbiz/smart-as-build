import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigate to register page...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
    
    console.log('2. Get all inputs...');
    const inputs = await page.locator('input').all();
    console.log('Total inputs:', inputs.length);
    
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      console.log(`Input ${i}: type=${type}`);
    }
    
    console.log('3. Fill form using nth...');
    await inputs[0].fill('newadmin1');
    await inputs[1].fill('password123');
    await inputs[2].fill('password123');
    
    console.log('4. Check button state...');
    const button = await page.locator('button[type="submit"]');
    const isDisabled = await button.isDisabled();
    console.log('Button disabled:', isDisabled);
    
    console.log('5. Click submit button...');
    await button.click();
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check URL
    console.log('Current URL:', page.url());
    
    // Check for errors
    const errors = await page.locator('.bg-red-100').all();
    if (errors.length > 0) {
      console.log('Error message:', await errors[0].textContent());
    }
    
  } catch (e) {
    console.error('Test error:', e.message);
  } finally {
    await browser.close();
  }
}

test();
