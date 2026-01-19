import { test, expect } from '@playwright/test';
import path from 'path';
import LoginPage from '../../../pages/LoginPage';
import ExcelJS from 'exceljs';

const SEARCH_INPUT = "//input[contains(@placeholder,'Search By Member, Email, Contact No')]";
const ADMIN_TABLE_ROW = "//tbody/tr";
const NO_RECORDS_MSG = "(//p[@class='text-xl font-Roboto'])[1]";
const TOGGLE_SWITCH = "//tbody/tr[1]//input[@role='switch']";
const EMAIL_ICON = "(//*[name()='svg'][contains(@class,'cursor-pointer')])[2]";
const DELETE_ICON = "(//*[name()='svg'][contains(@stroke,'currentColor')])[13]";
const PAGINATION_NEXT = "(//a[@aria-label='Next page'][normalize-space()='>'])[1]";
const ITEMS_PER_PAGE_DROPDOWN = "(//img[contains(@alt,'LimitArrow')])[1]";

test.describe('Member List Page', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log('Logging in as Admin...');
    await loginPage.login('9687298058', 'Cure@3210#', 'Admin');
    console.log('Waiting for URL to be **/Admin Page');
    await page.waitForURL('https://staging.corporate.welcomecure.com/admin/admin_user/corporate');
    console.log('URL matched.');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Member List page
    await page.getByRole('img', { name: 'arrow' }).first().click();
    await page.locator("//a[normalize-space()='Member List']").click();
    await page.waitForURL('https://staging.corporate.welcomecure.com/admin/admin_user/employee');
  });

  //Date selection
async function selectDateRange(page) {
    await page.click("//button[normalize-space()='Select Date']");
    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator('button.rdrNextPrevButton.rdrPprevButton').click(); 
    await page.getByRole('button', { name: '2', exact: true }).first().click(); 

    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.getByRole('button', { name: '4', exact: true }).first().click(); 
}

// Helper to get total member count
async function getMemberCount(page) {
  const countLocator = page.locator("//p[contains(@class,'text-sm font-semibold')]");
  await expect(countLocator).toContainText(/Total Member : \d+/, { timeout: 10000 });
  const countText = await countLocator.textContent();
  const match = countText.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

// Helper to wait for the member count to change
async function waitForCountChange(page, initialCount) {
  console.log(`Waiting for member count to change from ${initialCount}...`);
  try {
    await page.waitFor(async () => {
      const currentCount = await getMemberCount(page);
      return currentCount !== initialCount;
    }, { timeout: 10000 });
    console.log('Member count has changed.');
  } catch (e) {
    console.warn('Timed out waiting for member count to change. The filter may not have been applied correctly.');
  }
}
// Filter function
async function applyFilter(page, filters = {}) {
  // Wait for Filters panel to render
  const filtersButton = page.locator("//button[normalize-space()='Filters']");
  await filtersButton.waitFor({ state: 'visible', timeout: 15000 });
  console.log("Opening Filters panel...");
  await filtersButton.click();

  const countBefore = await getMemberCount(page);

  // Universal selectFilter for React Select dropdowns
  const selectFilter = async (label, value) => {
    console.log(`Selecting filter: ${label} → ${value}`);

    // Use the label text to find the associated dropdown container
    const dropdownLocator = page.locator(`//label[normalize-space()='${label}']/following-sibling::div`);
    await dropdownLocator.waitFor({ state: 'visible', timeout: 10000 });

    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Clicking dropdown for "${label}"`);
        await dropdownLocator.click();

        // Only select the actual option elements
        const optionLocator = page.locator(`div[class*="option"]:has-text("${value}")`).first();
        await optionLocator.waitFor({ state: 'visible', timeout: 10000 });

        console.log(`Clicking option "${value}"`);
        await optionLocator.click();

        // Small wait to ensure selection registers
        await page.waitForTimeout(300);

        // Close dropdown
        await page.keyboard.press('Escape');
        console.log(`Selected "${value}" for "${label}" successfully`);
        break;
      } catch (error) {
        console.log(`Retry ${i + 1}: Unable to select "${value}" for "${label}"`);
        if (i === 2) throw error; // Fail after 3 attempts
      }
    }
  };

  // Apply filters conditionally
 
if (filters.branch) await selectFilter('Branch', filters.branch);
if (filters.status) await selectFilter('Status', filters.status);

// Apply filters
  const applyButton = page.locator("//button[normalize-space()='Apply Filters']");
  await applyButton.waitFor({ state: 'visible', timeout: 10000 });
  console.log("Applying filters...");
  await applyButton.click();

  const loadingIndicator = page.locator('text=loading...');
  await loadingIndicator.waitFor({ state: 'visible', timeout: 5000 });
  await loadingIndicator.waitFor({ state: 'hidden', timeout: 15000 });

};
  // Filter by Status – with count validation
  test('Admin - Member List (Filter by Status)', async ({ page }) => {
    const filterToApply = { status: 'Inactive' };
    const countBefore = await getMemberCount(page);
    console.log(`Total members before filter: ${countBefore}`);
    
    await applyFilter(page, filterToApply);
    
    const countAfter = await getMemberCount(page);
    console.log(`Total members after filter: ${countAfter}`);
    
    expect(countAfter).toBeLessThanOrEqual(countBefore);
    expect(countAfter).toBeGreaterThanOrEqual(0); // Ensure not negative
    await selectDateRange(page);
  });

  // Filter by Branch – with count logging
  test('Admin - Member List (Filter by Branch - Specific)', async ({ page }) => {
    const countBefore = await getMemberCount(page);
    console.log(`Total members before branch filter: ${countBefore}`);
    
    await applyFilter(page, { branch: 'NEW DELHI - UK VAC' });
    
    const countAfter = await getMemberCount(page);
    console.log(`Total members after branch filter: ${countAfter}`);
    
    expect(countAfter).toBeLessThanOrEqual(countBefore);
    await selectDateRange(page);
  });

  //"Date + Search + Filter"
  test('Admin - Member List (Date + Search + Filter)', async ({ page }, testInfo) => {
    const countBefore = await getMemberCount(page);
    console.log(`Initial count: ${countBefore}`);
    
    await selectDateRange(page);
    await page.waitForTimeout(2000);
    
    await page.locator(SEARCH_INPUT).fill('Krish');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    
    const countAfterSearch = await getMemberCount(page);
    console.log(`Count after search: ${countAfterSearch}`);
    expect(countAfterSearch).toBeLessThanOrEqual(countBefore);
    
    await applyFilter(page, { status: 'Active' });
    const countAfterFilter = await getMemberCount(page);
    console.log(`Count after filter: ${countAfterFilter}`);
    expect(countAfterFilter).toBeLessThanOrEqual(countAfterSearch);
    
    testInfo.exportTriggered = true;
  });

  // Toggle status 
  test('Toggle admin status (Active ↔ Inactive)', async ({ page }) => {
    const initialRowCount = await page.locator(ADMIN_TABLE_ROW).count();
    const totalCount = await getMemberCount(page);
    console.log(`Total members (for toggle test): ${totalCount}`);
    
    if (initialRowCount === 0) {
      console.log('No admins to toggle. Skipping.');
      return;
    }

    const firstRow = page.locator(ADMIN_TABLE_ROW).first();
    const memberName = await firstRow.locator('td').nth(1).textContent();
    console.log(`Toggling status for: ${memberName?.trim()}`);

    const toggle = page.locator(TOGGLE_SWITCH);
    const initialStatus = await toggle.isChecked();
    await toggle.click();
    await page.waitForTimeout(2000);

    // Re-check toggle state
    const newStatus = await toggle.isChecked();
    expect(newStatus).not.toBe(initialStatus);

    // Confirm total count hasn't changed (toggle ≠ delete)
    const countAfterToggle = await getMemberCount(page);
    expect(countAfterToggle).toBe(totalCount);
  });

  
  // Search function test cases
  test('Search by valid admin name (positive)', async ({ page }) => {
    const countBefore = await getMemberCount(page);
    console.log(`Count before search: ${countBefore}`);
    await page.locator(SEARCH_INPUT).fill('Jesica');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    
    const countAfter = await getMemberCount(page);
    console.log(`Count after search: ${countAfter}`);
    expect(countAfter).toBeLessThanOrEqual(countBefore);
    expect(countAfter).toBeGreaterThan(0);
  });

  test('Search with partial name match', async ({ page }) => {
    const countBefore = await getMemberCount(page);
    console.log(`Count before search: ${countBefore}`);
    await page.locator(SEARCH_INPUT).fill('Jes');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    
    const countAfter = await getMemberCount(page);
    console.log(`Count after search: ${countAfter}`);
    expect(countAfter).toBeLessThanOrEqual(countBefore);
    expect(countAfter).toBeGreaterThan(0);
  });

  test('Search is case-insensitive', async ({ page }) => {
    const countBefore = await getMemberCount(page);
    console.log(`Count before search: ${countBefore}`);
    await page.locator(SEARCH_INPUT).fill('jesica');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    
    const countAfter = await getMemberCount(page);
    
    expect(countAfter).toBeLessThanOrEqual(countBefore);
    expect(countAfter).toBeGreaterThan(0);
    console.log(`Count after search: ${countAfter}`);
  });

  test('Clear search shows full list', async ({ page }) => {
    const fullCount = await getMemberCount(page); 
    await page.locator(SEARCH_INPUT).fill('XYZ');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(1000);
    
    const filteredCount = await getMemberCount(page);
    expect(filteredCount).toBeLessThanOrEqual(fullCount);

    await page.locator(SEARCH_INPUT).fill('');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    
    const restoredCount = await getMemberCount(page);
    expect(restoredCount).toBe(fullCount);
  });

  // Negative search fucntion test cases 
  test('Search by email (negative - should show "Admin not found")', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('nishi@yopmail.com');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    
    const countAfter = await getMemberCount(page);
    expect(countAfter).toBe(0);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
    console.log(`Count after search: ${countAfter}`);  
    });

  test('Search by phone number (positive)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('9712738076');
    console.log(`Search: ${9712738076}`);
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    
    const countAfter = await getMemberCount(page);
    expect(countAfter).toBeGreaterThan(0);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeFalsy(); 
    console.log(`Count after search: ${countAfter}`);
  });

  test('Search with invalid name (e.g., numbers)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('12345admin');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    
    const countAfter = await getMemberCount(page);
    expect(countAfter).toBe(0);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
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
            await page.getByRole('menuitem', { name: '25' }).click();
            await expect(page.locator('//tbody/tr')).toHaveCount(25);
            await page.waitForTimeout(3000);
          });
        
  test('should navigate to page 2 using Next button', async ({ page }) => {
            const firstRowPage1 = await page.locator(ADMIN_TABLE_ROW).first().textContent();
            await page.locator(PAGINATION_NEXT).click();
            await page.waitForTimeout(2000);
            await expect(page.locator(ADMIN_TABLE_ROW).first()).not.toHaveText(firstRowPage1);
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
        
            const firstResult = await page.locator("//tbody/tr[1]/td[1]").textContent();
            expect(firstResult.toLowerCase()).toContain('saloni qa');
          });
  
  test('should show correct number of items on last page', async ({ page }) => {
          const totalMemberLocator = page.locator("//p[@class='text-sm font-semibold']");
          
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
            if (await page.locator(PAGINATION_NEXT).isVisible()) {
              await page.locator(PAGINATION_NEXT).click();
              await page.waitForTimeout(500); // Wait for table to update
            }
          }
        
          // Final assertion
          await expect(page.locator('//tbody/tr')).toHaveCount(expectedLastPageItems);
        });

        

  
});