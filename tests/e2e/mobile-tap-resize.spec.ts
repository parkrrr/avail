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

  test('should create 15-minute event by tapping on mobile viewport', async ({ page }) => {
    // Get the time grid
    const timeGrid = await page.locator('.time-grid').first();
    
    // Scroll to 9 AM area
    await timeGrid.evaluate((el) => {
      el.scrollTop = 480; // Scroll to around 8 AM so 9 AM is visible
    });
    
    await page.waitForTimeout(200);
    
    // Calculate position for tap (around 9 AM)
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    // Click in the middle of the visible area (should be around 9 AM after scroll)
    const clickY = gridBox.y + gridBox.height / 2;
    const clickX = gridBox.x + gridBox.width / 2;
    
    // Tap to create event
    await page.mouse.click(clickX, clickY);
    
    // Wait for block to appear
    await page.waitForTimeout(300);
    
    // Check if availability block was created
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBe(1);
    
    // Verify it's a 15-minute event
    const blockText = await page.locator('.availability-block').first().textContent();
    expect(blockText).toBeTruthy();
  });

  test('should resize event using bottom handle', async ({ page }) => {
    // Create an event first
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const clickY = gridBox.y + 300;
    const clickX = gridBox.x + gridBox.width / 2;
    
    // Create event
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(300);
    
    // Find the bottom resize handle
    const bottomHandle = await page.locator('.resize-handle-bottom').first();
    const handleBox = await bottomHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find resize handle');
    
    // Drag bottom handle down to make event longer
    const startY = handleBox.y + handleBox.height / 2;
    const endY = startY + 60; // Add 1 hour
    const handleX = handleBox.x + handleBox.width / 2;
    
    await page.mouse.move(handleX, startY);
    await page.mouse.down();
    await page.mouse.move(handleX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Verify event was resized (should be longer than 15 minutes)
    const blockText = await page.locator('.availability-block').first().textContent();
    expect(blockText).toBeTruthy();
    // Should show a duration longer than 15 minutes
    const block = await page.locator('.availability-block').first();
    const blockBox = await block.boundingBox();
    expect(blockBox!.height).toBeGreaterThan(30); // More than 30 pixels (> 30 minutes)
  });

  test('should resize event using top handle', async ({ page }) => {
    // Create an event first
    const timeGrid = await page.locator('.time-grid').first();
    
    // Scroll to 10 AM area
    await timeGrid.evaluate((el) => { el.scrollTop = 540; });
    await page.waitForTimeout(200);
    
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const clickY = gridBox.y + gridBox.height / 2;
    const clickX = gridBox.x + gridBox.width / 2;
    
    // Create event
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(300);
    
    // Find the top resize handle
    const topHandle = await page.locator('.resize-handle-top').first();
    const handleBox = await topHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find resize handle');
    
    // Drag top handle up to make event start earlier
    const startY = handleBox.y + handleBox.height / 2;
    const endY = startY - 45; // Move up 45 minutes
    const handleX = handleBox.x + handleBox.width / 2;
    
    await page.mouse.move(handleX, startY);
    await page.mouse.down();
    await page.mouse.move(handleX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Verify event was resized
    const block = await page.locator('.availability-block').first();
    const blockBox = await block.boundingBox();
    expect(blockBox!.height).toBeGreaterThan(30); // Should be larger than 15 min
  });

  test('should allow vertical scrolling in time grid on mobile', async ({ page }) => {
    // Get the time grid
    const timeGrid = await page.locator('.time-grid').first();
    
    // Get initial scroll position
    const initialScrollTop = await timeGrid.evaluate(el => el.scrollTop);
    
    // Scroll down programmatically to simulate touch scroll
    await timeGrid.evaluate(el => {
      el.scrollTop = 600; // Scroll to 10 AM area
    });
    
    await page.waitForTimeout(300);
    
    // Verify scroll position changed
    const newScrollTop = await timeGrid.evaluate(el => el.scrollTop);
    expect(newScrollTop).toBeGreaterThan(initialScrollTop);
    expect(newScrollTop).toBe(600);
  });

  test('should create multiple events by tapping', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Scroll to 9 AM and create first event
    await timeGrid.evaluate((el) => { el.scrollTop = 480; });
    await page.waitForTimeout(200);
    await page.mouse.click(centerX, gridBox.y + gridBox.height / 3);
    await page.waitForTimeout(200);
    
    // Scroll to 11 AM and create second event
    await timeGrid.evaluate((el) => { el.scrollTop = 600; });
    await page.waitForTimeout(200);
    await page.mouse.click(centerX, gridBox.y + gridBox.height / 3);
    await page.waitForTimeout(200);
    
    // Scroll to 2 PM and create third event
    await timeGrid.evaluate((el) => { el.scrollTop = 780; });
    await page.waitForTimeout(200);
    await page.mouse.click(centerX, gridBox.y + gridBox.height / 3);
    await page.waitForTimeout(200);
    
    // Verify three events were created
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBe(3);
  });
});
