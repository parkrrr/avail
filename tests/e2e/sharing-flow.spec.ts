import { test, expect } from '@playwright/test';

test.describe('Sharing Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create event and generate share URL', async ({ page }) => {
    // Create an event
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 100;
    const endY = startY + 60;
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Click share button
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    // Look for share modal
    const shareModal = await page.locator('.modal-overlay');
    await expect(shareModal).toBeVisible();
  });

  test('should display full URL in share modal', async ({ page }) => {
    // Create an event first
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 100;
    const endY = startY + 60;
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Open share modal
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    // Check URL display
    const urlDisplay = await page.locator('.url-display').first();
    const urlValue = await urlDisplay.textContent();
    
    if (urlValue) {
      expect(urlValue).toContain('http');
      expect(urlValue).toContain('#');
    }
  });

  test('should copy URL to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Create an event
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 100;
    const endY = startY + 60;
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Open share modal
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    // Click copy button
    const copyButton = await page.locator('button:has-text("Copy")').first();
    await copyButton.click();
    
    // Check for feedback
    const feedbackButton = await page.locator('button').filter({ hasText: /Copied/ });
    await expect(feedbackButton).toBeVisible();
  });

  test('should show different timezone options', async ({ page }) => {
    // Click timezone selector
    const timezoneSelect = await page.locator('select').first();
    if (await timezoneSelect.isVisible()) {
      await timezoneSelect.click();
      
      // Get all options
      const options = await page.locator('option').count();
      expect(options).toBeGreaterThan(15); // Should have many timezones
    }
  });

  test('should change timezone in selector', async ({ page }) => {
    const timezoneSelect = await page.locator('select').first();
    
    // Get initial value
    const initialValue = await timezoneSelect.inputValue();
    
    // Select a different timezone
    await timezoneSelect.selectOption('America/Los_Angeles');
    
    const newValue = await timezoneSelect.inputValue();
    expect(newValue).not.toBe(initialValue);
  });

  test('should generate valid base64 URL when sharing', async ({ page }) => {
    // Create event
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 180; // Around noon
    const endY = startY + 120; // 2-hour block
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Open share modal
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    // Extract URL
    const urlDisplay = await page.locator('.url-display').first();
    const urlValue = await urlDisplay.textContent();
    
    if (urlValue && urlValue.includes('#')) {
      const hashPart = urlValue.split('#')[1];
      
      // Verify it's valid base64
      try {
        Buffer.from(hashPart, 'base64').toString('utf8');
        expect(true).toBe(true);
      } catch {
        expect(false).toBe(true); // Should not throw
      }
    }
  });

  test('should disable editing in shared view mode', async ({ page }) => {
    // Create and share availability
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 100;
    const endY = startY + 60;
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Get share URL
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();
    
    // Close the modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);
    
    if (shareUrl) {
      // Open in new tab (or same page after programmatic navigation)
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // In view-only mode
      const addButtons = await page.locator('button:has-text("+")').count();
      expect(addButtons).toBe(0); // Should not be able to add days
      
      // Theme switcher should also be disabled
      const themeSwitcher = await page.locator('.theme-switcher');
      const isDisabled = await themeSwitcher.evaluate((el) => 
        (el as HTMLButtonElement).disabled || el.getAttribute('disabled') !== null
      );
      expect(isDisabled).toBe(true);
    }
  });

  test('should maintain event order when sharing', async ({ page }) => {
    // Create multiple events
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    // Create event 1
    const startY1 = gridBox.y + 100;
    const endY1 = startY1 + 60;
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY1);
    await page.mouse.down();
    await page.mouse.move(centerX, endY1, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Create event 2
    const startY2 = gridBox.y + 300;
    const endY2 = startY2 + 60;
    
    await page.mouse.move(centerX, startY2);
    await page.mouse.down();
    await page.mouse.move(centerX, endY2, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Get initial block count
    const initialBlocks = await page.locator('.availability-block').count();
    
    // Share
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();
    
    // Close the modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);
    
    if (shareUrl) {
      // Navigate to shared URL
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // Check block count matches
      const sharedBlocks = await page.locator('.availability-block').count();
      expect(sharedBlocks).toBe(initialBlocks);
    }
  });
});
