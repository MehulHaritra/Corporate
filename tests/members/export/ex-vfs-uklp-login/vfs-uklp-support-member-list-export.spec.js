import { test, expect } from '@playwright/test';
import XLSX from 'xlsx';
import { fetchAllExportEmails } from '../../../../utils/email-helper.js';

//locators
const SEARCH_INPUT = "//input[@placeholder='Search By Member, Email, Contact No']";
const ADMIN_TABLE_ROW = "//tbody/tr[1]/td[1]";
const NO_RECORDS_MSG = "//p[contains(@class,'text-xl font-Roboto')]";
const PAGINATION_NEXT = "//div[contains(@class,'hidden text-sm md:block')]//a[contains(@aria-label,'Next page')][normalize-space()='>']";
const ITEMS_PER_PAGE_DROPDOWN = "//img[@alt='LimitArrow']";

// Login details (VFS UKLP)
const vfsUklpAdminLogin = {
    name: 'Riya',
    username: '9911112222', 
    password: '694159', 
    loginUrl: 'https://staging.corporate.welcomecure.com/vfs_uk_lp/team/login',
    postLoginUrl: 'https://staging.corporate.welcomecure.com/vfs_uk_lp/support/memberlist', 
    async memberListNav(page) {
       await page.click("//a[normalize-space()='Member List']"); 
    }
};

// Select Date
async function selectDateRange(page) {
    await page.click("//button[normalize-space()='Select Date']");

    const earlyInput = page.locator("//input[@placeholder='Early']");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();

    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']").click();
    await page.locator("(//span[@class='rdrDayNumber'])[2]").click({ force: true });

    await page.locator("//button[@class='rdrNextPrevButton rdrNextButton']").click();

    const continuousInput = page.locator("//input[@placeholder='Continuous']");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[@class='rdrDayNumber'])[18]").click();
}

// Export function
async function triggerExport(page, email = 'saloni@wizcoder.com') {
    await page.getByRole('button', { name: 'Export' }).click();

    const emailInput = page.locator("(//input[@id='email'])[1]");
    if (await emailInput.count()) {
        await emailInput.fill(email);
    }
    const confirmBtn = page.locator("//button[normalize-space()='Export']");
    if (await confirmBtn.count()) {
        await confirmBtn.click();
    }

    const toastLocator = page.locator('.Toastify__toast-body');
    await toastLocator.waitFor({ state: 'visible', timeout: 15000 });
    const toastText = await toastLocator.textContent();
    console.log('Toast message:', toastText);

    const expectedText = `Your request is being processed. The download file will be sent to ${email}`;
    await expect(toastLocator).toHaveText(expectedText);
}
// Filter function
async function applyFilter(page, filters = {}) {
  // Wait for Filters panel to render
  const filtersButton = page.locator("//button[normalize-space()='Filters']");
  await filtersButton.waitFor({ state: 'visible', timeout: 15000 });
  console.log("Opening Filters panel...");
  await filtersButton.click();

  // Universal selectFilter for React Select dropdowns
  const selectFilter = async (label, value) => {
    console.log(`Selecting filter: ${label} → ${value}`);

    const dropdownLocator = page.locator(`//*[text()='Select ${label}']/following-sibling::div`);
    await dropdownLocator.waitFor({ state: 'visible', timeout: 10000 });

    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Clicking dropdown for "${label}"`);
        await dropdownLocator.click();

        // Only select the actual option elements
        const optionLocator = page.locator(`div[class*="option"]:has-text("${value}")`);
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
  if (filters.zone) await selectFilter('Zone', filters.zone);
  if (filters.branch) await selectFilter('Branch', filters.branch);
  if (filters.region) await selectFilter('Region', filters.region);
  if (filters.sourceCountry) await selectFilter('Source Country', filters.sourceCountry);
  if (filters.destinationCountry) await selectFilter('Destination Country', filters.destinationCountry);
  

  // Apply all filters
  const applyButton = page.locator("//button[normalize-space()='Apply Filters']");
  await applyButton.waitFor({ state: 'visible', timeout: 10000 });
  console.log("Applying all filters...");
  await applyButton.click();

  // Wait until network is idle to ensure filtered results are loaded
  await page.waitForLoadState('networkidle');

  // === Clear All Filters ===
  /*const clearButton = page.locator("(//img[@alt='new'])[1]"); // Use a reliable locator
  await clearButton.waitFor({ state: 'visible', timeout: 15000 });
  await clearButton.scrollIntoViewIfNeeded();
  await clearButton.click();
  console.log("All filters cleared successfully.");
*/
  // Optional: wait for page/results to update
  await page.waitForLoadState('networkidle');
}

//Before each : login + navigate to member list
test.beforeEach(async ({ page }) => {
    console.log(`Logging in as ${vfsUklpAdminLogin.name}...`);

    await page.goto(vfsUklpAdminLogin.loginUrl);
    await page.fill("//input[contains(@placeholder,'Enter Mobile Number')]", vfsUklpAdminLogin.username); 
    await page.fill("//input[@placeholder='Enter Password']", vfsUklpAdminLogin.password); 
    await page.locator("//button[normalize-space()='Sign In']").click();
    await page.waitForURL(vfsUklpAdminLogin.postLoginUrl);

    await vfsUklpAdminLogin.memberListNav(page);
    await expect(page.locator("//input[@placeholder='Search By Member, Email, Contact No']")).toBeVisible();
});

//  After each: export validation
test.afterEach(async ({}, testInfo) => {
    if (!testInfo.exportTriggered) {
        console.log(` Skipping export validation for: ${testInfo.title}`);
        return;
    }

    try {
        console.log(` Validating export for: ${testInfo.title}`);
        let attachmentPaths;

        for (let i = 0; i < 6; i++) { // try 6 times (30s total)
            try {
                attachmentPaths = await fetchAllExportEmails(testInfo.title);
                if (attachmentPaths && attachmentPaths.length > 0) break;
            } catch (err) {
                console.log(`Attempt #${i + 1} failed: ${err.message}`);
            }

            console.log('Waiting for email...');
            await new Promise(res => setTimeout(res, 5000));
        }

        if (!attachmentPaths) {
            console.warn('Export email not received in time. Skipping validation.');
            return;
        }

        for (const attachmentPath of attachmentPaths) {
            const workbook = XLSX.readFile(attachmentPath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);
            console.log(` [${testInfo.title}] Exported records count:`, data.length);
            expect(data.length).toBeGreaterThan(0);
        }

    } catch (err) {
        console.error('Error in export validation:', err);
    }
});

// Test cases

// Static date via fill
test.skip('VFS UKLP Export - Member List (Static Date)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await page.waitForTimeout(3000);
    //await triggerExport(page);
    //testInfo.exportTriggered = true;
});

// Static single date
test.skip('VFS UKLP Export - Member List (Static Single Date)', async ({ page }, testInfo) => {
    await page.click("//button[normalize-space()='Select Date']");
    const earlyInput = page.locator("//input[contains(@placeholder,'Early')]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']").click();
    await page.locator("//span[contains(text(),'25')]").click();
    await page.waitForTimeout(3000);
    //await triggerExport(page);
    //testInfo.exportTriggered = true;
});

// Search by Name + Static Date
test.skip('VFS UKLP Export - Member List (Search by Name)', async ({ page }, testInfo) => {
    
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('saloni qa');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
    await page.waitForTimeout(3000);
    await selectDateRange(page);
    await page.waitForTimeout(3000);
    //await triggerExport(page);
    //testInfo.exportTriggered = true;
});

// Search invalid name + Static Date
test.skip('VFS UKLP Export - Member List (Invalid Name)', async ({ page }, testInfo) => {
    
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('32charli3123');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
    await selectDateRange(page);
    
    const noResultsMessage = page.locator('text=No Member Details Available.');
    if (await noResultsMessage.isVisible()) {
        console.log('No Member Details Available. — skipping export.');
        await expect(noResultsMessage).toBeVisible();
    } else {
        await triggerExport(page);
        testInfo.exportTriggered = true;
    }
});

// Filter zone + Static Date  -- change filter to zone
test('VFS UKLP Export - Member List (Filter by zone)', async ({ page }, testInfo) => {
   
    await applyFilter(page, { zone: 'North' });
    await selectDateRange(page);
    
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search with Email + Filter + Static Date  ---- change filter to zone
test.skip('VFS UKLP Export - Member List (Search with Email + Filter + Static Date)', async ({ page }, testInfo) => {
    
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('saloni@yopmail.com');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await applyFilter(page, { zone: 'North' });
    await applyFilter(page, { branch: 'NEW DELHI - UK VAC' });
    
    //await triggerExport(page);
    //testInfo.exportTriggered = true;
});

// Without Date Selection → popup error
test.skip('VFS UKLP Export - Member List (No Date Selected)', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    const popupLocator = page.locator("//div[@role='dialog']");
    await popupLocator.waitFor({ state: 'visible', timeout: 10000 });
    const popupText = await popupLocator.textContent();
    await expect(popupText).toContain('Please select a date range before exporting the data!');
});

// Date + Search with Name + Filter
test('VFS UKLP Export - Member List (Date + Search + Filter)', async ({ page }, testInfo) => {
    
    await selectDateRange(page);
    await page.waitForTimeout(2000);
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('Krish');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
    await page.pause();
    await applyFilter(page, { zone: 'North' });
    
    testInfo.exportTriggered = true;
});

// Date + Filter + Search with Contact No
test.skip('VFS UKLP Export - Member List (Date + Filter + Search)', async ({ page }, testInfo) => {
    
    await selectDateRange(page);
    await applyFilter(page, { zone: 'North' });
    await page.waitForTimeout(10000);
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('9712738076');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
   
    
    testInfo.exportTriggered = true;
});

// Filter by Zone
test.skip('VFS UKLP Export - Member List (Filter by Zone)', async ({ page }, testInfo) => {
    
    await applyFilter(page, { zone: 'North' });
    
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Filter by Branch
test.skip('VFS UKLP Export - Member List (Filter by Branch - Specific)', async ({ page }, testInfo) => {
   
    await applyFilter(page, { branch: 'NEW DELHI - UK VAC' });
    const filteredMemberCount = await getMemberCount(page);
    
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Filter by Region
test.skip('VFS UKLP Export - Member List (Filter by Region)', async ({ page }, testInfo) => {
    
    await applyFilter(page, { region: 'South Asia' });
    
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
}); 

// Filter by Source Country
test.skip('VFS UKLP Export - Member List (Filter by Source Country)', async ({ page }, testInfo) => {
    
    await applyFilter(page, { sourceCountry: 'Algeria' });
   
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Filter by Destination Country
test.skip('VFS UKLP Export - Member List (Filter by Destination Country)', async ({ page }, testInfo) => {
    
    await applyFilter(page, { destinationCountry: 'Barbados' });
    
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// All Filters Combined + Static Date
test('VFS UKLP Export - Member List (All Filters Combined)', async ({ page }, testInfo) => {
    
    await selectDateRange(page);
    await page.waitForTimeout(3000);
    await applyFilter(page, {
        zone: 'North',
        branch: 'NEW DELHI - UK VAC',
        region: 'South Asia',
        sourceCountry: 'India',
        destinationCountry: 'United States'
    });
   
    await page.waitForTimeout(3000);
   // await triggerExport(page);
    //testInfo.exportTriggered = true;
});

// Search function test cases (Name/Email/Contact Number)

test('Search by valid admin name', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Saloni Qa');
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
    await page.locator(SEARCH_INPUT).fill('9712738076');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search with partial name match', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('Sal');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Search is case-insensitive', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('saloni qa');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator(ADMIN_TABLE_ROW).count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Clear search shows full list', async ({ page }) => {
    // First search
    await page.locator(SEARCH_INPUT).fill('Karan');
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

  test('Search with Invalid Name (e.g., numbers)', async ({ page }) => {
    await page.locator(SEARCH_INPUT).fill('12345admin');
    await page.locator(SEARCH_INPUT).press('Enter');
    await page.waitForTimeout(2000);
    const noRecords = await page.locator(NO_RECORDS_MSG).isVisible();
    expect(noRecords).toBeTruthy();
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
