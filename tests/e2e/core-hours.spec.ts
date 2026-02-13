import { test, expect } from '@playwright/test';

test.describe('Core Hours Feature', () => {
  test('should show only core hours (7AM-7PM) by default in edit mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that 7AM is visible
    const sevenAm = await page.locator('text=7:00 AM').first();
    await expect(sevenAm).toBeVisible();

    // Check that 6PM is visible (last hour of core)
    const sixPm = await page.locator('text=6:00 PM').first();
    await expect(sixPm).toBeVisible();

    // Check that midnight is NOT visible (before core hours)
    const midnight = page.locator('text=12:00 AM').first();
    await expect(midnight).not.toBeVisible();

    // Check that 11 PM is NOT visible (after core hours)
    const elevenPm = page.locator('text=11:00 PM').first();
    await expect(elevenPm).not.toBeVisible();

    // Check that expand buttons are visible
    const expandMorningBtn = await page.locator('button:has-text("Show earlier hours")');
    await expect(expandMorningBtn).toBeVisible();

    const expandEveningBtn = await page.locator('button:has-text("Show later hours")');
    await expect(expandEveningBtn).toBeVisible();
  });

  test('should expand morning hours when clicking expand button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click expand morning hours button
    const expandMorningBtn = await page.locator('button:has-text("Show earlier hours")');
    await expandMorningBtn.click();

    // Now midnight should be visible
    const midnight = await page.locator('text=12:00 AM').first();
    await expect(midnight).toBeVisible();

    // 6 AM should be visible
    const sixAm = await page.locator('text=6:00 AM').first();
    await expect(sixAm).toBeVisible();

    // Button should change to "Hide earlier hours"
    const collapseMorningBtn = await page.locator('button:has-text("Hide earlier hours")');
    await expect(collapseMorningBtn).toBeVisible();

    // Original expand button should not be visible
    await expect(expandMorningBtn).not.toBeVisible();
  });

  test('should collapse morning hours when clicking collapse button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Expand first
    const expandMorningBtn = await page.locator('button:has-text("Show earlier hours")');
    await expandMorningBtn.click();
    await page.waitForTimeout(200);

    // Then collapse
    const collapseMorningBtn = await page.locator('button:has-text("Hide earlier hours")');
    await collapseMorningBtn.click();
    await page.waitForTimeout(200);

    // Midnight should not be visible anymore
    const midnight = page.locator('text=12:00 AM').first();
    await expect(midnight).not.toBeVisible();

    // Expand button should be back
    await expect(expandMorningBtn).toBeVisible();
  });

  test('should expand evening hours when clicking expand button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click expand evening hours button
    const expandEveningBtn = await page.locator('button:has-text("Show later hours")');
    await expandEveningBtn.click();

    // Now 7 PM should be visible
    const sevenPm = await page.locator('text=7:00 PM').first();
    await expect(sevenPm).toBeVisible();

    // 11 PM should be visible
    const elevenPm = await page.locator('text=11:00 PM').first();
    await expect(elevenPm).toBeVisible();

    // Button should change to "Hide later hours"
    const collapseEveningBtn = await page.locator('button:has-text("Hide later hours")');
    await expect(collapseEveningBtn).toBeVisible();

    // Original expand button should not be visible
    await expect(expandEveningBtn).not.toBeVisible();
  });

  test('should collapse evening hours when clicking collapse button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Expand first
    const expandEveningBtn = await page.locator('button:has-text("Show later hours")');
    await expandEveningBtn.click();
    await page.waitForTimeout(200);

    // Then collapse
    const collapseEveningBtn = await page.locator('button:has-text("Hide later hours")');
    await collapseEveningBtn.click();
    await page.waitForTimeout(200);

    // 11 PM should not be visible anymore
    const elevenPm = page.locator('text=11:00 PM').first();
    await expect(elevenPm).not.toBeVisible();

    // Expand button should be back
    await expect(expandEveningBtn).toBeVisible();
  });

  test('should auto-expand morning hours in view-only mode when events exist before 7AM', async ({ page }) => {
    // First create an event at 6 AM in edit mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Expand morning hours
    const expandMorningBtn = await page.locator('button:has-text("Show earlier hours")');
    await expandMorningBtn.click();
    await page.waitForTimeout(300);

    // Create event at 6 AM
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Grid box not found');

    const sixAmY = gridBox.y + 360; // 6 AM = 360 minutes from midnight
    const centerX = gridBox.x + gridBox.width / 2;
    await page.mouse.click(centerX, sixAmY);
    await page.waitForTimeout(300);

    // Share
    const shareButton = await page.locator('.share-button');
    await shareButton.click();

    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();

    // Close modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);

    if (shareUrl) {
      // Navigate to shared URL
      await page.goto('about:blank');
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check that morning hours are automatically shown (no expand buttons in view mode)
      const midnight = await page.locator('text=12:00 AM').first();
      await expect(midnight).toBeVisible();

      const sixAm = await page.locator('text=6:00 AM').first();
      await expect(sixAm).toBeVisible();

      // No expand/collapse buttons should be visible in view-only mode
      const expandButtons = await page.locator('button:has-text("Show earlier hours")').count();
      expect(expandButtons).toBe(0);

      const collapseButtons = await page.locator('button:has-text("Hide earlier hours")').count();
      expect(collapseButtons).toBe(0);
    }
  });

  test('should auto-expand evening hours in view-only mode when events exist after 7PM', async ({ page }) => {
    // First create an event at 9 PM in edit mode
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Expand evening hours
    const expandEveningBtn = await page.locator('button:has-text("Show later hours")');
    await expandEveningBtn.click();
    await page.waitForTimeout(500);

    // Scroll time grid to 9 PM area and create event
    const timeGrid = await page.locator('.time-grid').first();
    await timeGrid.evaluate((el) => { el.scrollTop = 750; });
    await page.waitForTimeout(300);
    
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Grid box not found');

    // Click in the middle of visible area which should be around 9 PM
    const centerX = gridBox.x + gridBox.width / 2;
    const centerY = gridBox.y + gridBox.height / 2;
    await page.mouse.click(centerX, centerY);
    await page.waitForTimeout(500);

    // Verify event was created
    const events = await page.locator('.availability-block').count();
    if (events === 0) {
      throw new Error('Event was not created');
    }

    // Share
    const shareButton = await page.locator('.share-button');
    await shareButton.click();

    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();

    // Close modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);

    if (shareUrl) {
      // Navigate to shared URL
      await page.goto('about:blank');
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check that evening hours are automatically shown
      const sevenPm = await page.locator('text=7:00 PM').first();
      await expect(sevenPm).toBeVisible();

      const elevenPm = await page.locator('text=11:00 PM').first();
      await expect(elevenPm).toBeVisible();

      // No expand/collapse buttons should be visible in view-only mode
      const expandButtons = await page.locator('button:has-text("Show later hours")').count();
      expect(expandButtons).toBe(0);

      const collapseButtons = await page.locator('button:has-text("Hide later hours")').count();
      expect(collapseButtons).toBe(0);
    }
  });

  test('should show only core hours in view-only mode when all events are in core hours', async ({ page }) => {
    // Create an event in core hours (2 PM)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Grid box not found');

    const twoPmY = gridBox.y + 420; // 2 PM from core start (7AM) = 7 hours = 420 minutes
    const centerX = gridBox.x + gridBox.width / 2;
    await page.mouse.click(centerX, twoPmY);
    await page.waitForTimeout(300);

    // Share
    const shareButton = await page.locator('.share-button');
    await shareButton.click();

    const urlDisplay = await page.locator('.url-display').first();
    const shareUrl = await urlDisplay.textContent();

    // Close modal
    const closeButton = await page.locator('button:has-text("Close")');
    await closeButton.click();
    await page.waitForTimeout(200);

    if (shareUrl) {
      // Navigate to shared URL
      await page.goto('about:blank');
      await page.goto(shareUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check that morning hours are NOT shown
      const midnight = page.locator('text=12:00 AM').first();
      await expect(midnight).not.toBeVisible();

      // Check that evening hours are NOT shown  
      const elevenPm = page.locator('text=11:00 PM').first();
      await expect(elevenPm).not.toBeVisible();

      // Core hours should be visible
      const sevenAm = await page.locator('text=7:00 AM').first();
      await expect(sevenAm).toBeVisible();

      const sixPm = await page.locator('text=6:00 PM').first();
      await expect(sixPm).toBeVisible();
    }
  });

  test('should allow creating events in expanded hours', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Expand morning hours
    const expandMorningBtn = await page.locator('button:has-text("Show earlier hours")');
    await expandMorningBtn.click();
    await page.waitForTimeout(300);

    // Create event at 5 AM
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Grid box not found');

    const fiveAmY = gridBox.y + 300; // 5 AM = 300 minutes from midnight
    const centerX = gridBox.x + gridBox.width / 2;
    await page.mouse.click(centerX, fiveAmY);
    await page.waitForTimeout(300);

    // Event should be created
    const events = await page.locator('.availability-block').count();
    expect(events).toBe(1);

    // Event should show 5:00 AM time
    const eventText = await page.locator('.availability-block .block-time').first().textContent();
    expect(eventText).toContain('5:00 AM');
  });
});
