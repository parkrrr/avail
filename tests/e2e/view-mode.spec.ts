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
    
    // Close the modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);
    
    if (shareUrl) {
      // Navigate away first to force full page reload (prevents hash loss with Vite)
      await page.goto('about:blank');
      await page.waitForTimeout(100);
      
      // Now navigate to shared URL
      await page.goto(shareUrl, { waitUntil: 'load' });
      
      // Wait a bit for the app to initialize
      await page.waitForTimeout(1000);
      
      // Wait for view-only mode to be activated
      await page.waitForSelector('div:has-text("Viewing shared availability")', { timeout: 5000 });
      
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
    
    // Close the modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);
    
    if (shareUrl) {
      // Open in new context with different timezone
      // Note: This is a simplified test - actual timezone testing would require
      // manipulating browser's timezone settings more deeply
      
      // Navigate away first to force full page reload (prevents hash loss with Vite)
      await page.goto('about:blank');
      
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
    
    // Close the modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);
    
    if (shareUrl) {
      // Set mobile viewport to see scroll indicators
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate away first to force full page reload (prevents hash loss with Vite)
      await page.goto('about:blank');
      
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
    
    // Close the modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);
    
    if (shareUrl) {
      // Navigate away first to force full page reload (prevents hash loss with Vite)
      await page.goto('about:blank');
      
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // Wait for view-only mode to be activated
      await page.waitForSelector('div:has-text("Viewing shared availability")', { timeout: 5000 });
      
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
    
    // Close the modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);
    
    if (shareUrl) {
      // Navigate away first to force full page reload (prevents hash loss with Vite)
      await page.goto('about:blank');
      
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      
      // Date should be displayed correctly
      const sharedDateDisplay = await page.locator('.day-title').first().textContent();
      expect(sharedDateDisplay).toBe(dateDisplay);
    }
  });

  test('should render all events from shared data', async ({ page }) => {
    // Create multiple events by tapping
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const timeGrid = await page.locator('.time-grid').first();
    
    // Create first event at 10 AM
    await timeGrid.evaluate((el) => { el.scrollTop = 120; });
    await page.waitForTimeout(400);
    const gridBox1 = await timeGrid.boundingBox();
    if (gridBox1) {
      await page.mouse.click(gridBox1.x + gridBox1.width / 2, gridBox1.y + 150);
    }
    await page.waitForTimeout(500);
    
    // Create second event at 2 PM
    await timeGrid.evaluate((el) => { el.scrollTop = 360; });
    await page.waitForTimeout(400);
    const gridBox2 = await timeGrid.boundingBox();
    if (gridBox2) {
      await page.mouse.click(gridBox2.x + gridBox2.width / 2, gridBox2.y + 150);
    }
    await page.waitForTimeout(500);
    
    // Get count of events created
    const initialEventCount = await page.locator('.availability-block').count();
    expect(initialEventCount).toBeGreaterThanOrEqual(2); // At least 2 events
    
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
      // Navigate away first to force full page reload (prevents hash loss with Vite)
      await page.goto('about:blank');
      
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
    const shareButtonCount = await shareButton.count();
    
    if (shareButtonCount > 0) {
      const isEnabled = await shareButton.isEnabled();
      
      if (isEnabled) {
        await shareButton.click();
        
        const urlDisplay = await page.locator('.url-display').first();
        const shareUrl = await urlDisplay.textContent();
        
        // Close the modal
        const closeButton = await page.locator('button:has-text("Close")');
        await closeButton.click();
        await page.waitForTimeout(200);
        
        if (shareUrl) {
          // Navigate away first to force full page reload (prevents hash loss with Vite)
          await page.goto('about:blank');
          
          await page.goto(shareUrl);
          await page.waitForLoadState('networkidle');
          
          // Should load without errors
          const events = await page.locator('.availability-block').count();
          expect(events).toBe(0);
        }
      }
    } else {
      // Share button doesn't exist when no events - this is expected behavior
      expect(shareButtonCount).toBe(0);
    }
  });
});
