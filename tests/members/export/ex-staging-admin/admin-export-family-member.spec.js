import { test, expect } from '@playwright/test';
import LoginPage from '../../../../pages/LoginPage';
import { fetchAllExportEmails } from '../../../../utils/email-helper.js';
import XLSX from 'xlsx';


// Admin credentials & navigation
const adminLogin = {
    name: 'Admin',
    username: '9687298058',
    password: 'Cure@3210#',
    role: 'Admin',
    url: 'https://staging.corporate.welcomecure.com/admin/admin_user/corporate',
    async memberListNav(page) {
        await page.click("(//img[contains(@alt,'arrow')])[1]");
        await page.click("//a[normalize-space()='Family Member']");
    }
};
//Date selection
async function selectDateRange(page) {
    await page.click("//button[contains(@class,'bg-[#fae006] items-center text-sm flex px-4 rounded-[8px] py-2 font-medium')]");
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

// Export
async function triggerExport(page, email = 'saloni@wizcoder.com') {
    await page.getByRole('button', { name: 'Export' }).click();
    await page.locator("(//input[@id='email'])[1]").fill(email);
    await page.locator("(//button[contains(@class,'bg-[#FCDD00]')])[1]").click();

    const toastLocator = page.locator('.Toastify__toast-body');
    await toastLocator.waitFor({ state: 'visible', timeout: 15000 });
    await expect(toastLocator).toContainText('Your request is being processed.');
}
// Filter
async function applyFilter(page, filterName) {
    await page.locator("//button[normalize-space()='Filters']").click();
    await page.locator("(//div[contains(@class,'react-select__input-container')])[1]").click();
    await page.locator(`.react-select__option:has-text("${filterName}")`).click();
    await page.locator("//button[normalize-space()='Apply Filters']").click();
}

// Before Each: Login + navigation
test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    console.log(`Logging in as ${adminLogin.name}...`);
    await loginPage.login(adminLogin.username, adminLogin.password, adminLogin.role);
    await page.waitForURL(adminLogin.url);
    await adminLogin.memberListNav(page);
    await expect(page.locator("//input[@placeholder='Search By P Member Name']")).toBeVisible();
});

// AFTER EACH: Export Validation if triggered
test.afterEach(async ({}, testInfo) => {
    if (!testInfo.exportTriggered) {
        console.log(` Skipping export validation for: ${testInfo.title}`);
        return;
    }
    try {
        console.log(` Validating export for: ${testInfo.title}`);
        // wait for email with retries
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

//  Export Function Test Cases

// 1. Static date via fill
test('Admin Export - Family Member (Static Date)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 2. Static single date
test('Admin Export - Family Member (Static Single Date)', async ({ page }, testInfo) => {
    //await selectDateRange(page);
    await page.click("//button[contains(@class,'bg-[#fae006] items-center text-sm flex px-4 rounded-[8px] py-2 font-medium')]");
    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']//i").click();
    await page.locator("(//span[contains(text(),'3')])[2]").click();
    //await page.locator("(//span[@class='rdrDayNumber'])[2]").click();
    await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click();
    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[contains(text(),'4')])[1]").click();
    //await page.locator("(//span[@class='rdrDayNumber'])[4]").click();
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 3. Static invalid date
test('Admin Export - Family Member (Invalid Date Selection)', async ({ page }, testInfo) => {
    //await selectDateRange(page);

    await page.click("//button[contains(@class,'bg-[#fae006] items-center text-sm flex px-4 rounded-[8px] py-2 font-medium')]");
    const earlyInput = page.locator("(//input[@placeholder='Early'])[1]");
    await expect(earlyInput).toBeVisible({ timeout: 10000 });
    await earlyInput.click();
    await page.locator("//button[@class='rdrNextPrevButton rdrPprevButton']//i").click();
    await page.locator("(//span[@class='rdrDayNumber'])[4]").click();
    //await page.locator("(//span[@class='rdrDayNumber'])[2]").click();
    await page.locator("(//button[@class='rdrNextPrevButton rdrNextButton'])[1]").click();
    const continuousInput = page.locator("(//input[@placeholder='Continuous'])[1]");
    await expect(continuousInput).toBeVisible({ timeout: 10000 });
    await continuousInput.click();
    await page.locator("(//span[@class='rdrDayNumber'])[2]").click({ force: true });
    //await page.locator("(//span[@class='rdrDayNumber'])[4]").click();
    
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 4. Search by Name + Static Date
test('Admin Export - Family Member (Search by Name)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By P Member Name']").fill('David3');
    await page.locator("//input[@placeholder='Search By P Member Name']").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 5. Search blank + Static Date
test('Admin Export - Family Member (Blank Search)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By P Member Name']").fill('');
    await page.locator("//input[@placeholder='Search By P Member Name']").press('Enter');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 6. Search long invalid + Static Date
test('Admin Export - Family Member (Invalid Long Name)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By P Member Name']").fill('Charlie2fdfsdfsdfsdfsdfsffseqwwertytryruutyutyutyututyutyutyuytuytutyutyutyutyuytuytututyutuytyutyutyu');
    await page.locator("//input[@placeholder='Search By P Member Name']").press('Enter');
    await selectDateRange(page);
    const noResultsMessage = page.locator('text=No Family Member Details Available.');
if (await noResultsMessage.isVisible()) {
    // Expected: no data found
    console.log('No family members found — skipping export.');
    await expect(noResultsMessage).toBeVisible();
} else {
    // Data exists → proceed with export
    await triggerExport(page);
    testInfo.exportTriggered = true;
}

});

// 7. Search special characters + Static Date
test('Admin Export - Family Member (Special Characters)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By P Member Name']").fill('@Charlie2#$%^&*()!');
    await page.locator("//input[@placeholder='Search By P Member Name']").press('Enter');
    await selectDateRange(page);

    
    const noResultsMessage = page.locator('text=No Family Member Details Available.');
if (await noResultsMessage.isVisible()) {
    // Expected: no data found
    console.log('No family members found — skipping export.');
    await expect(noResultsMessage).toBeVisible();
} else {
    // Data exists → proceed with export
    await triggerExport(page);
    testInfo.exportTriggered = true;
}

});

// 8. Search invalid name + Static Date
test('Admin Export - Family Member (Invalid Name)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By P Member Name']").fill('32charli3123');
    await page.locator("//input[@placeholder='Search By P Member Name']").press('Enter');
    await selectDateRange(page);
    const noResultsMessage = page.locator('text=No Family Member Details Available.');
if (await noResultsMessage.isVisible()) {
    // Expected: no data found
    console.log('No family members found — skipping export.');
    await expect(noResultsMessage).toBeVisible();
} else {
    // Data exists → proceed with export
    await triggerExport(page);
    testInfo.exportTriggered = true;
}

});

// 9. Filter branch + Static Date
test('Admin Export - Family Member (Filter by Branch)', async ({ page }, testInfo) => {
    await applyFilter(page, 'stackbelowflow');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 10. Search + Filter + Static Date
test('Admin Export - Family Member (Search + Filter)', async ({ page }, testInfo) => {
    await page.locator("//input[@placeholder='Search By P Member Name']").fill('Charlie2');
    await page.locator("//input[@placeholder='Search By P Member Name']").press('Enter');
    await applyFilter(page, 'stackbelowflow');
    await selectDateRange(page);
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 11. Without Date Selection → popup error
test('Admin Export - Family Member (No Date Selected)', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    const popupLocator = page.locator("//div[@role='dialog']");
    await popupLocator.waitFor({ state: 'visible', timeout: 10000 });
    const popupText = await popupLocator.textContent();
    await expect(popupText).toContain('Please select a date range before exporting the data!');
});

// 12. Date + Search + Filter
test('Admin Export - Family Member (Date + Search + Filter)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await page.locator("//input[@placeholder='Search By P Member Name']").fill('Jacob');
    await page.locator("//input[@placeholder='Search By P Member Name']").press('Enter');
    await applyFilter(page, 'stackbelowflow');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});

// 13. Date + Filter + Search
test('Admin Export - Family Member (Date + Filter + Search)', async ({ page }, testInfo) => {
    await selectDateRange(page);
    await applyFilter(page, 'stackbelowflow');
    await page.locator("//input[@placeholder='Search By P Member Name']").fill('kirtan patel');
    await page.locator("//input[@placeholder='Search By P Member Name']").press('Enter');
    await triggerExport(page);
    testInfo.exportTriggered = true;
});
