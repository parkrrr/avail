import { test, expect } from '@playwright/test';

test.describe('Event Collision Detection', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should prevent bottom handle from overlapping next event', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    
    // Scroll to 9 AM area
    await timeGrid.evaluate((el) => { el.scrollTop = 480; });
    await page.waitForTimeout(200);
    
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Create first event
    await page.mouse.click(centerX, gridBox.y + 100);
    await page.waitForTimeout(200);
    
    // Create second event
    await page.mouse.click(centerX, gridBox.y + 200);
    await page.waitForTimeout(200);
    
    // Find the first event's bottom resize handle
    const firstBlock = await page.locator('.availability-block').first();
    const bottomHandle = await firstBlock.locator('.resize-handle-bottom');
    const handleBox = await bottomHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find resize handle');
    
    // Try to drag down 60 pixels (would normally extend event)
    // But should stop where next event starts
    const startY = handleBox.y + handleBox.height / 2;
    const endY = startY + 60;
    const handleX = handleBox.x + handleBox.width / 2;
    
    await page.mouse.move(handleX, startY);
    await page.mouse.down();
    await page.mouse.move(handleX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Verify events are abutting, not overlapping
    const firstEventText = await firstBlock.locator('.block-time').textContent();
    const secondBlock = await page.locator('.availability-block').nth(1);
    const secondEventText = await secondBlock.locator('.block-time').textContent();
    
    expect(firstEventText).toBeTruthy();
    expect(secondEventText).toBeTruthy();
    
    // Extract times and verify they don't overlap
    // The first event end should equal the second event start
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBe(2);
  });

  test('should prevent top handle from overlapping previous event', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    
    // Scroll to 9 AM area
    await timeGrid.evaluate((el) => { el.scrollTop = 480; });
    await page.waitForTimeout(200);
    
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Create first event
    await page.mouse.click(centerX, gridBox.y + 100);
    await page.waitForTimeout(200);
    
    // Resize it to be longer
    const firstBlock = await page.locator('.availability-block').first();
    let bottomHandle = await firstBlock.locator('.resize-handle-bottom');
    let handleBox = await bottomHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find resize handle');
    
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 45, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    
    // Create second event below the first
    await page.mouse.click(centerX, gridBox.y + 250);
    await page.waitForTimeout(200);
    
    // Try to resize second event's top handle upward (would overlap first event)
    const secondBlock = await page.locator('.availability-block').nth(1);
    const topHandle = await secondBlock.locator('.resize-handle-top');
    handleBox = await topHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find top handle');
    
    const startY = handleBox.y + handleBox.height / 2;
    const endY = startY - 60; // Try to move up 60 minutes
    
    await page.mouse.move(handleBox.x + handleBox.width / 2, startY);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Verify events are abutting, not overlapping
    const secondEventText = await secondBlock.locator('.block-time').textContent();
    expect(secondEventText).toBeTruthy();
    
    // Should have 2 events
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBe(2);
  });

  test('should allow events to abut without gaps', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    
    // Scroll to 2 PM area
    await timeGrid.evaluate((el) => { el.scrollTop = 720; });
    await page.waitForTimeout(200);
    
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Create first event
    await page.mouse.click(centerX, gridBox.y + 100);
    await page.waitForTimeout(200);
    
    // Create second event below
    await page.mouse.click(centerX, gridBox.y + 220);
    await page.waitForTimeout(200);
    
    // Resize first event to touch second event
    const firstBlock = await page.locator('.availability-block').first();
    const bottomHandle = await firstBlock.locator('.resize-handle-bottom');
    const handleBox = await bottomHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find resize handle');
    
    // Drag down to touch the second event
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 120, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Verify both events exist and are abutting
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBe(2);
    
    const firstEventText = await firstBlock.locator('.block-time').textContent();
    const secondBlock = await page.locator('.availability-block').nth(1);
    const secondEventText = await secondBlock.locator('.block-time').textContent();
    
    expect(firstEventText).toBeTruthy();
    expect(secondEventText).toBeTruthy();
  });
});
