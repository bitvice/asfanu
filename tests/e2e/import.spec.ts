import { test, expect } from '@playwright/test';

test.describe('Excel Import Wizard Flow', () => {
  test('should display import wizard step 1 file selector', async ({ page }) => {
    await page.goto('/imports/new');
    await expect(page.getByText('1. Selectare Fișier Excel')).toBeVisible();
    await expect(page.getByText('Incarcă Fișierul Excel cu Înregistrări')).toBeVisible();
  });
});
