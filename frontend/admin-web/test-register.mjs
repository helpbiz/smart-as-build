import { chromium } from '@playwright/test';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to register page...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get button info
    const button = await page.locator('button[type="submit"]');
    const isDisabled = await button.isDisabled();
    const isVisible = await button.isVisible();
    const buttonText = await button.textContent();
    const buttonHtml = await button.evaluate(el => el.outerHTML);
    
    console.log('\n=== Button Status ===');
    console.log('Text:', buttonText);
    console.log('Visible:', isVisible);
    console.log('Disabled:', isDisabled);
    console.log('HTML:', buttonHtml);
    
    // Get form info
    const form = await page.locator('form');
    const formExists = await form.count();
    console.log('\n=== Form Status ===');
    console.log('Form count:', formExists);
    
    // Check for any overlays or blocking elements
    const overlays = await page.evaluate(() => {
      const elements = document.querySelectorAll('div, span, section');
      let blockingElements = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            blockingElements.push({
              tag: el.tagName,
              class: el.className,
              position: style.position,
              zIndex: style.zIndex,
              rect: { width: rect.width, height: rect.height }
            });
          }
        }
      });
      return blockingElements;
    });
    
    console.log('\n=== Blocking Elements ===');
    console.log(JSON.stringify(overlays.slice(0, 5), null, 2));
    
    // Try clicking the button
    console.log('\n=== Attempting to click button ===');
    try {
      await button.click({ timeout: 5000 });
      console.log('Button clicked successfully!');
    } catch (e) {
      console.log('Failed to click:', e.message);
    }
    
  } catch (e) {
    console.error('Test error:', e.message);
  } finally {
    await browser.close();
  }
}

test();
