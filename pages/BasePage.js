// pages/BasePage.js
class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: 'load' });
  }

  async click(selector) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 60000 });
    await this.page.click(selector);
  }

  async type(selector, text) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 60000 });
    await this.page.fill(selector, text);
  }

  async getText(selector) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 60000 });
    return await this.page.locator(selector).textContent();
  }

  async isVisible(selector) {
    return await this.page.locator(selector).isVisible();
  }

  async selectOption(selector, value) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 60000 });
    await this.page.selectOption(selector, value);
  }

  async selectReactSelectOption(selector, optionText) {
    // await this.page.locator(selector).click();
      // await this.page.getByText(optionText, { exact: true }).click(); 
     
  await this.page.locator(selector).first().click();  // Add .first()
  await this.page.waitForTimeout(500); // Wait for dropdown
  await this.page.getByText(optionText, { exact: true }).click();
}
  
  async check(selector) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 60000 });
    const isChecked = await this.page.isChecked(selector);
    if (!isChecked) await this.page.check(selector);
  }
}

module.exports = BasePage;
