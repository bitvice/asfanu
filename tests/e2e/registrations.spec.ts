import { test, expect } from '@playwright/test';

test.describe('Registrations Directory & Filters Flow', () => {
  test('should render registrations page with header and filters', async ({ page }) => {
    await page.goto('/registrations');
    await expect(page.getByText('Registru Înregistrări Familii')).toBeVisible();
    await expect(page.getByPlaceholder(/Căutare după nume/i)).toBeVisible();
  });
});
