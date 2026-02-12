import { test, expect } from '@playwright/test';

test.describe('Scroll vs Drag Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should not create event when scrolling vertically', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const centerX = gridBox.x + gridBox.width / 2;
    const startY = gridBox.y + 100;
    
    // Initial block count
    const initialBlocks = await page.locator('.availability-block').count();
    
    // Perform a short vertical movement (simulating scroll/swipe)
    // Move only 5px - below the drag threshold
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, startY + 5);
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // No block should be created
    const finalBlocks = await page.locator('.availability-block').count();
    expect(finalBlocks).toBe(initialBlocks);
  });

  test('should create event when dragging vertically beyond threshold', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const centerX = gridBox.x + gridBox.width / 2;
    const startY = gridBox.y + 100;
    
    // Initial block count
    const initialBlocks = await page.locator('.availability-block').count();
    
    // Perform a deliberate drag (beyond threshold, creating at least 15 minutes)
    // Move 60px+ to exceed threshold and create a valid event
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, startY + 60, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // A block should be created
    const finalBlocks = await page.locator('.availability-block').count();
    expect(finalBlocks).toBe(initialBlocks + 1);
  });

  test('should not create event when horizontal movement exceeds vertical', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const centerX = gridBox.x + gridBox.width / 2;
    const startY = gridBox.y + 100;
    
    // Initial block count
    const initialBlocks = await page.locator('.availability-block').count();
    
    // Perform mostly horizontal movement (simulating horizontal scroll)
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX + 50, startY + 5);
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // No block should be created
    const finalBlocks = await page.locator('.availability-block').count();
    expect(finalBlocks).toBe(initialBlocks);
  });

  test('should create event with minimum duration when dragging', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const centerX = gridBox.x + gridBox.width / 2;
    const startY = gridBox.y + 100;
    
    // Drag 15 pixels (exceeds 8px threshold, creates minimum 15-minute event)
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, startY + 15, { steps: 5 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // A block should be created
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBeGreaterThan(0);
  });

  test('should create event when dragging with slight horizontal variance', async ({ page }) => {
    const timeGrid = await page.locator('.time-grid').first();
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const centerX = gridBox.x + gridBox.width / 2;
    const startY = gridBox.y + 100;
    
    // Initial block count
    const initialBlocks = await page.locator('.availability-block').count();
    
    // Drag mostly vertically but with some horizontal movement
    // Vertical: 60px, Horizontal: 20px (ratio 3:1, exceeds 1.5x threshold)
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX + 20, startY + 60, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(300);
    
    // A block should be created despite horizontal movement
    const finalBlocks = await page.locator('.availability-block').count();
    expect(finalBlocks).toBe(initialBlocks + 1);
  });
});
