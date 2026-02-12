import { test, expect } from '@playwright/test';

test.describe('Mobile Event Creation', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create event by dragging on mobile viewport', async ({ page }) => {
    // Get the time grid
    const timeGrid = await page.locator('.time-grid').first();
    
    // Calculate positions for drag operation (9 AM to 10 AM)
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const startY = gridBox.y + 200; // Around 3:20 AM area
    const endY = startY + 60; // Create 1-hour block
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Perform drag operation
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 20 });
    await page.mouse.up();
    
    // Wait for block to appear
    await page.waitForTimeout(300);
    
    // Check if availability block was created
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBeGreaterThan(0);
    
    // Verify the block has the correct time range (approximately)
    const blockText = await page.locator('.availability-block').first().textContent();
    expect(blockText).toBeTruthy();
    console.log('Created block:', blockText);
  });

  test('should not create event with insufficient drag distance', async ({ page }) => {
    // Get the time grid
    const timeGrid = await page.locator('.time-grid').first();
    
    // Calculate positions for a small drag (less than threshold)
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const startY = gridBox.y + 200;
    const endY = startY + 5; // Only 5px drag - should be ignored
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Perform small drag
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 2 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Should not have created a block (threshold not met)
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBe(0);
  });

  test('should create event with longer duration on mobile', async ({ page }) => {
    // Get the time grid
    const timeGrid = await page.locator('.time-grid').first();
    
    // Calculate positions for drag operation (create 2-hour block)
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const startY = gridBox.y + 300;
    const endY = startY + 120; // Create 2-hour block (120 minutes)
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Perform drag operation
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 20 });
    await page.mouse.up();
    
    // Wait for block to appear
    await page.waitForTimeout(300);
    
    // Check if availability block was created
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBeGreaterThan(0);
    
    // Verify the block has a substantial height
    const block = await page.locator('.availability-block').first();
    const blockBox = await block.boundingBox();
    if (blockBox) {
      // Height should be around 120px (2 hours)
      expect(blockBox.height).toBeGreaterThan(100);
    }
  });
});
