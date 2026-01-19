import { test, expect } from '@playwright/test';
import path from 'path';
import LoginPage from '../../../pages/LoginPage';

test.describe('Member List Page Actions', () => {
 test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('8978989789', 'Test@1234', 'Corporate'); // onvasco vfs


  // Navigate to Member List page
  await page.click("//img[@alt='arrow']");
  await page.click("//a[normalize-space()='Member List']");
  await page.waitForURL('**/vfs/memberlist');

  // Validate page is loaded by checking total member count
  await expect(page.locator("//p[@class='text-sm font-semibold']")).toBeVisible({ timeout: 10000 });
});

test('Verify Email action button opens action menu', async ({ page }) => {
    const actionBtn = page.locator("//tbody/tr[1]/td[5]/div[1]/span[1]//*[name()='svg']//*[name()='path' and contains(@d,'M928 160H9')]");
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();
    // Verify that some action menu/email option appears
    await expect(page.locator('body')).toContainText('Email');
  });
    
test('Add and clear branch filter', async ({ page }) => {
  // Open filter panel
  await page.click("//button[normalize-space()='Filters']");

  // Wait for panel to show
  await page.waitForSelector("//div[contains(@class,'overflow-y-auto')]");

  // Open branch dropdown (click the wrapper div instead of just SVG)
  const branchDropdown = page.locator("(//*[name()='svg'][contains(@class,'css-8mmkcg')])[1]");
  await branchDropdown.click();
  // Select branch (Vfs-ahemdabad)
  const vfsAhemdabadOption = page.locator('#react-select-3-option-0').getByText('Vfs-ahemdabad');
  await vfsAhemdabadOption.waitFor({ state: 'visible', timeout: 10000 });
  await vfsAhemdabadOption.click();

  // Now Apply Filters should be enabled
  const applyBtn = page.locator("//button[normalize-space()='Apply Filters']");
  await applyBtn.waitFor({ state: 'visible', timeout: 10000 });
  await applyBtn.click();

  // Verify data is filtered
  await expect(page.locator("(//span[contains(text(),'Vfs-ahemdabad')])[1]")).toBeVisible();

  // Clear filter
  const clearBtn = page.getByRole('button', { name: 'new Clear Filter' });
  await clearBtn.waitFor({ state: 'visible', timeout: 30000 });
  await clearBtn.click();

  // Ensure filtered data disappears
 // await expect(page.locator("(//span[contains(text(),'Vfs-ahemdabad')])[1]")).toHaveCount(0);
});


  /*test('Total member count updates after adding a new member', async ({ page }) => {
    console.log('Starting test: Total member count updates after adding a new member');
    // Capture current member count
    const countLocator = page.locator("//p[@class='text-sm font-semibold']");
    const beforeText = await countLocator.innerText(); // e.g. "Total Member: 11416"
    const beforeCount = parseInt(beforeText.replace(/\D/g, ''), 10);
    console.log(`Before count: ${beforeCount}`);

    // Navigate to Create Member and upload a valid file
    console.log('Clicking arrow to open menu');
    await page.click("//img[@alt='arrow']");
    console.log('Menu open, page content:', await page.content());
    await page.waitForSelector("//a[normalize-space()='Create Member']", { state: 'visible', timeout: 5000 });
    console.log('Create member link is visible');
    await page.click("//a[normalize-space()='Create Member']");
    console.log('Clicked create member link');
    const filePath = path.resolve('tests/fixtures/sample-members/valid_members.xlsx');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.click('button:has-text("Validate")');
    await page.click('button:has-text("Upload")');
    await expect(page.locator("//div[contains(text(),'Member data has been added successfully.')]")).toBeVisible();

    // Go back to Member List page
    await page.click("//img[@alt='arrow']");
    await page.click("//a[normalize-space()='Member List']");
    await page.waitForTimeout(2000);

    // Capture new count
    const afterText = await countLocator.innerText();
    const afterCount = parseInt(afterText.replace(/\D/g, ''), 10);
    console.log(`After count: ${afterCount}`);

    expect(afterCount).toBeGreaterThan(beforeCount);
  });*/
});
