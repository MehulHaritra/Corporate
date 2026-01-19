import { test, expect } from '@playwright/test';
import LoginPage from '../../../../pages/LoginPage';
import XLSX from 'xlsx';
import { fetchAllExportEmails } from '../../../../utils/email-helper.js';

// Login Details
const adminLogin = {
    name: 'Admin',
    username: '9687298058',
    password: 'Cure@3210#',
    role: 'Admin',
    url: 'https://staging.corporate.welcomecure.com/admin/admin_user/corporate',

    async paymentFailedNav(page) {
        await page.click("(//img[contains(@alt,'arrow')])[2]");
        await page.waitForSelector("//span[normalize-space()='VFS UK OMAN']");
        await page.click("//span[normalize-space()='VFS UK OMAN']");
        await page.click("//a[normalize-space()='Payment Failed']");
    }
};

// Select Date function
async function selectDateRange(page) {
    await page.click("//button[normalize-space()='Select Date']");

    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();

    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']//i").click();
    await page.locator("(//span[contains(@class,'rdrDayNumber')])[4]").click();

    await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click();

    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[contains(@class,'rdrDayNumber')])[10]").click();
}

/**
 * Select payment status from dropdown
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {'Pending' | 'Failed'} status - Payment status to select
 */
async function selectStatus(page, status) {
    if (status !== 'Pending' && status !== 'Failed') {
        throw new Error(`Invalid status: ${status}. Must be 'Pending' or 'Failed'`);
    }
   await page.locator("(//*[name()='svg'][contains(@class,'css-8mmkcg')])[1]").click();
    if (status === 'Pending') {
        
        await page.getByText('Pending', { exact: true }).click();
    } else if (status === 'Failed') {
        
        await page.getByText('Failed', { exact: true }).click();
    }
}

// Export Function
async function triggerExport(page, email = 'saloni@wizcoder.com') {
    await page.getByRole('button', { name: 'Export' }).click();
    await page.locator("(//input[@id='email'])[1]").fill(email);

    await page.locator("(//button[contains(@class,'w-full bg-[#FCDD00]')])[1]").click();

    const toastLocator = page.locator('.Toastify__toast-body');
    await toastLocator.waitFor({ state: 'visible', timeout: 15000 });
    const toastText = await toastLocator.textContent();
    console.log('Toast message:', toastText);

    const expectedText = `Your request is being processed. The download file will be sent to ${email}`;
    await expect(toastLocator).toHaveText(expectedText);
}

// Before each : login 
test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log(`Logging in as ${adminLogin.name}...`);

    await loginPage.login(adminLogin.username, adminLogin.password, adminLogin.role);
    await page.waitForURL(adminLogin.url);

    await adminLogin.paymentFailedNav(page);
    await expect(page.locator("//button[normalize-space()='Select Date']")).toBeVisible();
});

// After each: export validation
test.afterEach(async ({}, testInfo) => {
    if (!testInfo.exportTriggered) return;

    try {
        console.log(`Validating export for: ${testInfo.title}`);
        let attachmentPaths;

        for (let i = 0; i < 6; i++) {
            try {
                attachmentPaths = await fetchAllExportEmails(testInfo.title);
                if (attachmentPaths && attachmentPaths.length > 0) break;
            } catch (err) {
                console.log(`Attempt #${i + 1} failed: ${err.message}`);
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
            console.log(`Exported records count for "${testInfo.title}":`, data.length);
            expect(data.length).toBeGreaterThan(0);
        }
    } catch (err) {
        console.error('Error in export validation:', err);
    }
});

// Test cases

// Static Date Export
test.skip('Admin Export - VFS UK OMAN (Static Date)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Static Single Date
test.skip('Admin Export - VFS UK OMAN (Static Single Date)', async ({ page }, testInfo) => {
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

// Status → Pending + Date Export
test.skip('Admin Export - VFS UK OMAN (Pending Payments)', async ({ page }, testInfo) => {
    await selectStatus(page, 'Pending');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// Status → Failed + Date Export
test('Admin Export - VFS UK OMAN (Failed Payments)', async ({ page }, testInfo) => {
    //await page.pause();
    await selectStatus(page, 'Failed');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// No Date Selected → Validation Popup
test.skip('Admin Export - VFS UK OMAN (No Date Selected)', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    const popupLocator = page.locator("//div[@role='dialog']");
    await popupLocator.waitFor({ state: 'visible', timeout: 10000 });
    const popupText = await popupLocator.textContent();
    await expect(popupText).toContain('Please select a date range before exporting the data!');
});



/*
import { test, expect } from '@playwright/test';
import LoginPage from '../../../pages/LoginPage';

const adminLogin = {
    name: 'Admin',
    username: '9687298058',
    password: 'Cure@3210#',
    role: 'Admin',
    url: 'https://staging.corporate.welcomecure.com/admin/admin_user/corporate',
    memberListNav: async (page) => {
    await page.click("(//img[contains(@alt,'arrow')])[2]");
    await page.waitForSelector("//span[normalize-space()='VFS UK INDIA']");
    await page.click("//span[normalize-space()='VFS UK INDIA']");
    await page.click("//a[normalize-space()='Payment Failed']");
}
};

test('Admin Export - VFS UK INDIA - Payment Failed', async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log(`Logging in as ${adminLogin.name}...`);
    await loginPage.login(adminLogin.username, adminLogin.password, adminLogin.role);
    await page.waitForURL(adminLogin.url);

    await adminLogin.memberListNav(page);
            //await expect(page.locator("//input[@placeholder='Search By Member, Email, Contact No']")).toBeVisible();
    
        // Click "Select Date" button to reveal date inputs
            await page.click("//button[normalize-space()='Select Date']");
        
            //  Fill the date fields
            await page.locator("(//div[@class='rdrDateDisplayWrapper'])[1]");
            
            //await page.pause();
            await page.locator("(//input[@placeholder='Early'])[1]").click();
            await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']//i").click();
            await page.locator("(//span[@class='rdrDayNumber'])[2]").click();
            await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click();
            await page.locator("(//input[@placeholder='Continuous'])[1]").click();
            await page.locator("(//span[@class='rdrDayNumber'])[4]").click();
            
            // Click Export 
            await page.getByRole('button', { name: 'Export' }).click();
            await page.locator("(//input[@id='email'])[1]").fill('saloni@wizcoder.com');
            await page.locator("(//button[@class='w-full bg-[#FCDD00] text-black py-3 px-4 rounded-lg hover:bg-[#FCDD00] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium'])[1]").click();
            
            const toastLocator = page.locator('.Toastify__toast-body');
            await toastLocator.waitFor({ state: 'visible', timeout: 15000 });
            const toastText = await toastLocator.textContent();
            console.log('Toast message:', toastText);
        
            await expect(toastText).toContain('Your request is being processed. The download file will be sent to');
            const expectedEmail = 'saloni@wizcoder.com';
        await expect(toastLocator).toHaveText(`Your request is being processed. The download file will be sent to ${expectedEmail}`);
        });*/
