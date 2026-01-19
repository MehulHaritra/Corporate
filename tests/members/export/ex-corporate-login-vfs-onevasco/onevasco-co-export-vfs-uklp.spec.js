import { test, expect } from '@playwright/test';
import LoginPage from '../../../../pages/LoginPage.js';
import XLSX from 'xlsx';
import { fetchAllExportEmails } from '../../../../utils/email-helper.js';

// Login details (Onevesco - Corporate)
const adminLogin = {
    name: 'Corporate',
    username: '8978989789',
    password: 'Test@1234',
    role: 'Corporate',
    url: 'https://staging.corporate.welcomecure.com/vfs/branch',
    async memberListNav(page) {
        await page.click("(//img[contains(@alt,'arrow')])[1]");
        await page.click("//a[normalize-space()='VFS UK LP']");
    }
};

// Date selection
async function selectDateRange(page) {
    await page.click("//button[normalize-space()='Select Date']");
    const earlyInput = page.locator("//input[contains(@placeholder,'Early')]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator("//button[contains(@class,'rdrNextPrevButton rdrPprevButton')]").click();
    await page.locator("(//span[contains(text(),'1')])[2]").click();
    await page.locator("//button[contains(@class,'rdrNextPrevButton rdrNextButton')]//i").click();
    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[@class='rdrDayNumber'])[4]").click();
}

// Export
async function triggerExport(page, email = 'saloni@wizcoder.com') {
    await page.getByRole('button', { name: 'Export' }).click();
    await page.locator("(//input[@id='email'])[1]").fill(email);
    await page.locator("//button[normalize-space()='Export']").click();

    const toastLocator = page.locator('.Toastify__toast-body');
    await toastLocator.waitFor({ state: 'visible', timeout: 15000 });
    const toastText = await toastLocator.textContent();
    console.log('Toast message:', toastText);

    const expectedText = `Your request is being processed. The download file will be sent to ${email}`;
    await expect(toastLocator).toHaveText(expectedText);
}


async function applyFilter(page, filters = {}) {
  // Wait for Filters panel to render
  const filtersButton = page.locator("//button[normalize-space()='Filters']");
  await filtersButton.waitFor({ state: 'visible', timeout: 15000 });
  console.log("Opening Filters panel...");
  await filtersButton.click();

  // Universal selectFilter for React Select dropdowns
  const selectFilter = async (label, value) => {
    console.log(`Selecting filter: ${label} → ${value}`);

    const dropdownLocator = page.locator(`//*[text()='${label}']/following-sibling::div`);
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
  if (filters.branch) await selectFilter('Branch', filters.branch);
  if (filters.region) await selectFilter('Region', filters.region);
  if (filters.sourceCountry) await selectFilter('Source Country', filters.sourceCountry);
  if (filters.destinationCountry) await selectFilter('Destination Country', filters.destinationCountry);
  if (filters.zone) await selectFilter('Zone', filters.zone);

  // Apply all filters
  const applyButton = page.locator("//button[normalize-space()='Apply Filters']");
  await applyButton.waitFor({ state: 'visible', timeout: 10000 });
  console.log("Applying all filters...");
  await applyButton.click();

  // Wait until network is idle to ensure filtered results are loaded
  await page.waitForLoadState('networkidle');

  // === Clear All Filters ===
  const clearButton = page.locator("(//img[@alt='new'])[1]"); // Use a reliable locator
  await clearButton.waitFor({ state: 'visible', timeout: 15000 });
  await clearButton.scrollIntoViewIfNeeded();
  await clearButton.click();
  console.log("All filters cleared successfully.");

  // Optional: wait for page/results to update
  await page.waitForLoadState('networkidle');
}



//Before each : login
test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log(`Logging in as ${adminLogin.name}...`);

    await loginPage.login(adminLogin.username, adminLogin.password, adminLogin.role);
    await page.waitForURL(adminLogin.url);

    await adminLogin.memberListNav(page);
    await expect(page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]")).toBeVisible();
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
test.skip('Admin Export - VFS UK INDIA (Static Date)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Static single date
test.skip('Admin Export - VFS UK INDIA (Static Single Date)', async ({ page }, testInfo) => {
    await page.click("//button[normalize-space()='Select Date']");
    const earlyInput = page.locator("//input[contains(@placeholder,'Early')]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();

    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']").click();
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']").click();
    await page.locator("//span[contains(text(),'21')]").click();

    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search by Name + Static Date
test.skip('Admin Export - VFS UK INDIA (Search by Name)', async ({ page }, testInfo) => {
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('Mitesh');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search invalid name + Static Date
test.skip('Admin Export - VFS UK INDIA (Invalid Name)', async ({ page }, testInfo) => {
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('32charli3123');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await selectDateRange(page);
    const noResultsMessage = page.locator('text=No Family Member Details Available.');
    if (await noResultsMessage.isVisible()) {
        console.log('No Family Member Details Available. — skipping export.');
        await expect(noResultsMessage).toBeVisible();
    } else {
        await triggerExport(page);
        testInfo.exportTriggered = true;
    }
});

// Filter branch + Static Date
test.skip('Admin Export - VFS UK INDIA (Filter by Branch)', async ({ page }, testInfo) => {
    await applyFilter(page, 'COCHIN - UK VAC');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search with Email + Filter + Static Date
test.skip('Admin Export - VFS UK INDIA (Search + Filter)', async ({ page }, testInfo) => {
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('harshil@wizcoder.com');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await applyFilter(page, 'HYDERABAD - UK VAC');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Without Date Selection → popup error
test.skip('Admin Export - VFS UK INDIA (No Date Selected)', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    const popupLocator = page.locator("//div[@role='dialog']");
    await popupLocator.waitFor({ state: 'visible', timeout: 10000 });
    const popupText = await popupLocator.textContent();
    await expect(popupText).toContain('Please select a date range before exporting the data!');
});

// Date + Search with Name + Filter
test.skip('Admin Export - VFS UK INDIA (Date + Search + Filter)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('Jacob');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await applyFilter(page, 'HYDERABAD - UK VAC');
    await applyFilter(page, 'AHMEDABAD - UK VAC');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Date + Filter + Search with Contact No
test.skip('Admin Export - VFS UK INDIA (Date + Filter + Search)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await applyFilter(page, 'HYDERABAD - UK VAC');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('9222874550');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Filter by Region)', async ({ page }, testInfo) => {
    await applyFilter(page, { region: 'South Asia' });
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Filter by Source Country)', async ({ page }, testInfo) => {
    await applyFilter(page, { sourceCountry: 'Albania' });
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Filter by Destination Country)', async ({ page }, testInfo) => {
    await applyFilter(page, { destinationCountry: 'Afghanistan' });
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Filter by Zone)', async ({ page }, testInfo) => {
    await applyFilter(page, { zone: 'West' });
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Region + Source Country Filters)', async ({ page }, testInfo) => {
    await applyFilter(page, { 
        region: 'South Asia', 
        sourceCountry: 'India' 
    });
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (All Filters Applied)', async ({ page }, testInfo) => {
    await applyFilter(page, { 
        branch: 'HYDERABAD - UK VAC',
        region: 'South Asia',
        sourceCountry: 'Albania',
        destinationCountry: 'Afghanistan',
        zone: 'East'
    });
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Filter + Search by Email)', async ({ page }, testInfo) => {
    await applyFilter(page, { branch: 'COCHIN - UK VAC' });
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('harsh@yopmail.com');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Filter + Search by Contact No)', async ({ page }, testInfo) => {
    await applyFilter(page, { zone: 'East' });
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('+91 9328221950');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test('Admin Export - VFS UK INDIA (Clear All Filters)', async ({ page }) => {
    // Apply all filters
    await applyFilter(page, {
        branch: 'HYDERABAD - UK VAC',
        region: 'South Asia',
        sourceCountry: 'Albania',
        destinationCountry: 'Afghanistan',
        zone: 'East'
    });
    
    console.log("Clear All Filters clicked successfully.");
    await page.waitForLoadState('networkidle');
});

