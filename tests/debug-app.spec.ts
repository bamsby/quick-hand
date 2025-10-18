import { test, expect } from '@playwright/test';

test('Debug app structure', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:8081');
  
  // Wait a bit for the page to load
  await page.waitForTimeout(3000);
  
  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'debug-screenshot.png' });
  
  // Get the page content
  const content = await page.content();
  console.log('Page content:', content);
  
  // Check if we can find any text
  const allText = await page.textContent('body');
  console.log('All text on page:', allText);
  
  // Look for any buttons or clickable elements
  const buttons = await page.locator('button').count();
  console.log('Number of buttons found:', buttons);
  
  const pressables = await page.locator('[role="button"]').count();
  console.log('Number of pressable elements found:', pressables);
  
  // Check if there are any role-related elements
  const roleElements = await page.locator('text*="Founder"').count();
  console.log('Founder elements found:', roleElements);
  
  const studentElements = await page.locator('text*="Student"').count();
  console.log('Student elements found:', studentElements);
});
