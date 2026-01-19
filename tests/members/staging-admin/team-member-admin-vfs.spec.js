import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage';

//locators
const SEARCH_INPUT = "//input[@placeholder='Search By Name, Email, Contact No']";
const ADD_TEAM_MEMBER = "//button[normalize-space()='Add']";
const ADMIN_TABLE_ROW = "//tbody/tr[1]/td[1]";
const NO_RECORDS_MSG = "//p[@class='text-xl font-Roboto']";
const TOGGLE_SWITCH = "(//input[@id='68e9f9eec82cf468b6ffe572'])[1]";
const EMAIL_ICON = "//tbody/tr[9]/td[6]/div[1]/span[2]//*[name()='svg']";
const EDIT_ICON = "//tbody/tr[1]/td[6]/div[1]/span[1]//*[name()='svg']";
const PAGINATION_NEXT = "//div[contains(@class,'hidden text-sm md:block')]//a[contains(@aria-label,'Next page')][normalize-space()='>']";
const ITEMS_PER_PAGE_DROPDOWN = "//img[@alt='LimitArrow']";


test.describe('Admin=> Team Member - Full Functionality', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('9687298058', 'Cure@3210#', 'Admin');
    await page.waitForURL('https://staging.corporate.welcomecure.com/admin/admin_user/corporate');
    await page.click("//a[normalize-space()='Team Members']");
  });

// Search function test cases (Name/Email/Contact Number)

test('Search by valid admin name', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Olivia');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search by valid Email', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('	saloni1@yopmail.com');
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
    await page.locator(SEARCH_INPUT).fill('Oli');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search is case-insensitive', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('olivia');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Clear search shows full list', async ({ page }) => {
    // First search
    await page.locator(SEARCH_INPUT).fill('Jasmine');
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

// Action icons: Email, Edit
  test('Click email icon opens mailto link', async ({ page }) => {
    const initialRowCount = await page.locator(ADMIN_TABLE_ROW).count();
    page.locator(EMAIL_ICON).click()
    await page.waitForTimeout(3000);
    const noResultsMessage = page.locator('text=Team member credentials have been sent successfully');
});

const validMember = {
  name: 'Elee',
  email: 'elee44@example.com',
  contact: '501234563', 
};
test('should add team member with valid data and one permission', async ({ page }) => {
    await page.locator(ADD_TEAM_MEMBER).click();
    await expect(page.getByText('Add Team Member')).toBeVisible();

    // Fill valid data
    await page.locator("//input[@id='name']").fill(validMember.name);
    await page.locator("//input[@id='email']").fill(validMember.email);
    await page.locator("(//div[contains(@class,'css-19bb58m')])[1]").click();
    await page.getByText('+852', { exact: true }).click();
    await page.locator("//input[@id='contact']").fill(validMember.contact);
    await page.locator("(//*[name()='svg'][@class='css-8mmkcg'])[2]").click();
    await page.locator('.css-dq6lu7-option', { hasText: 'Support' }).click();

    // Select only one permission
    await page.getByLabel('Corporate', { exact: true }).check();
    

    await page.getByRole('button', { name: 'Save' }).click();

    // Verify success
    await expect(page.getByText('Team member created successfully')).toBeVisible({ timeout: 5000 });
    
  });

  test('should add team member with all permissions selected', async ({ page }) => {
    await page.locator(ADD_TEAM_MEMBER).click();
    await expect(page.getByText('Add Team Member')).toBeVisible();

    await page.locator('input#name').fill('Paull');
    await page.locator('input#email').fill('paull126@example.com');
    await page.locator("(//div[contains(@class,'css-19bb58m')])[1]").click();
    await page.getByText('+354', { exact: true }).click();
    await page.locator('input#contact').fill('5555555');
    await page.locator("(//*[name()='svg'][@class='css-8mmkcg'])[2]").click();
    await page.locator('.css-dq6lu7-option', { hasText: 'Manager' }).click();
    
    // Select all permissions
    await page.getByLabel('Select All').check();

    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Team member created successfully')).toBeVisible();
   
  });

   // Edit team member
test('should Edit team member with valid data', async ({ page }) => {
  // Search for the member to edit
  await page.locator(SEARCH_INPUT).fill('komal');
  await page.locator(SEARCH_INPUT).press('Enter');
  await page.waitForTimeout(2000);

 // Wait for the Edit modal/form
  await page.locator('.text-xl > .cursor-pointer').first().click();
  
  // Edit permissions
  await page.getByLabel('Admin', { exact: true }).check();
  // Click Save
  await page.getByRole('button', { name: 'Update' }).click();

  // Verify success (for edit flow)
  await expect(page.getByText('Team permission updated successfully')).toBeVisible({ timeout: 5000 });
});


// this is not working ----- unable to find locator for validation msg---------------------
test('should add team member with  invalid data with all permissions selected', async ({ page }) => {
    await page.locator(ADD_TEAM_MEMBER).click();
    await expect(page.getByText('Add Team Member')).toBeVisible();

    await page.locator('input#name').fill(' ');
    await page.locator('input#email').fill('paulexample@yopmail.com');
    await page.locator("(//div[contains(@class,'css-19bb58m')])[1]").click();
    await page.getByText('+354', { exact: true }).click();
    await page.locator('input#contact').fill(' ');
    await page.locator("(//*[name()='svg'][@class='css-8mmkcg'])[2]").click();
    await page.locator('.css-dq6lu7-option', { hasText: 'Manager' }).click();
    
    // Select all permissions
    await page.getByLabel('Select All').check();

    await page.getByRole('button', { name: 'Save' }).click();

     const anyErrorMessage = page.locator('Please fill in this field').or(page.getByText('Please fill out this field')).or(page.getByText('At least one permission is required'));

// Wait for any of them to be visible
await expect(anyErrorMessage).toBeVisible({ timeout: 5000 });

    // Pop-up should remain openok
    await expect(page.getByText('Add Team Member')).toBeVisible(); 
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
    await page.locator(SEARCH_INPUT).fill('raull');
    await page.locator(SEARCH_INPUT).press('Enter');

    // Should be back on page 1 with filtered results
    const rowCount = await page.locator("//tbody/tr").count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // Optional: verify first result is "mehul"
    const firstResult = await page.locator("//tbody/tr[1]/td[1]").textContent();
    expect(firstResult.toLowerCase()).toContain('raull');
  });

  // Check Filters
async function getMemberCount(page) {
  const countText = await page.locator("//p[contains(@class,'text-sm font-semibold')]").textContent();
  const match = countText.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

// Role Filter Only
test.skip('Team Member - Filter by Role = Accountant', async ({ page }) => {
  // Get count BEFORE filter
await page.goto('https://staging.corporate.welcomecure.com/admin/admin_user/corporate');
  await page.click("//a[normalize-space()='Team Members']");
  await page.waitForTimeout(2000);

  const countBefore = await getMemberCount(page);
  console.log(`Before filter - Total Members: ${countBefore}`);

  // Apply filter
  await page.locator("//button[normalize-space()='Filters']").click();
  await page.locator("(//*[name()='svg'][contains(@class,'css-8mmkcg')])[1]").click();
  await page.locator('.css-dq6lu7-option', { hasText: 'Accountant' }).click();
  await page.locator("//button[normalize-space()='Apply Filters']").click();
  await page.waitForTimeout(3000);

  // Get count AFTER filter
  const countAfter = await getMemberCount(page);
  console.log(`After filter (Accountant) - Total Members: ${countAfter}`);

  // Validate
  expect(countAfter).toBeLessThanOrEqual(countBefore);
  expect(countAfter).toBeGreaterThan(0);

  // Optional: Validate table content
  const totalRows = await page.locator('tbody tr').count();
  const roleCells = await page.locator('td:has-text("Accountant")').count();
  expect(roleCells).toBe(totalRows);
});

// Status Filter Only
test.skip('Team Member - Filter by Status = Active', async ({ page }) => {
  
  await page.goto('https://staging.corporate.welcomecure.com/admin/admin_user/corporate');
  await page.click("//a[normalize-space()='Team Members']");
  await page.waitForTimeout(2000);
  
  const countBefore = await getMemberCount(page);
  console.log(`Before filter - Total Members: ${countBefore}`);

  await page.getByRole('button', { name: 'Filters' }).click();
  await page.locator('div:nth-child(2) > .css-b62m3t-container > .css-12x3uyk-control > .css-7gwid4 > .css-1xc3v61-indicatorContainer').click();
  await page.getByText('Active', { exact: true }).click();
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForTimeout(3000);

  const countAfter = await getMemberCount(page);
  console.log(`After filter (Active) - Total Members: ${countAfter}`);

  expect(countAfter).toBeLessThanOrEqual(countBefore);
  expect(countAfter).toBeGreaterThan(0);
});

// Both Filters
test('Team Member - Filter by Role = Accountant and Status = Active', async ({ page }) => {

  await page.goto('https://staging.corporate.welcomecure.com/admin/admin_user/corporate');
  await page.click("//a[normalize-space()='Team Members']");
  await page.waitForTimeout(2000);

  const countBefore = await getMemberCount(page);
  console.log(`Before filter - Total Members: ${countBefore}`);
  
  await page.locator("//button[normalize-space()='Filters']").click();
  await page.locator("(//*[name()='svg'][contains(@class,'css-8mmkcg')])[1]").click();
  await page.locator('.css-dq6lu7-option', { hasText: 'Accountant' }).click();
  await page.locator('div:nth-child(2) > .css-b62m3t-container > .css-12x3uyk-control > .css-7gwid4 > .css-1xc3v61-indicatorContainer').click();
  await page.getByText('Active', { exact: true }).click();
  await page.locator("//button[normalize-space()='Apply Filters']").click();
  await page.waitForTimeout(2000);

  const countAfter = await getMemberCount(page);
  console.log(`After filter (Accountant + Active) - Total Members: ${countAfter}`);

  expect(countAfter).toBeLessThanOrEqual(countBefore);
  expect(countAfter).toBeGreaterThan(0);
});
});
