import { test, expect } from '@playwright/test';
import path from 'path';
import LoginPage from '../../../pages/LoginPage';
import ExcelJS from 'exceljs';

const EXPECTED_HEADERS = [
  'Corporate',
  'Name',
  'Email',
  'Mobile No',
];

test.describe('Add Member - Manual flow', () => {
  test.beforeEach(async ({ page }) => {
   
    const loginPage = new LoginPage(page);
    console.log('Logging in...');
    await loginPage.login('9687298058', 'Cure@3210#', 'Admin');
    console.log('Waiting for URL to be **/Admin-page');
    await page.waitForURL('https://staging.corporate.welcomecure.com/admin/admin_user/corporate');
    await page.click("(//img[contains(@alt,'arrow')])[1]");
    await page.click("//a[normalize-space()='Create Member']");
    await expect(page.locator('text=Click to upload the member list file OR drag & drop the file here.')).toBeVisible();
  });

  test('Add member manually - successful addition', async ({ page }) => {
    const iterations = 1; 
    const names = ['Rajesh', 'Samir', 'Charlie', 'Dinesh', 'Esha'];
    const timestamp = Date.now().toString().slice(-5);
    for (let i = 0; i < iterations; i++) {
      if (i > 0) {
        await page.click("//a[normalize-space()='Create Member']");
        await expect(page.locator('text=Click to upload the member list file OR drag & drop the file here.')).toBeVisible();
      }

      await page.click("//button[normalize-space()='Add']");
      // Use a more specific locator for the dropdown inside the "Add Member" modal
      // to avoid strict mode violation.
      await page.locator('div:has-text("Add Member") + div').locator('div.css-19bb58m').first().click();
      await page.getByText('Madan lab', { exact: true }).click();
      const memberNameLocator = page.locator("//input[@id='name']");
      const emailIdLocator = page.locator("//input[@id='email']");
      const contactNoLocator = page.locator("//input[@id='contact']");
      const saveButtonLocator = page.locator("//button[normalize-space()='Save']");
      const newMemberName = `${names[i % names.length]}_${i}`;
      const newEmail = `${names[i % names.length].toLowerCase()}_${timestamp}_${i}@example.com`;
      const newContact = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

      await memberNameLocator.fill(newMemberName);
      await emailIdLocator.fill(newEmail);
      await contactNoLocator.fill(newContact);

      await saveButtonLocator.click();
      const toastLocator = page.locator('.Toastify__toast-body');
      await toastLocator.waitFor({ state: 'visible', timeout: 10000 });
      const toastText = await toastLocator.textContent();
      console.log('Toast message:', toastText);

      const successMessage = "Member is created successfully.";
      await expect(toastLocator).toHaveText(successMessage);

      // Verify the member in the member list
      await page.click("//a[normalize-space()='Member List']");
      const searchInput = page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]");
      await expect(searchInput).toBeVisible();
      await searchInput.fill(newMemberName);
      await page.waitForLoadState('networkidle'); // wait for search
      const memberInList = page.locator(`//body[1]/div[1]/div[1]/div[1]/div[2]/div[3]/div[1]/div[2]/table[1]/tbody[1]/tr[2]/td[2]/div[1]`);
      await expect(memberInList).toBeVisible();
     
        test.info().annotations.push({
        type: 'test-case-outcome',
        description: `Iteration ${i + 1}: Member is created successfully and verified in the list.`,
      });
    }
  });

  test('Add member manually - all fields duplicate', async ({ page }) => {
    await page.click("//button[normalize-space()='Add']");
    // Use a more specific locator for the dropdown inside the "Add Member" modal
    await page.locator('div:has-text("Add Member") + div').locator('div.css-19bb58m').first().click();
    await page.getByText('Madan lab', { exact: true }).click();

    const memberNameLocator = page.locator("//input[@id='name']");
    const emailIdLocator = page.locator("//input[@id='email']");
    const contactNoLocator = page.locator("//input[@id='contact']");
    const saveButtonLocator = page.locator("//button[normalize-space()='Save']");

    await memberNameLocator.fill('Rajesh'); // Duplicate name
    await emailIdLocator.fill('abc@yopmail.com'); // Duplicate email
    await contactNoLocator.fill('9988776655'); // Duplicate mobile

    await saveButtonLocator.click();
    // The form does not hide on duplicate, messages appear in Toastify
    await page.waitForTimeout(2000);
    const duplicateEmailMessage = "A email id already exists.";
    const duplicateMobileMessage = "A mobile number already exists.";
    const duplicateNameMessage = "A name already exists."; 

    const duplicateEmailLocator = page.locator(`.Toastify__toast-body:has-text("${duplicateEmailMessage}")`);
    const duplicateMobileLocator = page.locator(`.Toastify__toast-body:has-text("${duplicateMobileMessage}")`);
    const duplicateNameLocator = page.locator(`.Toastify__toast-body:has-text("${duplicateNameMessage}")`);

    await expect(duplicateEmailLocator.or(duplicateMobileLocator).or(duplicateNameLocator)).toBeVisible();

    test.info().annotations.push({
      type: 'test-case-outcome',
      description: 'All duplicate fields detected.',
    });
  });
});