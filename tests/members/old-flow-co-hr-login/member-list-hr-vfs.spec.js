import { test, expect } from '@playwright/test';
import path from 'path';
import LoginPage from '../../../pages/LoginPage';
import ExcelJS from 'exceljs';

test.describe('HR- Add Member - File Upload Module', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log('Logging in...');
    await loginPage.login('4242425656', 'Test@1234', 'HR');
    console.log('Waiting for URL to be **/HR-page');
    await page.waitForURL('https://staging.corporate.welcomecure.com/hr/uploademployee');
    console.log('URL matched.');
    await page.waitForLoadState('networkidle');

    // Navigate to Member List page
    await page.getByRole('link', { name: 'Member List' }).click();
    await page.waitForURL('https://staging.corporate.welcomecure.com/hr/employee');
  });

  test('Verify Email action button opens action menu', async ({ page }) => {
    const actionBtn = page.locator("//tbody/tr[1]/td[5]/div[1]/div[1]/span[1]//*[name()='svg']");
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();
    await page.waitForTimeout(3000);
    //await expect(page.locator('body')).toContainText('Email');
  });

  test('Verify Delete action button is clickable', async ({ page }) => {
    const actionBtn = page.locator("(//*[name()='svg'][contains(@stroke,'currentColor')])[7]");
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();
    await page.waitForTimeout(3000);
  });

  test('HR- Add Family member - successful addition', async ({ page }) => {
    const membersData = [
      { relation: 'Husband', age: '35' },
      { relation: 'Mother', age: '50' },
      { relation: 'Grandmother', age: '67' },
      { relation: 'Father', age: '60' },
      { relation: 'Daughter', age: '10' }, 
    ];

    for (const member of membersData) {
      const timestamp = Date.now().toString().slice(-5);
      const newMemberName = `Test_${member.relation}_${timestamp}`;
      const newEmail = `test_${member.relation}_${timestamp}@example.com`;
      const newContact = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

      // Click the button to open the add family member form
      await page.locator('//tbody/tr[10]/td[4]/span[1]').click(); // add here member xpath

      // Fill out the new member form
      await page.locator('.css-19bb58m').first().click();
      await page.waitForTimeout(1000); // Add a small delay
      await page.getByText(member.relation, { exact: true }).click();

      await page.locator("//input[contains(@placeholder,'Enter Name')]").fill(newMemberName);
      await page.locator("(//input[@placeholder='Enter Age'])[1]").fill(member.age);
      await page.locator("(//input[@id='email'])[1]").fill(newEmail);
      await page.locator("(//input[@id='contact'])[1]").fill(newContact);

      // Save the new member
      await page.locator("(//button[normalize-space()='Save'])[1]").click();

      // Verify the success/error toast message
      const toastLocator = page.locator('.Toastify__toast-body');
      await toastLocator.waitFor({ state: 'visible', timeout: 10000 }); // Explicitly wait for visibility
      const toastText = await toastLocator.textContent(); // Get text content
      console.log('Toast message:', toastText); // Log the captured text
      if (membersData.indexOf(member) < 4) { // For the first 4 members
        expect(toastText).toContain("Family member has been created successfully."); // Assert on captured text
        await toastLocator.waitFor({ state: 'hidden', timeout: 5000 }); // Only hide if successful
      } else { // For the 5th member and beyond
        expect(toastText).toContain("You could only add four family members."); // Assert on captured text
        // The error toast might persist, so no waitFor hidden here
      }

          
    }
  });
});
