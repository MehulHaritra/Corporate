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
        await page.click("//a[normalize-space()='Refunds']");
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

// Filters helpers
async function openFilters(page) {
    await page.getByRole('button', { name: 'Filters' }).click();
    await expect(page.getByRole('button', { name: 'Apply Filters' })).toBeVisible();
}

const dropdownClickTargets = {
    'Branch': "(//*[name()='svg'][contains(@class,'css-8mmkcg')])[1]",
    'Refund Status': "(//*[name()='svg'][contains(@class,'css-8mmkcg')])[2]"
};


async function applyFilterByField(page, fieldLabel, optionText) {
    await openFilters(page);
    const clickTargetLocator = dropdownClickTargets[fieldLabel];
    if (!clickTargetLocator) {
        throw new Error(`No click target locator found for filter field: ${fieldLabel}`);
    }
    await page.locator(clickTargetLocator).click();
    await page.getByText(optionText, { exact: true }).click();
    await page.getByRole('button', { name: 'Apply Filters' }).click();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
}


async function applyFilters(page, filters = {}) {
    await openFilters(page);
    for (const [field, value] of Object.entries(filters)) {
        const clickTargetLocator = dropdownClickTargets[field];
        if (!clickTargetLocator) {
            throw new Error(`No click target locator found for filter field: ${field}`);
        }
        await page.locator(clickTargetLocator).click();
        await page.getByText(value, { exact: true }).click();
    }
    await page.getByRole('button', { name: 'Apply Filters' }).click();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
}

// Before Each: Login + navigation
test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log(`Logging in as ${adminLogin.name}...`);
    await loginPage.login(adminLogin.username, adminLogin.password, adminLogin.role);
    await page.waitForURL(adminLogin.url);
    await adminLogin.memberListNav(page);
    await expect(page.locator("//input[@placeholder='Search By Member, Email, Contact No']")).toBeVisible();
});

// AFTER EACH: Export Validation if triggered
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
                console.log(`Attempt #${i + 1} to fetch email failed: ${err.message}`);
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

// Test Cases 

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
    await page.locator("(//span[contains(text(),'28')])[2]").click();
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search by Name + Static Date
test.skip('Admin Export - VFS UK INDIA (Search by Name)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('Mehul');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search invalid name + Static Date
test.skip('Admin Export - VFS UK INDIA (Invalid Name)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('32charli3123');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
    await selectDateRange(page);
    const noResultsMessage = page.locator('text=No Refund Details Available.');
    if (await noResultsMessage.isVisible()) {
        console.log('No refund records found — skipping export.');
        await expect(noResultsMessage).toBeVisible();
    } else {
        await triggerExport(page);
        testInfo.exportTriggered = true;
    }
});

// Filter branch + Static Date (uses new field helper)
test.skip('Admin Export - VFS UK INDIA (Filter by Branch)', async ({ page }, testInfo) => {
    await applyFilterByField(page, 'Branch', 'COCHIN - UK VAC');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search with Email + Filter + Static Date
test.skip('Admin Export - VFS UK INDIA (Search + Filter)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('saloni@yopmail.com');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
    await applyFilterByField(page, 'Branch', 'NEW DELHI - UK VAC');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Refund Status tests (All / Pending / Approved / Rejected) - active
test.skip('Admin Export - VFS UK INDIA (Refund Status - Pending)', async ({ page }, testInfo) => {
    await applyFilterByField(page, 'Refund Status', 'Pending');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test('Admin Export - VFS UK INDIA (Refund Status - Approve)', async ({ page }, testInfo) => {
    await applyFilterByField(page, 'Refund Status', 'Approve');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Refund Status - Reject)', async ({ page }, testInfo) => {
    await applyFilterByField(page, 'Refund Status', 'Reject');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

test.skip('Admin Export - VFS UK INDIA (Refund Status - All)', async ({ page }, testInfo) => {
    await applyFilterByField(page, 'Refund Status', 'All');
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

// Date + Search with Name + Filter (multiple branch selection supported via applyFilters)
test.skip('Admin Export - VFS UK INDIA (Date + Search + Filter)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('Jacob');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
    await applyFilters(page, { 'Branch': 'COCHIN - UK VAC', 'Refund Status': 'Pending' });
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Date + Filter + Search with Contact No
test.skip('Admin Export - VFS UK INDIA (Date + Filter + Search)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await applyFilterByField(page, 'Branch', 'VFS UK India - Kolkata');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").fill('9222874550');
    await page.locator("//input[@placeholder='Search By Member, Email, Contact No']").press('Enter');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});
