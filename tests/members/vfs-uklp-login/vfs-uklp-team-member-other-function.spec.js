import { test, expect } from '@playwright/test';

const Login = {
  baseUrl: 'https://staging.corporate.welcomecure.com/vfs_uk_lp/login',
  credentials: {
    username: '9130231921',
    password: '123456',
  }
}

//locators
const SEARCH_INPUT = "//input[contains(@placeholder,'Search By Name, Email, Contact No')]";
const ADMIN_TABLE_ROW = "//tbody/tr[1]/td[1]";
const NO_RECORDS_MSG = "//p[contains(@class,'text-xl font-Roboto')]";
const TOGGLE_SWITCH = "(//input[@id='68ee2869d3c8ea681a81976e'])[1]";
const PAGINATION_NEXT = "//div[@class='hidden text-sm md:block']//a[@aria-label='Next page'][normalize-space()='>']";
const ITEMS_PER_PAGE_DROPDOWN = "//img[@alt='LimitArrow']";


test.describe('VFS UK LP Team Member - Full Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(Login.baseUrl);
    
    // Login manually
    await page.fill('input[placeholder*="Mobile"]', Login.credentials.username);
    await page.fill('input[placeholder*="Password"]', Login.credentials.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForNavigation();

    // After login, click on "Team Member"
    await page.click("//a[normalize-space()='Team Member']");
  });

  // Search function test cases (Name/Email/Contact Number)

  test('Search by valid admin name', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Alianna');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search by valid Email', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('saloni11@yopmail.com');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search by valid Contact No', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('6767676767');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search with partial name match', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Ali');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search is case-insensitive', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('alianna');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Clear search shows full list', async ({ page }) => {
    // First search
    await page.locator(SEARCH_INPUT).fill('Sem Sharma');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(1000);
    // Then clear
    await page.locator(SEARCH_INPUT).fill('');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search by Invalid Email (negative - should show "Admin not found")', async ({ page }) => {
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
  
  // Status
  test('Toggle admin status (Active ↔ Inactive)', async ({ page }) => {
    const initialRowCount = await page.locator(ADMIN_TABLE_ROW).count();
    if (initialRowCount === 0) {
      console.log('No admins to toggle. Skipping.');
      return;
    }
    const toggle = page.locator(TOGGLE_SWITCH).first();
    const beforeClass = await toggle.getAttribute('class');
    await toggle.click();
    await page.waitForTimeout(2000);

    const afterClass = await toggle.getAttribute('class');
    expect(afterClass).not.toBe(beforeClass);
  });

  // Pagination Test cases

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

  test('should show correct number of items on last page', async ({ page }) => {
    const totalMemberLocator = page.locator("//p[contains(@class,'text-sm font-semibold')]");
    
    await expect(totalMemberLocator).toBeVisible();
    await expect(totalMemberLocator).toContainText(/Total Member : \d+/);

    const totalCountText = await totalMemberLocator.textContent();
    const totalMembers = parseInt(totalCountText.match(/\d+/)[0], 10);

    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalMembers / itemsPerPage);
    const expectedLastPageItems = totalMembers % itemsPerPage || itemsPerPage;

    console.log(`Total Members: ${totalMembers}`);
    console.log(`Total Pages: ${totalPages}`);
    console.log(`Expected items on last page: ${expectedLastPageItems}`);

    // Navigate to last page
    for (let i = 1; i < totalPages; i++) {
      await page.locator(PAGINATION_NEXT).click();
    }

    // Final assertion
    await expect(page.locator('//tbody/tr')).toHaveCount(expectedLastPageItems);
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
