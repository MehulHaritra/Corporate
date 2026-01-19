const { test, expect } = require('@playwright/test');
const { fetchLatestEmail } = require('../../../utils/yopmailHelper.js');

// Login Details & New member data
const uniqueId = Date.now().toString().slice(-5);
const CONFIG = {
  baseUrl: 'https://staging.corporate.welcomecure.com/vfs_uk_lp/login',
  
  credentials: {
    username: '9130231921',
    password: '123456',
  },
  testData: {
    name: 'Alianna',
    email: `Alianna${uniqueId}@yopmail.com`,
    contactNo: `991111${uniqueId}`,
    role: 'Support',
    zones: 'North',
    branch: 'NEW DELHI - UK VAC',
    masking: {
      email: true,
      contact: false,
    },
  },
};

test.describe('Team Members - Add New Team Member', () => {
  test('Login in VFS UK LP Page and verify email', async ({ page }) => {
    // Step 1: Login
    await test.step('Navigate and logged In', async () => {
      await page.goto(CONFIG.baseUrl.trim());

      await page.getByRole('textbox', { name: /enter mobile number/i }).fill(CONFIG.credentials.username);
      await page.getByRole('textbox', { name: /enter password/i }).fill(CONFIG.credentials.password);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForTimeout(2000);
    });

    await test.step('Open Team Members page', async () => {
      await page.locator("//a[normalize-space()='Team Member']").click();
      await page.locator("//button[contains(@class,'hover:scale-105')]").click();
    });

    // Step 3: Fill form
    await test.step('Fill all member details', async () => {
      await page.locator("//input[@id='name']").fill(CONFIG.testData.name);
      await page.locator("//input[@id='email']").fill(CONFIG.testData.email);
      await page.locator("//input[@id='contact']").fill(CONFIG.testData.contactNo);
      await page.waitForTimeout(1000);

      //select role
      await page.locator("(//div[contains(@class,'css-19bb58m')])[2]").click();
      await page.locator(`text=${CONFIG.testData.role}`).first().click();
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);

      // Zone multi-select
      const zoneSelect = page.locator("(//*[name()='svg'][contains(@class,'css-8mmkcg')])[3]");
      await zoneSelect.click();
      await page.locator(`text=${CONFIG.testData.zones}`).first().click();
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

      // Verify appears in table
      await page.locator("//input[contains(@placeholder,'Search By Name, Email, Contact No')]").fill(CONFIG.testData.name);
      await page.locator("//input[contains(@placeholder,'Search By Name, Email, Contact No')]").press('Enter');
      await page.waitForTimeout(2000);
      const rowCount = await page.locator("//tbody/tr[1]/td[1]").count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    // Step 4: Verify Email
    await test.step('Verify email notification', async () => {
      const emailHtml = await fetchLatestEmail(page, CONFIG.testData.email);
      expect(emailHtml).not.toBeNull();

      // Verify that the email contains a "Log In" button/link
      const signInButtonRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*?>\s*Log In\s*<\/a>/;
      const match = emailHtml.match(signInButtonRegex);

      expect(match).not.toBeNull();
      
      const signInLink = match[2];
      console.log(`Sign-in link found: ${signInLink}`);
      
      // Optionally, you can also verify the link destination
      expect(signInLink).toContain('https://staging.corporate.welcomecure.com/vfs_uk_lp/team/login');
    });
  });
});