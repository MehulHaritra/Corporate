// pages/ThankYouPage.js
const BasePage = require('./BasePage');

class ThankYouPage extends BasePage {
  constructor(page) {
    super(page);
    this.thankYouMessage = 'h1';
    this.downloadReceiptButton = 'text="Download Invoice"';
    this.homeButton = "//button[@class='inline-flex cursor-pointer items-center px-8 py-3 mt-4 font-semibold text-white bg-blue-600 rounded-full shadow-lg transition-all duration-300 transform hover:bg-blue-700 hover:scale-105']";;
  }

  async getThankYouMessage() { return await this.getText(this.thankYouMessage); }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async downloadReceipt() {
    console.log('Attempting to download receipt...');
    await this.scrollToBottom();
    const [ download ] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 60000 }),
      await this.page.locator(this.downloadReceiptButton).waitFor({ state: 'visible' }),
      this.click(this.downloadReceiptButton)
    ]);
    console.log('Receipt download initiated.');
    return await download.path();
  }

  async goToHome() {
    console.log('Attempting to go to home page...');
    await this.page.waitForTimeout(5000); // Wait for 5 seconds for observation
    await this.click(this.homeButton);
    console.log('Clicked home button, waiting for navigation...');
  }
}

module.exports = ThankYouPage;
