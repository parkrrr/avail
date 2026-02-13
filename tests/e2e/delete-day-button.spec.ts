import { test, expect } from '@playwright/test';

test.describe('Delete Day Button Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should hide delete button when only 1 day exists', async ({ page }) => {
    // Should start with 1 day column
    const dayColumns = await page.locator('.day-column').count();
    expect(dayColumns).toBe(1);
    
    // Delete button should NOT be visible when there's only 1 day
    const deleteButtons = await page.locator('.remove-day-btn').count();
    expect(deleteButtons).toBe(0);
  });

  test('should show delete button when 2 or more days exist', async ({ page }) => {
    // Add a second day
    const addAfterButton = await page.locator('button:has-text("+")').last();
    await addAfterButton.click();
    await page.waitForTimeout(300);
    
    // Should have 2 days now
    const dayColumns = await page.locator('.day-column').count();
    expect(dayColumns).toBe(2);
    
    // Delete buttons should be visible on both days
    const deleteButtons = await page.locator('.remove-day-btn').count();
    expect(deleteButtons).toBe(2);
  });

  test('should hide delete button again after deleting down to 1 day', async ({ page }) => {
    // Add a second day
    const addAfterButton = await page.locator('button:has-text("+")').last();
    await addAfterButton.click();
    await page.waitForTimeout(300);
    
    // Verify 2 days and 2 delete buttons
    let dayColumns = await page.locator('.day-column').count();
    expect(dayColumns).toBe(2);
    let deleteButtons = await page.locator('.remove-day-btn').count();
    expect(deleteButtons).toBe(2);
    
    // Delete one day
    const firstDeleteButton = await page.locator('.remove-day-btn').first();
    await firstDeleteButton.click();
    await page.waitForTimeout(300);
    
    // Should now have 1 day and no delete buttons
    dayColumns = await page.locator('.day-column').count();
    expect(dayColumns).toBe(1);
    deleteButtons = await page.locator('.remove-day-btn').count();
    expect(deleteButtons).toBe(0);
  });

  test('should show delete buttons for all days when 3 days exist', async ({ page }) => {
    // Add two more days
    const addAfterButton = await page.locator('button:has-text("+")').last();
    await addAfterButton.click();
    await page.waitForTimeout(300);
    await addAfterButton.click();
    await page.waitForTimeout(300);
    
    // Should have 3 days
    const dayColumns = await page.locator('.day-column').count();
    expect(dayColumns).toBe(3);
    
    // All 3 days should have delete buttons
    const deleteButtons = await page.locator('.remove-day-btn').count();
    expect(deleteButtons).toBe(3);
  });
});
