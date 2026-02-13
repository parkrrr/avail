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
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Create first event at 9 AM (540 minutes)
    await page.mouse.click(centerX, gridBox.y + 540);
    await page.waitForTimeout(200);
    
    // Create second event at 10 AM (600 minutes)
    await page.mouse.click(centerX, gridBox.y + 600);
    await page.waitForTimeout(200);
    
    // Find the first event's bottom resize handle
    const firstBlock = await page.locator('.availability-block').first();
    const bottomHandle = await firstBlock.locator('.resize-handle-bottom');
    const handleBox = await bottomHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find resize handle');
    
    // Try to drag down 60 pixels (would normally extend to 10:15 AM)
    // But should stop at 10:00 AM where next event starts
    const startY = handleBox.y + handleBox.height / 2;
    const endY = startY + 60;
    const handleX = handleBox.x + handleBox.width / 2;
    
    await page.mouse.move(handleX, startY);
    await page.mouse.down();
    await page.mouse.move(handleX, endY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Verify first event stopped at 10:00 AM (abutting, not overlapping)
    const firstEventText = await firstBlock.locator('.block-time').textContent();
    expect(firstEventText).toContain('9:00 AM');
    expect(firstEventText).toContain('10:00 AM');
    
    // Verify second event is still at 10:00 AM
    const secondBlock = await page.locator('.availability-block').nth(1);
    const secondEventText = await secondBlock.locator('.block-time').textContent();
    expect(secondEventText).toContain('10:00 AM');
  });

  test('should prevent top handle from overlapping previous event', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Create first event at 9 AM (540 minutes)
    await page.mouse.click(centerX, gridBox.y + 540);
    await page.waitForTimeout(200);
    
    // Resize it to end at 10 AM
    const firstBlock = await page.locator('.availability-block').first();
    let bottomHandle = await firstBlock.locator('.resize-handle-bottom');
    let handleBox = await bottomHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find resize handle');
    
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 45, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    
    // Create second event at 11 AM (660 minutes)
    await page.mouse.click(centerX, gridBox.y + 660);
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
    
    // Verify second event cannot go earlier than 10:00 AM
    const secondEventText = await secondBlock.locator('.block-time').textContent();
    expect(secondEventText).toContain('10:00 AM');
    
    // The start time should be 10:00 AM (abutting first event)
    // and it shouldn't have moved earlier than that
    const parts = secondEventText!.split(' - ');
    expect(parts[0]).toContain('10:00 AM');
  });

  test('should allow events to abut without gaps', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) throw new Error('Could not get grid bounding box');
    
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Create event at 2 PM
    await page.mouse.click(centerX, gridBox.y + 840);
    await page.waitForTimeout(200);
    
    // Create event at 4 PM
    await page.mouse.click(centerX, gridBox.y + 960);
    await page.waitForTimeout(200);
    
    // Resize first event to touch second event
    const firstBlock = await page.locator('.availability-block').first();
    const bottomHandle = await firstBlock.locator('.resize-handle-bottom');
    const handleBox = await bottomHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find resize handle');
    
    // Drag down to 4 PM (120 minutes down)
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 120, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // Verify first event ends at 4 PM
    const firstEventText = await firstBlock.locator('.block-time').textContent();
    expect(firstEventText).toContain('2:00 PM');
    expect(firstEventText).toContain('4:00 PM');
    
    // Verify second event starts at 4 PM (no gap)
    const secondBlock = await page.locator('.availability-block').nth(1);
    const secondEventText = await secondBlock.locator('.block-time').textContent();
    expect(secondEventText).toContain('4:00 PM');
  });
});
