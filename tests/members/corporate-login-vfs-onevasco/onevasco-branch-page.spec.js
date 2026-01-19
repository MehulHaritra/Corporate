import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage';

//locators
const SEARCH_INPUT = "//input[contains(@placeholder,'Search By Branch, Email, Contact')]";
const ADD_BRANCH = "//button[normalize-space()='Add']";
const ADMIN_TABLE_ROW = "//tbody/tr[1]/td[1]";
const NO_RECORDS_MSG = "//p[contains(@class,'text-xl font-Roboto')]";
const EMAIL_ICON = "//tbody/tr[1]/td[5]/div[1]/span[1]//*[name()='svg']";
const PAGINATION_NEXT = "//div[contains(@class,'hidden text-sm md:block')]//a[contains(@aria-label,'Next page')][normalize-space()='>']";
const ITEMS_PER_PAGE_DROPDOWN = "//img[@alt='LimitArrow']";


test.describe('VFS Corporate => Branch Page - Full Functionality', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('8978989789', 'Test@1234', 'Corporate');
    await page.waitForURL('https://staging.corporate.welcomecure.com/vfs/branch');
    
  });

// Search function test cases (Branch Name/Email/Contact Number)

/*test('Search by valid Branch name', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Artisan - Delhi 11');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search by valid Email', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('sion@yopmail.com');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search by valid Contact No', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('7878127878');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search with partial branch match', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Artisan Nagp');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search is case-insensitive', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('artisan nagpur');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Clear search shows full list', async ({ page }) => {
    // First search
    await page.locator(SEARCH_INPUT).fill('Boat');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(1000);
    // Then clear
    await page.locator(SEARCH_INPUT).fill('');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search by Invalid Email (negative - should show "No Branch Details Available.")', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('jessicawelcomecure.com');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
  });

  test('Search by Invalid phone number ', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('9876543210454354353');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
  });

  test('Search by Corporate name (negative)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('stackbelowflow');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
  });

  test('Search with Invalid Name (e.g., numbers)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('12345admin');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
  });

// Action icons: Email
  test('Click email icon opens mailto link', async ({ page }) => {
    const initialRowCount = await page.locator(ADMIN_TABLE_ROW).count();
    page.locator(EMAIL_ICON).click()
    await page.waitForTimeout(3000);
    const noResultsMessage = page.locator('text=Email has sent successfully');
});
*/

// Add branch 

test.skip('Click Add button opens form', async ({ page }) => {
    await page.locator(SEARCH_INPUT);
    await page.locator(ADD_BRANCH).click();
    await expect(page.getByText('Add Branch')).toBeVisible({ timeout: 2000 });
    
  });

  test.skip('Submit form without mandatory fields', async ({ page }) => {
    await page.locator(SEARCH_INPUT);
    await page.locator(ADD_BRANCH).click();
    //await page.locator("//input[@id='corporateName']").click();
    await page.locator("//button[normalize-space()='Save']").click();
    await page.waitForTimeout(3000);
    //await expect(page.getByText(/Please fill in this field/)).toBeVisible({ timeout: 2000 });
  });

test('Add new branch ', async ({ page }) => {
    
    // Add a new branch 
    await page.locator(ADD_BRANCH).click();
    await page.locator("//input[@id='corporateName']").fill('Branch-Mumbaii');
    await page.locator("//input[@id='name']").fill('Eliana');
    await page.locator("//input[@id='email']").fill('elina114@yopmail.com');
    await page.locator("//input[@id='contact']").fill('99111880000');
    await page.setInputFiles('input[type="file"]', './tests/fixtures/logo.png');
    await page.locator("//button[normalize-space()='Save']").click();
    await expect(page.getByText('Branch is created successfully')).toBeVisible({ timeout: 5000 });
    });
    
test('handle duplicate entry', async ({ page }) => {

   // Try to add the same branch again
    await page.locator(ADD_BRANCH).click();
    await page.locator("//input[@id='corporateName']").fill('Branch-Mumbai');
    await page.locator("//input[@id='name']").fill('Eliana');
    await page.locator("//input[@id='email']").fill('elina113@yopmail.com');
    await page.locator("//input[@id='contact']").fill('9911188272');
    await page.setInputFiles('input[type="file"]', './tests/fixtures/logo.png');
    await page.locator("//button[normalize-space()='Save']").click();

    // Expect a duplicate entry error message
    await expect(page.getByText('Branch name with Branch-Mumbai already exists')).toBeVisible({ timeout: 2000 });
  });
  
  // Pagination Test cases
  
   test('should display 10 team members by default', async ({ page }) => {
  // Wait until at least one row is visible (max 10 seconds)
  await page.waitForSelector("//tbody/tr", { timeout: 10000 });

  const rowCount = await page.locator("//tbody/tr").count();
  expect(rowCount).toBeGreaterThan(0); // First check that table loaded
  expect(rowCount).toBe(10);

  await page.waitForTimeout(3000);
});
  
  test('should display 25 items when selecting 25 per page', async ({ page }) => {
      // Open items per page dropdown
      await page.locator(ITEMS_PER_PAGE_DROPDOWN).click();
      // Select 25 (assuming options appear as text/buttons)
      await page.locator("//p[@role='menuitem' and text()='25']").click();
      await page.waitForTimeout(1000);
  
      const rowCount = await page.locator("//tbody/tr").count();
      expect(rowCount).toBe(25);
      await page.waitForTimeout(3000);
    });
  
    test.skip('should navigate to page 2 using Next button', async ({ page }) => {
      const firstRowPage1 = await page.locator(ADMIN_TABLE_ROW).textContent();
  
      await page.locator(PAGINATION_NEXT).click();
      await page.waitForTimeout(1000);
  
      const firstRowPage2 = await page.locator(ADMIN_TABLE_ROW).textContent();
      expect(firstRowPage2).not.toBe(firstRowPage1);
  
      const rowCount = await page.locator("//tbody/tr").count();
      expect(rowCount).toBe(10); // or 25, if you changed view
    });
  
  
  
  test.skip('should reset to page 1 after performing a search', async ({ page }) => {
  // Go to page 2
  await page.locator(PAGINATION_NEXT).click();
  await page.waitForTimeout(2000);

  // Perform search
  await page.locator(SEARCH_INPUT).fill('Artisan Nagpur');
  await page.locator(SEARCH_INPUT).press('Enter');
  await page.waitForTimeout(4000);

  // Validate at least one result appears
  const rowCount = await page.locator("//tbody/tr").count();
  expect(rowCount).toBeGreaterThanOrEqual(1);

  // Check the first row text
  const firstResult = await page.locator("//tbody/tr[1]").textContent();
  expect(firstResult.toLowerCase()).toContain('artisan nagpur');
});

});
