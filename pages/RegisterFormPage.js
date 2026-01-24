// pages/RegisterFormPage.js
const BasePage = require('./BasePage');

class RegisterFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.nameField = '#name';
    this.emailField = '#email';
    this.mobileField = '#contact';
    this.JourneyDate = '#journey_date';
    this.sourceCountry = '#sourceCountry';
    // this.destinationCountry = '#destinationCountry';
    // Target only the container div
  this.destinationCountry = 'div#destinationCountry[class*="container"]';
    this.SelectSalesPerson = '#react-select-Sales-input';
    this.checkbox1 = '#checkbox';
    this.checkbox2 = '#teamConditionCheckbox';
    this.submitButton = 'button[type="submit"]';
    this.errorMessages = '.error-message';
    this.disclaimerLink = 'text=Disclaimer';
  }
async scrollToForm() {
  const formLocator = '#register';
  await this.page.waitForSelector(formLocator, { state: 'visible', timeout: 60000 });
  await this.page.locator(formLocator).scrollIntoViewIfNeeded();
}

  async  enterName(name) { await this.type(this.nameField, name); }
  async enterEmail(email) { await this.type(this.emailField, email); }
  async enterMobile(mobile) { await this.type(this.mobileField, mobile); }
  
  async enterJourneydate(Journey) { await this.type(this.JourneyDate, Journey); }
  
  
  // async selectDestinationCountry(country) { await this.selectReactSelectOption(this.destinationCountry,country); }
  
  async selectDestinationCountry(country) { 
  // Click to open dropdown - use .first()
  await this.page.locator(this.destinationCountry).first().click();
  await this.page.waitForTimeout(500);
  await this.page.getByText(country, { exact: true }).click();
}
  // async selectSalesPerson(Person) { await this.selectReactSelectOption(this.SelectSalesPerson, Person); }
  async checkCheckbox1() { await this.check(this.checkbox1); }
  async checkCheckbox2() { await this.check(this.checkbox2); }

  async submitForm() { await this.click(this.submitButton); }
  async getErrors() { return await this.page.locator(this.errorMessages).allTextContents(); }

  async clickDisclaimer() {
    await this.click(this.disclaimerLink);
  }

  async closeDisclaimerModal() {
    await this.page.locator('div.flex:has(div:has-text("Disclaimer")) > button').click();
  }
}

module.exports = RegisterFormPage;
