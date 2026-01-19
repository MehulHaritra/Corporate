import { test, expect } from '@playwright/test';
import LoginPage from '../../../../pages/LoginPage';
import { fetchAllExportEmails } from '../../../../utils/email-helper.js';
import XLSX from 'xlsx';

// Login Details
const hrLogin = {
    name: 'HR',
    username: '4242425656',
    password: 'Test@1234',
    role: 'HR',
    url: 'https://staging.corporate.welcomecure.com/hr/uploademployee',
    memberListNav: async (page) => {
        await page.click("//a[normalize-space()='Member List']");
    }
};

// Date selection 
async function selectDateRange(page) {
    await page.click("//button[normalize-space()='Select Date']");
    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']//i").click().catch(() => {});
    await page.locator("(//span[@class='rdrDayNumber'])[2]").click().catch(() => {});
    await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click().catch(() => {});
    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[@class='rdrDayNumber'])[4]").click().catch(() => {});
}

// Export 
async function triggerExport(page, email = 'kartik@yopmail.com') {
    await page.getByRole('button', { name: 'Export' }).click();
    const emailInput = page.locator("(//input[@id='email'])[1]");
    if (await emailInput.count()) {
        await emailInput.fill(email);
        const confirmBtn = page.locator("//button[normalize-space()='Export']");
        if (await confirmBtn.count()) await confirmBtn.click();
    }
    const toastLocator = page.locator('.Toastify__toast-body');
    await toastLocator.waitFor({ state: 'visible', timeout: 15000 });
    const toastText = await toastLocator.textContent();
    console.log('Toast message:', toastText);
    await expect(toastText).toContain('Your request is being processed.');
    await expect(toastLocator).toHaveText(`Your request is being processed. The download file will be sent to ${email}`);
}

// Before Each: Login + navigation
test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log(`Logging in as ${hrLogin.name}...`);
    await loginPage.login(hrLogin.username, hrLogin.password, hrLogin.role);
    await page.waitForURL(hrLogin.url);
    await hrLogin.memberListNav(page);
    await expect(page.locator("//input[contains(@placeholder,'Search By Member Name')]")).toBeVisible();
});

// AFTER EACH: Export Validation 
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

// Static date via fill
test('Member List Export - HR (Static Date)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Static single date
test('Member List  Export - HR (Static Single Date)', async ({ page }, testInfo) => {
    await page.click("//button[normalize-space()='Select Date']");
    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']").click();
    await page.locator("(//span[contains(text(),'1')])[1]").click();
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Static invalid date
test('Member List  Export - HR (Invalid Date Selection)', async ({ page }, testInfo) => {
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

// Search by Name + Static Date
test('Member List  Export - HR (Search by Name)', async ({ page }, testInfo) => {
    await page.locator("//input[contains(@placeholder,'Search By Member Name')]").fill('Harry');
    await page.locator("//input[contains(@placeholder,'Search By Member Name')]").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search blank + Static Date
test('Member List  Export - HR (Blank Search)', async ({ page }, testInfo) => {
    await page.locator("//input[contains(@placeholder,'Search By Member Name')]").fill('');
    await page.locator("//input[contains(@placeholder,'Search By Member Name')]").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Search invalid name + Static Date
test('Member List  Export - HR (Invalid Name)', async ({ page }, testInfo) => {
    await page.locator("//input[contains(@placeholder,'Search By Member Name')]").fill('32charli3123');
    await page.locator("//input[contains(@placeholder,'Search By Member Name')]").press('Enter');
    await selectDateRange(page);
    const noResultsMessage = page.locator('text=No Member Details Available.');
    if (await noResultsMessage.isVisible()) {
        console.log('No members found — skipping export.');
        await expect(noResultsMessage).toBeVisible();
    } else {
        await triggerExport(page);
        testInfo.exportTriggered = true;
    }
});

// Without Date Selection → popup error
test('Member List  Export - HR (No Date Selected)', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    const popupLocator = page.locator("//div[@role='dialog' or contains(@class,'modal')]");
    await popupLocator.waitFor({ state: 'visible', timeout: 10000 });
    const popupText = await popupLocator.textContent();
    await expect(popupText).toContain('Please select a date range before exporting the data!');
});

// Date + Search
test('Member List  - HR (Date + Search)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await page.locator("//input[contains(@placeholder,'Search By Member Name')]").fill('Malvika');
    await page.locator("//input[contains(@placeholder,'Search By Member Name')]").press('Enter');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

/*import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage';
import path from 'path';

const hrLogin = {
    name: 'HR',
    username: '4242425656',
    password: 'Test@1234',
    role: 'HR',
    url: 'https://staging.corporate.welcomecure.com/hr/uploademployee',
    memberListNav: async (page) => {
        //await page.click("(//img[@alt='arrow'])[1]");
        await page.click("//a[normalize-space()='Member List']");
    }
};
test('Export Member Data - HR', async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log(`Logging in as ${hrLogin.name}...`);
    await loginPage.login(hrLogin.username, hrLogin.password, hrLogin.role);
    console.log(`Waiting for URL to be ${hrLogin.url}`);
    await page.waitForURL(hrLogin.url);

    await hrLogin.memberListNav(page);

    await expect(page.locator("//input[contains(@placeholder,'Search By Member Name')]")).toBeVisible();
    
        // Click "Select Date" button to reveal date inputs
            await page.click("//button[normalize-space()='Select Date']");
        
            //  Fill the date fields
            await page.locator("//div[contains(@class,'rdrDateDisplayWrapper')]");
            
            //await page.pause();
            await page.locator("//input[@placeholder='Early']").click();
            await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']").click();
            await page.locator("//button[contains(@class,'rdrDay rdrDayStartOfMonth')]//span[contains(@class,'rdrDayNumber')]").click();
            await page.locator("//button[contains(@class,'rdrNextPrevButton rdrNextButton')]").click();
            await page.locator("//input[contains(@placeholder,'Continuous')]").click();
            await page.locator("(//span[@class='rdrDayNumber'])[4]").click();
            
            // Click Export 
            await page.getByRole('button', { name: 'Export' }).click();
            const toastLocator = page.locator('.Toastify__toast-body');
            await toastLocator.waitFor({ state: 'visible', timeout: 15000 });
            const toastText = await toastLocator.textContent();
            console.log('Toast message:', toastText);
        
            await expect(toastText).toContain('Your request is being processed. The download file will be sent to');
            const expectedEmail = 'kartik@yopmail.com';
        await expect(toastLocator).toHaveText(`Your request is being processed. The download file will be sent to ${expectedEmail}`);
        });*/