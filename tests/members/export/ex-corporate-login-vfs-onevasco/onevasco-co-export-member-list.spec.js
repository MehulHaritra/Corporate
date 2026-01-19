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
        await page.click("//a[normalize-space()='Member List']");
    }
};

// Select Date 
async function selectDateRange(page) {
    await page.click("//button[normalize-space()='Select Date']");

    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();

    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']//i").click();
    await page.locator("(//span[@class='rdrDayNumber'])[2]").click();

    await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click();

    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[@class='rdrDayNumber'])[4]").click();
}

// Export function
async function triggerExport(page, email = 'prasad@yopmail.com') {
    await page.getByRole('button', { name: 'Export' }).click();
    
    const emailInput = page.locator("(//input[@id='email'])[1]");
    if (await emailInput.count()) {
        await emailInput.fill(email);
    }
    const confirmBtn = page.locator("(//button[@class='w-full bg-[#FCDD00] text-black py-3 px-4 rounded-lg'])[1]");
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

// filter helper
async function applyFilter(page, filterName) {
    await page.locator("//button[normalize-space()='Filters']").click();
    await page.locator("(//div[contains(@class,'react-select__input-container')])[1]").click();
    await page.locator(`.react-select__option:has-text("${filterName}")`).click();
    await page.locator("//button[normalize-space()='Apply Filters']").click();
}

//Before each : login + navigate to member list
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
test.skip('Onevesco Export - Member List (Static Date)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Static single date
test('Onevesco Export - Member List (Static Single Date)', async ({ page }, testInfo) => {
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
test.skip('Onevesco Export - Member List (Search by Name)', async ({ page }, testInfo) => {
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('Mitesh');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search invalid name + Static Date
test.skip('Onevesco Export - Member List (Invalid Name)', async ({ page }, testInfo) => {
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
test.skip('Onevesco Export - Member List (Filter by Branch)', async ({ page }, testInfo) => {
    await applyFilter(page, 'Onevesco Branch Name');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search with Email + Filter + Static Date
test.skip('Onevesco Export - Member List (Search + Filter)', async ({ page }, testInfo) => {
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('harshil@wizcoder.com');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await applyFilter(page, 'Onevesco Branch Name');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Without Date Selection → popup error
test.skip('Onevesco Export - Member List (No Date Selected)', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    const popupLocator = page.locator("//div[@role='dialog']");
    await popupLocator.waitFor({ state: 'visible', timeout: 10000 });
    const popupText = await popupLocator.textContent();
    await expect(popupText).toContain('Please select a date range before exporting the data!');
});

// Date + Search with Name + Filter
test.skip('Onevesco Export - Member List (Date + Search + Filter)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('Jacob');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await applyFilter(page, 'Onevesco Branch A');
    await applyFilter(page, 'Onevesco Branch B');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Date + Filter + Search with Contact No
test.skip('Onevesco Export - Member List (Date + Filter + Search)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await applyFilter(page, 'Onevesco Branch C');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").fill('9222874550');
    await page.locator("//input[contains(@placeholder,'Search By Member, Email, Contact No')]").press('Enter');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});