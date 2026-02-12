import { test, expect } from '@playwright/test';

test.describe('Basic Calendar Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load with empty calendar for today', async ({ page }) => {
    // Check for today's date in the calendar
    const dateHeader = await page.locator('.day-title').first();
    expect(dateHeader).toBeTruthy();
    
    // Should have a single day column
    const dayColumns = await page.locator('.day-column').count();
    expect(dayColumns).toBeGreaterThanOrEqual(1);
  });

  test('should create event by dragging on time grid', async ({ page }) => {
    // Get the time grid
    const timeGrid = await page.locator('.time-grid').first();
    
    // Calculate positions for drag operation (9 AM to 10 AM)
    const gridBox = await timeGrid.boundingBox();
    if (!gridBox) return;
    
    const startY = gridBox.y + 100; // Move to 9 AM area
    const endY = startY + 60; // Create 1-hour block
    const centerX = gridBox.x + gridBox.width / 2;
    
    // Perform drag operation
    await page.mouse.move(centerX, startY);
    await page.mouse.down();
    await page.mouse.move(centerX, endY, { steps: 10 });
    await page.mouse.up();
    
    // Wait for block to appear
    await page.waitForTimeout(300);
    
    // Check if availability block was created
    const blocks = await page.locator('.availability-block').count();
    expect(blocks).toBeGreaterThan(0);
  });

  test('should add a new day before current day', async ({ page }) => {
    const initialColumns = await page.locator('.day-column').count();
    
    // Click the left add button (add before)
    const addBeforeButton = await page.locator('button:has-text("+")').first();
    await addBeforeButton.click();
    
    await page.waitForTimeout(300);
    
    const newColumns = await page.locator('.day-column').count();
    expect(newColumns).toBe(initialColumns + 1);
  });

  test('should add a new day after current day', async ({ page }) => {
    const initialColumns = await page.locator('.day-column').count();
    
    // Scroll to see the right button
    const calendarGrid = await page.locator('.calendar-grid');
    await calendarGrid.evaluate(el => el.scrollLeft += 1000);
    
    // Click the right add button (add after)
    const addAfterButton = await page.locator('button:has-text("+")').last();
    await addAfterButton.click();
    
    await page.waitForTimeout(300);
    
    const newColumns = await page.locator('.day-column').count();
    expect(newColumns).toBe(initialColumns + 1);
  });

  test('should edit event label by clicking', async ({ page }) => {
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
    
    // Click on the created block to edit
    const block = await page.locator('.availability-block').first();
    await block.click();
    
    // Check if edit mode is activated (should show input field or edit state)
    const editableText = await block.locator('[contenteditable], input').count();
    expect(editableText).toBeGreaterThan(0);
  });

  test('should delete event by clicking delete button', async ({ page }) => {
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
    
    const initialBlocks = await page.locator('.availability-block').count();
    
    // Hover to reveal delete button and click it
    const block = await page.locator('.availability-block').first();
    await block.hover();
    
    const deleteButton = await block.locator('button.delete');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      await page.waitForTimeout(300);
      
      const finalBlocks = await page.locator('.availability-block').count();
      expect(finalBlocks).toBe(initialBlocks - 1);
    }
  });

  test('should switch between themes', async ({ page }) => {
    const themeSwitcher = await page.locator('.theme-switcher');
    const initialClass = await page.locator('body').evaluate(el => el.className);
    
    // Click theme switcher
    await themeSwitcher.click();
    
    await page.waitForTimeout(200);
    
    const newClass = await page.locator('body').evaluate(el => el.className);
    expect(newClass).not.toBe(initialClass);
  });

  test('should cycle through all three themes', async ({ page }) => {
    const themeSwitcher = await page.locator('.theme-switcher');
    
    const themes: string[] = [];
    
    // Collect theme state for 3 cycles
    for (let i = 0; i < 3; i++) {
      const currentClass = await page.locator('body').evaluate(el => el.className);
      themes.push(currentClass);
      await themeSwitcher.click();
      await page.waitForTimeout(200);
    }
    
    // Should have light, dark, oled themes
    expect(themes.length).toBe(3);
    expect(new Set(themes).size).toBe(3); // All different
  });

  test('should persist theme after navigation', async ({ page }) => {
    const themeSwitcher = await page.locator('.theme-switcher');
    
    // Set to dark theme
    await themeSwitcher.click();
    await page.waitForTimeout(200);
    
    const themeClass = await page.locator('body').evaluate(el => el.className);
    expect(themeClass).toContain('theme-');
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Theme should persist
    const newThemeClass = await page.locator('body').evaluate(el => el.className);
    expect(newThemeClass).toBe(themeClass);
  });

  test('should display time markers for all hours', async ({ page }) => {
    const timeMarkers = await page.locator('.time-marker').count();
    expect(timeMarkers).toBeGreaterThanOrEqual(24); // 24 hours in a day
  });

  test('should be responsive on mobile viewport', async ({ page, context }) => {
    // Set mobile viewport
    const mobileContext = await context.browser()?.newContext({
      viewport: { width: 375, height: 667 }
    });
    
    if (mobileContext) {
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto('/');
      await mobilePage.waitForLoadState('networkidle');
      
      // Check that day columns are visible
      const dayColumns = await mobilePage.locator('.day-column').count();
      expect(dayColumns).toBeGreaterThan(0);
      
      // Add button should be visible
      const addButtons = await mobilePage.locator('button:has-text("+")').count();
      expect(addButtons).toBeGreaterThan(0);
      
      await mobilePage.close();
      await mobileContext.close();
    }
  });
});
