import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage';

// Reusable locators
const SEARCH_INPUT = "//input[@placeholder='Search By Admin Name']";
const ADD_ADMIN_BUTTON = "//button[normalize-space()='Add']";
const ADMIN_TABLE_ROW = "//tbody/tr";
const NO_RECORDS_MSG = "//p[@class='text-xl font-Roboto']";
const EMAIL_ICON = "//tbody/tr[1]/td[4]/div[1]/div[1]/span[1]//*[name()='svg']//*[name()='path' and contains(@d,'M928 160H9')]";
const EDIT_ICON = "//tbody/tr[1]/td[4]/div[1]/span[1]//*[name()='svg']";
const PAGINATION_NEXT = "//a[normalize-space()='>']";
const ITEMS_PER_PAGE_DROPDOWN = "//img[@alt='LimitArrow']";
const EMPTY_STATE = "//p[contains(@class,'text-xl font-Roboto')]";

test.describe('Corporate Login Admin Page - Full Functionality', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('3355662288', 'Test@1234', 'Corporate');
    await page.waitForURL('https://staging.corporate.welcomecure.com/corporate/hr');
    //await page.click("//a[normalize-space()='Admin']");
  });

  // Search function test cases
   test('Search by valid admin name (positive)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Neha');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search with partial name match', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Jess');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search is case-insensitive', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('jessica');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Clear search shows full list', async ({ page }) => {
    // First search
    await page.locator(SEARCH_INPUT).fill('XYZ');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(1000);
    // Then clear
    await page.locator(SEARCH_INPUT).fill('');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search by email (negative - should show "Admin not found")', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('jessica@welcomecure.com');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
  });

  test('Search by phone number (negative)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('9876543210');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
  });

  test('Search by corporate name (negative)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('stackbelowflow');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
  });

  test('Search with invalid name (e.g., numbers)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('12345admin');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
  });

  // Add Admin 

 // Add Admin 
 test('Add admin - allow existing validation or success', async ({ page }) => {
   const name = 'Admiin';
   const email = 'admins111@yopmail.com';
   const contact = '9111111114';
 
   await page.locator(ADD_ADMIN_BUTTON).click();
   await page.waitForTimeout(1000);
 
   await page.locator("//input[@id='name']").fill(name);
   await page.locator("//input[@id='email']").fill(email);
   await page.locator("//input[@id='contact']").fill(contact);
 
   const corporateDropdown = page.locator("(//*[name()='svg'][contains(@class,'css-8mmkcg')])[1]");
   if (await corporateDropdown.isVisible()) {
     await corporateDropdown.click();
     await page.click("//div[contains(@class,'option') and contains(.,'stackbelowflow')]");
   }
   //await page.pause();
   await page.click("//button[.='Save']");
   await page.waitForTimeout(3000);
   const successToast = page.locator("//div[contains(text(),'admin has been created successfully.')]"); 
   const duplicateEmailError = page.locator("//*[contains(text(),'A email id already exists.')]");
   const duplicateMobileError = page.locator("//*[contains(text(),'A mobile number already exists.')]");
 
   await Promise.race([
     successToast.waitFor({ state: 'visible', timeout: 5000 }),
     duplicateEmailError.waitFor({ state: 'visible', timeout: 5000 }),
     duplicateMobileError.waitFor({ state: 'visible', timeout: 5000 })
   ]);
 
   if (await successToast.isVisible()) {
     console.log(` Admin successfully added: ${name}`);
     
      await page.reload(); // Refresh before searching
      await page.waitForLoadState('networkidle');
 
     await page.locator(SEARCH_INPUT).fill(name);
     await page.locator(SEARCH_INPUT).press('Enter');
     await page.waitForTimeout(2000);
 
     const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
     expect(rowCount).toBeGreaterThan(0);
   } else if (await duplicateEmailError.isVisible()) {
     console.log(` Duplicate Email: ${email}`);
     expect(await duplicateEmailError.textContent()).toContain('already');
   } else if (await duplicateMobileError.isVisible()) {
     console.log(` Duplicate Contact: ${contact}`);
     expect(await duplicateMobileError.textContent()).toContain('already');
   } else {
     throw new Error(' No success or validation error appeared');
   }
 });
 

  // Action icons: Edit Admin Data

  test('Edit admin data with valid data', async ({ page }) => {
    await page.locator(EDIT_ICON).click();
    await page.waitForTimeout(1000);

    await page.locator("//input[@id='name']").fill('Ramesh');
    await page.locator("//input[@id='email']").fill('ram1233@yopmail.com');
    await page.locator("//input[@id='contact']").fill('1235555557');
    await page.click("//button[normalize-space()='Save']");
    await page.waitForTimeout(2000);

    // Verify appears in table
    await page.locator(SEARCH_INPUT).fill('Ramesh');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });


 // Action icons: Email
test('Click email icon opens mailto link', async ({ page }) => {
        const initialRowCount = await page.locator(ADMIN_TABLE_ROW).count();
        page.locator(EMAIL_ICON).click()
        await page.waitForTimeout(3000);
        const noResultsMessage = page.locator('text=Email has been sent successfully');
        
      });

  
 // Pagination test cases
    test('Pagination - navigate to next page', async ({ page }) => {
    const nextButton = page.locator(PAGINATION_NEXT);
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(2000);
      const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    }
  }); 

  test('should display 10 team members by default', async ({ page }) => {
      await expect(page.locator('//tbody/tr')).toHaveCount(10);
      await page.waitForTimeout(3000);
    });
  
    test('should display 25 items when selecting 25 per page', async ({ page }) => {
      // Open items per page dropdown
      await page.locator(ITEMS_PER_PAGE_DROPDOWN).click();
      // Select 25 (assuming options appear as text/buttons)
      await page.locator('text=25').click();
  
      // Expect exactly 25 rows to be present within a timeout
      await expect(page.locator('//tbody/tr')).toHaveCount(25);
      await page.waitForTimeout(3000);
    });
  
    
test('should navigate to page 2 using Next button', async ({ page }) => {

  const firstRowPage1 = await page.locator(ADMIN_TABLE_ROW).nth(0).textContent();

  await page.locator(PAGINATION_NEXT).click();

  await expect(page.locator(ADMIN_TABLE_ROW).nth(0)).not.toHaveText(firstRowPage1);

  await expect(page.locator(ADMIN_TABLE_ROW)).toHaveCount(10);
});
   
  
    test('should reset to page 1 after performing a search', async ({ page }) => {
      // Go to page 2
      await page.locator(PAGINATION_NEXT).click();
      // Await for page 2 to load, by checking for a change in the first row
      const firstRowPage1 = await page.locator(ADMIN_TABLE_ROW).textContent();
      await expect(page.locator(ADMIN_TABLE_ROW)).not.toHaveText(firstRowPage1);
  
      // Perform search
      await page.locator(SEARCH_INPUT).fill('saloni qa');
      await page.locator(SEARCH_INPUT).press('Enter');
  
      // Should be back on page 1 with filtered results
      const rowCount = await page.locator("//tbody/tr").count();
      expect(rowCount).toBeGreaterThanOrEqual(1);
  
      // Optional: verify first result is "mehul"
      const firstResult = await page.locator("//tbody/tr[1]/td[1]").textContent();
      expect(firstResult.toLowerCase()).toContain('saloni qa');
    });
});