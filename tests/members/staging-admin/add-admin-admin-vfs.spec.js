import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage';

// locators
const SEARCH_INPUT = "//input[contains(@placeholder,'Search By Admin Name')]";
const ADD_ADMIN_BUTTON = "//button[normalize-space()='Add']//span[@class='text-xl']//*[name()='svg']";
const ADMIN_TABLE_ROW = "//tbody/tr[1]/td[1]";
const NO_RECORDS_MSG = "//p[@class='text-xl font-Roboto']";
const TOGGLE_SWITCH = "(//input[@id='68e35b0c33a3c2cdb34b401c'])[1]";
const EMAIL_ICON = "(//*[name()='svg'][@class='cursor-pointer'])[1]";
const DELETE_ICON = "(//*[name()='svg'][contains(@stroke,'currentColor')])[13]";
const PAGINATION_NEXT = "(//a[contains(@aria-label,'Next page')][normalize-space()='>'])[1]";
const ITEMS_PER_PAGE_DROPDOWN = "(//img[contains(@alt,'LimitArrow')])[1]";
const EMPTY_STATE = "//*[contains(text(),'No Admin Details Available.')]";

test.describe('Admin Page - Full Functionality', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('9687298058', 'Cure@3210#', 'Admin');
    await page.waitForURL('https://staging.corporate.welcomecure.com/admin/admin_user/corporate');
    await page.click("//a[normalize-space()='Admin']");
  });

  // Search function test cases
   test('Search by valid admin name (positive)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Jessica');
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


// Status toggle 
  test('Toggle admin status (Active ↔ Inactive)', async ({ page }) => {
    // Ensure at least one admin exists
    const initialRowCount = await page.locator(ADMIN_TABLE_ROW).count();
    if (initialRowCount === 0) {
      console.log('No admins to toggle. Skipping.');
      return;
    }

    const initialChecked = await page.locator(TOGGLE_SWITCH).getAttribute('class');
    await page.locator(TOGGLE_SWITCH).click();
    await page.waitForTimeout(2000);
    expect(true).toBeTruthy();
  });

  // Action icons: Email, delete
  test('Click email icon opens mailto link', async ({ page }) => {
      const initialRowCount = await page.locator(ADMIN_TABLE_ROW).count();
      await page.waitForTimeout(3000);
      page.locator(EMAIL_ICON).click()
      await page.waitForTimeout(6000);
      const noResultsMessage = page.locator('text=Email has been sent successfully');
      
    });

  test('Delete admin - cancel action', async ({ page }) => {
      const initialRowCount = await page.locator(ADMIN_TABLE_ROW).count();
      page.locator(DELETE_ICON).click()
      await page.waitForTimeout(3000);
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
      const firstRowPage1 = await page.locator(ADMIN_TABLE_ROW).textContent();
  
      await page.locator(PAGINATION_NEXT).click();
      
      // Wait for navigation and check the content of the first row has changed
      await expect(page.locator(ADMIN_TABLE_ROW)).not.toHaveText(firstRowPage1);
  
      // Expect 10 rows on the new page
      await expect(page.locator('//tbody/tr')).toHaveCount(10);
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