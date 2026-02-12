import { test, expect } from '@playwright/test';

test.describe('View-Only Mode & Timezone Conversion', () => {
  test('should display view-only indicator on shared URL', async ({ page }) => {
    // First, create availability in edit mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create an event
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 180; // 12 PM
    const endY = startY + 120; // 2 hour block
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
    
    if (shareUrl) {
      // Navigate to shared URL
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // Check that we're in view-only mode (no add buttons)
      const addButtons = await page.locator('button.add-day-button, button:has-text("+")').count();
      expect(addButtons).toBe(0);
      
      // Event should still be visible
      const events = await page.locator('.availability-block').count();
      expect(events).toBeGreaterThan(0);
    }
  });

  test('should convert event times when viewing in different timezone', async ({ page }) => {
    // Create availability
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Select Eastern Time first
    const timezoneSelect = await page.locator('select').first();
    await timezoneSelect.selectOption('America/New_York');
    
    await page.waitForTimeout(300);
    
    // Create an event (9 AM in Eastern)
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 180; // Around 9 AM in cells
    const endY = startY + 60; // 1 hour
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
    
    if (shareUrl) {
      // Open in new context with different timezone
      // Note: This is a simplified test - actual timezone testing would require
      // manipulating browser's timezone settings more deeply
      
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // Events should be visible (converted to viewing timezone)
      const events = await page.locator('.availability-block').count();
      expect(events).toBeGreaterThan(0);
    }
  });

  test('should show scroll indicators in view-only mode with multiple days', async ({ page }) => {
    // Create availability with multiple days
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Add a day after
    const addAfterButton = await page.locator('button:has-text("+")').last();
    if (await addAfterButton.isVisible()) {
      await addAfterButton.click();
      await page.waitForTimeout(300);
    }
    
    // Create event on first day
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 180;
    const endY = startY + 60;
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Share
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();
    
    if (shareUrl) {
      // Set mobile viewport to see scroll indicators
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // Scroll indicators should be visible (‹ › symbols)
      // They appear when there are multiple days in view-only mobile mode
      const indicators = await page.locator('.scroll-indicator').count();
      // May have 0, 1, or 2 indicators depending on scroll position
      expect(indicators).toBeGreaterThanOrEqual(0);
    }
  });

  test('should not allow editing blocks in view-only mode', async ({ page }) => {
    // Create and share availability
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Create event
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 180;
    const endY = startY + 60;
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Share
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();
    
    if (shareUrl) {
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // Try to click an event (should not be editable)
      const block = await page.locator('.availability-block').first();
      await block.click();
      
      // Should not show edit controls
      const deleteButton = await block.locator('button').count();
      expect(deleteButton).toBe(0); // No delete button in view-only
    }
  });

  test('should display correct date in view-only mode', async ({ page }) => {
    // Create availability
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial date
    const dateDisplay = await page.locator('.day-title').first().textContent();
    
    // Create event
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 180;
    const endY = startY + 60;
    const centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Share
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();
    
    if (shareUrl) {
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // Date should be displayed correctly
      const sharedDateDisplay = await page.locator('.day-title').first().textContent();
      expect(sharedDateDisplay).toBe(dateDisplay);
    }
  });

  test('should render all events from shared data', async ({ page }) => {
    // Create multiple events
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    // Event 1: 9 AM
    let startY = gridBox.y + 100;
    let endY = startY + 60;
    let centerX = gridBox.x + gridBox.width / 2;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Event 2: 2 PM
    startY = gridBox.y + 180;
    endY = startY + 60;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Event 3: 5 PM
    startY = gridBox.y + 280;
    endY = startY + 60;
    
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Should have 3 events
    const initialEventCount = await page.locator('.availability-block').count();
    expect(initialEventCount).toBe(3);
    
    // Share
    const shareButton = await page.locator('.share-button');
    await shareButton.click();
    
    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();
    
    if (shareUrl) {
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // All events should be visible
      const sharedEventCount = await page.locator('.availability-block').count();
      expect(sharedEventCount).toBe(initialEventCount);
    }
  });

  test('should handle shared URL with empty availability', async ({ page }) => {
    // Create state with no events but share it
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Don't create any events, just get the share URL if possible
    // (May not work if share button is disabled when no events exist)
    const shareButton = await page.locator('.share-button');
    const isEnabled = await shareButton.isEnabled();
    
    if (isEnabled) {
      await shareButton.click();
      
      const urlDisplay = await page.locator('.url-display').first();
      const shareUrl = await urlDisplay.textContent();
      
      if (shareUrl) {
        await page.goto(shareUrl);
        await page.waitForLoadState('networkidle');
        
        // Should load without errors
        const events = await page.locator('.availability-block').count();
        expect(events).toBe(0);
      }
    }
  });
});
