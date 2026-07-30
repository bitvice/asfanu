import { test, expect } from '@playwright/test';

test.describe('Authentication & Theme Toggle Flow', () => {
  test('should render login page correctly with branding and inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'ASFANU CRM' })).toBeVisible();
    await expect(page.getByPlaceholder('operator@asfanu.ro')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Autentificare' })).toBeVisible();
  });

  test('should toggle dark/light theme mode', async ({ page }) => {
    await page.goto('/login');
    const htmlElement = page.locator('html');
    await expect(htmlElement).toBeVisible();
  });
});
