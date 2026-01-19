// For - add member flow - pages/LoginPage.js
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.mobileInput = 'input[placeholder="Enter Mobile Number"]';
    this.passwordInput = 'input[placeholder="Enter Password"]';
    this.loginTypeDropdown = '//div[contains(text(), "Select Login Type")]';
    this.loginButton = 'button:has-text("Sign In")';
  }

  async login(mobile, password, loginType) {
    await this.navigate('https://staging.corporate.welcomecure.com/login');
    await this.type(this.mobileInput, mobile);
    await this.type(this.passwordInput, password);
    if (loginType) {
      await this.click(this.loginTypeDropdown);
      await this.click(`//div[text()="${loginType}"]`);
    }
    await this.click(this.loginButton);
    await this.page.waitForNavigation();
  }
}

module.exports = LoginPage;
