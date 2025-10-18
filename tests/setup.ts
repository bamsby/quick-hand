import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:8081');
  
  // Wait for the app to load
  await page.waitForSelector('[data-testid="role-selector"]', { timeout: 10000 });
  
  // For now, we'll assume the app works without authentication
  // In a real scenario, you might need to handle login here
  await page.context().storageState({ path: authFile });
});

// Helper functions for memory testing
export async function waitForMemoryToLoad(page: any, timeout = 10000) {
  // Wait for any memory-related loading indicators
  await page.waitForLoadState('networkidle', { timeout });
}

export async function clearBrowserStorage(page: any) {
  // Clear all storage to simulate fresh session
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function simulateMemoryFailure(page: any) {
  // Intercept mem0 API calls and make them fail
  await page.route('**/api.mem0.ai/**', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Memory service unavailable' })
    });
  });
}

export async function restoreMemoryService(page: any) {
  // Remove the route interception
  await page.unroute('**/api.mem0.ai/**');
}
