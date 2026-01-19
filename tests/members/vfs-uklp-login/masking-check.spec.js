const { test, expect } = require('@playwright/test');

test.describe('Masking functionality', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test('should mask email and contact number', async () => {
    // Login
    await page.goto('https://staging.corporate.welcomecure.com/vfs_uk_lp/login');
    await page.type('input[placeholder="Enter Mobile Number"]', '9130231921');
    await page.type('input[placeholder="Enter Password"]', '123456');
    await page.click('button:has-text("Sign In")');
    await page.waitForNavigation();

    // Go to team member page
    await page.goto('https://staging.corporate.welcomecure.com/vfs_uk_lp/branch');
    await page.locator("//a[normalize-space()='Team Member']").click();
    await page.waitForURL('https://staging.corporate.welcomecure.com/vfs_uk_lp/role');

    // Click on Add button
    await page.locator("//button[normalize-space()='Add']").click();

    const uniqueId = Date.now().toString().slice(-5);
    const CONFIG = {
        testData: {
    name: 'Karan',
    email: `Karan${uniqueId}@yopmail.com`,
    contactNo: `991111${uniqueId}`,
    role: 'Sales',
    zones: 'WEST',
    branch: 'PUNE - UK VAC',
    masking: {
      email: true,
      contact: false,
    },
  }
}
    await test.step('Fill all member details', async () => {
          await page.locator('input[name="name"]').fill(CONFIG.testData.name);
          await page.locator('input[name="email"]').fill(CONFIG.testData.email);
          await page.locator('input[name="contact"]').fill(CONFIG.testData.contactNo);
          await page.waitForTimeout(1000);
    
          
          // Zone multi-select
          const zoneSelect = page.locator("(//*[name()='svg'][contains(@class,'css-8mmkcg')])[3]");
          await zoneSelect.click();
          await page.locator(`div[id^="react-select-"][id$="-option-0"]:has-text("${CONFIG.testData.zones}")`).first().click();
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);

          //select role
          await page.locator("(//div[contains(@class,'css-19bb58m')])[2]").click();
         
          await page.getByText(CONFIG.testData.role).nth(0).waitFor();
          await page.getByText(CONFIG.testData.role).nth(0).click();
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1000);
    
    
          // Select Branch
          const branchSelect = page.locator("(//*[name()='svg'][contains(@class,'css-8mmkcg')])[5]");
          await branchSelect.click();
          await page.locator(`text="${CONFIG.testData.branch}"`).first().click();
          await page.keyboard.press('Escape');
    
          // Masking
          const emailCheckbox = page.getByRole('checkbox', { name: 'Email' });
          const contactCheckbox = page.getByRole('checkbox', { name: 'Contact' });
          await emailCheckbox.setChecked(CONFIG.testData.masking.email);
          await contactCheckbox.setChecked(CONFIG.testData.masking.contact);
          await page.waitForTimeout(2000);
    
          // Save Data
          await page.locator("//button[normalize-space()='Save']").click();
          await page.waitForTimeout(2000);
    });

    // Open yopmail
    const newPage = await page.context().newPage();
    await newPage.goto('https://yopmail.com/');
    await newPage.getByPlaceholder('Enter your inbox here').fill(CONFIG.testData.email);
    await newPage.getByRole('button', { name: 'Check Inbox' }).click();
    
    const mailFrame = newPage.frameLocator('iframe[name="ifmail"]');
    await mailFrame.getByRole('link', { name: 'Log in' }).click();
    
    const [memberPage] = await Promise.all([
        newPage.waitForEvent('popup'),
    ]);

    // Sign in as member
    await memberPage.click('button:has-text("Sign In")');
    await page.goto("https://staging.corporate.welcomecure.com/vfs_uk_lp/team/login");
    await page.locator("//button[@type='submit']").click();

    // Check masking on member list panel
    const emailOnPage = await memberPage.locator(`text=${CONFIG.testData.email}`).textContent();
    expect(emailOnPage).toContain('******');
  });
});
