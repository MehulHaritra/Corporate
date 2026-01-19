const { expect } = require('@playwright/test');

const YOPMAIL_URL = 'https://yopmail.com/en/';

/**
 * Fetches the most recent email for a given email address from Yopmail.
 * @param {import('@playwright/test').Page} page - The Playwright page object.
 * @param {string} email - The Yopmail email address to check.
 * @param {number} timeout - The maximum time to wait for an email in milliseconds.
 * @returns {Promise<string|null>} The HTML content of the email body, or null if not found.
 */
async function fetchLatestEmail(page, email, timeout = 60000) { // Increased timeout to 60 seconds
  const startTime = Date.now();

  await page.goto(YOPMAIL_URL);
  await page.locator('#login').fill(email);
  await page.locator('#refreshbut button').click(); // Corrected selector
  await page.waitForTimeout(10000); // Increased initial wait time
  await page.locator("//button[@id='refresh']").click(); // Click a second time as requested


  while (Date.now() - startTime < timeout) {
    try {
      await page.reload();
      console.log('[yopmailHelper] Refreshed inbox');

      // Wait for the iframe to load and switch to its context
      const emailFrame = page.frameLocator('#ifmail');
      await emailFrame.locator('body').waitFor({ state: 'visible', timeout: 15000 });

      const latestEmailLink = emailFrame.locator('a').first(); // Look for any link within the iframe
      const href = await latestEmailLink.getAttribute('href');
      console.log(`[yopmailHelper] Latest email link: ${href}`);

      if (href) {
        await latestEmailLink.click();
        const emailBodyHtml = await emailFrame.locator('body').innerHTML(); // Get content from iframe body
        console.log(`[yopmailHelper] Email body HTML: ${emailBodyHtml ? emailBodyHtml.substring(0, 100) + '...' : 'null'}`);
        return emailBodyHtml;
      }
    } catch (error) {
      console.error('[yopmailHelper] Error fetching email:', error);
    }

    // Wait for a short period before retrying
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('[yopmailHelper] Timeout reached, no email found.');
  return null;
}

module.exports = { fetchLatestEmail };