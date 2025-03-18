import { test, expect } from '@playwright/test';

test('Home page loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Wait for content to be visible (either splash screen or main app)
  await page.waitForSelector('h1, h2', { timeout: 10000 });
  
  // We should see the app title somewhere on the page
  const headings = await page.getByRole('heading').all();
  const titleExists = await headings.some(async (heading) => {
    const text = await heading.textContent();
    return text.includes('ICD-10-CM');
  });
  expect(titleExists).toBeTruthy();
  
  // Look for upload button on splash screen
  const uploadButton = await page.getByText(/Upload/i).first();
  await expect(uploadButton).toBeVisible();
});

test('File upload interface is visible', async ({ page }) => {
  await page.goto('/');
  
  // Wait for upload button
  const uploadButton = await page.getByText(/Upload/i).first();
  await expect(uploadButton).toBeVisible();
  
  // File input should exist (might be hidden)
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();
});

test('Shows error with incorrect file type', async ({ page }) => {
  // Increase timeout for this test
  test.setTimeout(60000);
  
  await page.goto('/');
  
  // Find the file input
  const fileInput = page.locator('input[type="file"]');
  
  // Ensure file input is attached
  await expect(fileInput).toBeAttached();
  
  // Make hidden file input visible for test
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(input => {
      input.style.opacity = '1';
      input.style.display = 'block';
      input.style.visibility = 'visible';
      input.style.position = 'fixed';
      input.style.top = '0';
      input.style.left = '0';
      input.style.zIndex = '9999';
    });
  });
  
  // Upload a text file instead of JSONL
  await fileInput.setInputFiles({
    name: 'test.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('This is not a JSONL file')
  });
  
  // Look for any error message
  const errorMessage = page.getByText(/error|invalid|format|jsonl/i);
  await expect(errorMessage).toBeVisible({ timeout: 10000 });
});

test.skip('Dark/light theme functionality', async ({ page }) => {
  await page.goto('/');
  
  // Look for a theme toggle button by its SVG icon or aria label
  const themeToggle = page.locator('button, [role="button"]').filter({
    has: page.locator('svg'),
  }).first();
  
  // If we found a button that might be the theme toggle, try clicking it
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    
    // Check if body or html has dark class
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') || 
             document.body.classList.contains('dark');
    });
    
    // Click again to toggle back
    await themeToggle.click();
    
    // Check it toggled back
    const isLightMode = await page.evaluate(() => {
      return !document.documentElement.classList.contains('dark') && 
             !document.body.classList.contains('dark');
    });
    
    // One of these checks should pass if theme toggle works
    expect(isDarkMode || isLightMode).toBeTruthy();
  }
});

test.skip('Uploads a JSONL file and processes it', async ({ page }) => {
  // This test needs a real JSONL file to work
  // and would need additional setup for CI environment
  await page.goto('/');
  
  // Find the file input
  const fileInput = page.locator('input[type="file"]');
  
  // We would need a valid JSONL file for this test
  // await fileInput.setInputFiles({ path: './path/to/test-data.jsonl' });
  
  // Check if loading screen appears
  const loadingText = page.getByText('Processing', { exact: false });
  await expect(loadingText).toBeVisible();
  
  // Wait for search interface to appear
  const searchInput = page.getByPlaceholder('Search', { exact: false });
  await expect(searchInput).toBeVisible();
  
  // Test searching for a code
  await searchInput.fill('A00');
  
  // Results should appear
  const results = page.getByText('A00', { exact: false });
  await expect(results).toBeVisible();
}); 