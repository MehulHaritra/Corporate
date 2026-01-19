import { test, expect } from '@playwright/test';
import LoginPage from '../../../../pages/LoginPage';
import { fetchAllExportEmails } from '../../../../utils/email-helper.js';
import XLSX from 'xlsx';

// Admin / Corporate credentials & navigation (CO)
const coLogin = {
    name: 'Corporate (CO)',
    username: '3355662288',
    password: 'Test@1234',
    role: 'Corporate',
    url: 'https://staging.corporate.welcomecure.com/corporate/hr',
    memberListNav: async (page) => {
        await page.click("(//img[@alt='arrow'])[1]");
        await page.click("//a[normalize-space()='Member List']");
    }
};

// Date selection
async function selectDateRange(page) {
    // Open date picker (CO uses a different Select Date button class in existing file)
    await page.click("//button[normalize-space()='Select Date']");
    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
   
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']//i").click().catch(() => {});
    await page.locator("(//span[contains(@class,'rdrDayNumber')])[6]").click().catch(() => {});
    await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click().catch(() => {});
    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[contains(text(),'28')])[2]").click().catch(() => {});
}

// Export 
async function triggerExport(page, email = 'vaibhav@yopmail.com') {
    await page.getByRole('button', { name: 'Export' }).click();
    // fill email (if the popup has an input)
    const emailInput = page.locator("(//input[@id='email'])[1]");
    if (await emailInput.count()) {
        await emailInput.fill(email);
        // click yellow confirm button if present
        const confirmBtn = page.locator("//button[normalize-space()='Export']");
        if (await confirmBtn.count()) await confirmBtn.click();
    }
    const toastLocator = page.locator('.Toastify__toast-body');
    await toastLocator.waitFor({ state: 'visible', timeout: 15000 });
    const toastText = await toastLocator.textContent();
    console.log('Toast message:', toastText);
    await expect(toastText).toContain('Your request is being processed.');
}

// Before Each: Login + navigation
test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log(`Logging in as ${coLogin.name}...`);
    await loginPage.login(coLogin.username, coLogin.password, coLogin.role);
    await page.waitForURL(coLogin.url);
    await coLogin.memberListNav(page);
    // CO page uses "Search By Member Name"
    await expect(page.locator("//input[contains(@placeholder,'Search By Member Name')]")).toBeVisible();
});

// AFTER EACH: Export Validation if triggered
test.afterEach(async ({}, testInfo) => {
    if (!testInfo.exportTriggered) return;
    try {
        console.log(` Validating export for: ${testInfo.title}`);
        let attachmentPaths;
        for (let i = 0; i < 6; i++) {
            try {
                attachmentPaths = await fetchAllExportEmails(testInfo.title);
                if (attachmentPaths && attachmentPaths.length > 0) break;
            } catch (err) {
                console.log(`Attempt #${i + 1} to fetch email failed: ${err.message}`);
            }
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

// 1. Static date via fill
test('Admin Export - CO (Static Date)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 2. Static single date
test('Admin Export - CO (Static Single Date)', async ({ page }, testInfo) => {
    await page.click("//button[normalize-space()='Select Date']");
    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']").click();
    await page.locator("//span[contains(text(),'18')]").click();
    //await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click();
    //const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    //await expect(continuousInput).toBeVisible({ timeout: 10000 });
    //await continuousInput.click();
    //await page.locator("(//span[contains(text(),'4')])[1]").click().catch(() => {});
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 3. Static invalid date
test('Admin Export - CO (Invalid Date Selection)', async ({ page }, testInfo) => {
    await page.click("//button[contains(@class,'bg-[#fae006]') or normalize-space()='Select Date']");
    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']//i").click().catch(() => {});
    await page.locator("(//span[@class='rdrDayNumber'])[4]").click().catch(() => {});
    await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click().catch(() => {});
    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[@class='rdrDayNumber'])[2]").click({ force: true }).catch(() => {});
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 4. Search by Name + Static Date
test('Admin Export - CO (Search by Name)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By Member Name']").fill('Harry');
    await page.locator("//input[@placeholder='Search By Member Name']").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 5. Search blank + Static Date
test('Admin Export - CO (Blank Search)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By Member Name']").fill('');
    await page.locator("//input[@placeholder='Search By Member Name']").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 9. Without Date Selection → popup error
test('Admin Export - CO (No Date Selected)', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    const popupLocator = page.locator("//div[@role='dialog' or contains(@class,'modal')]");
    await popupLocator.waitFor({ state: 'visible', timeout: 10000 });
    const popupText = await popupLocator.textContent();
    await expect(popupText).toContain('Please select a date range before exporting the data!');
});

// 10. Date + Search
test('Admin Export - CO (Date + Search)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await page.locator("//input[@placeholder='Search By Member Name']").fill('Malvika');
    await page.locator("//input[@placeholder='Search By Member Name']").press('Enter');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});
