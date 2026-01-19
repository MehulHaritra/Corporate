const BasePage = require('./BasePage');

class RegisterFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.nameField = '#name';
    this.emailField = '#email';
    this.mobileField = '#contact';
    this.travelStartDateField = '#journeyDate';
    this.calendarIcon = "//input[@id='journeyDate']";
    this.sourceCountry = '#sourceCountry';
    this.destinationCountry = '#destinationCountry';
    this.checkbox1 = 'div:has(span:has-text("I here by agree")) > input';
    this.checkbox2 = "//input[contains(@class,'w-5 h-5 min-w-[20px] min-h-[20px] mt-1 sm:mt-0')]";
    this.submitButton = 'button[type="submit"]';
    this.errorMessages = '.error-message';
    this.disclaimerLink = 'text=Disclaimer';
  }
async scrollToForm() {
  const formLocator = '#register';
  await this.page.waitForSelector(formLocator, { state: 'visible', timeout: 60000 });
  await this.page.locator(formLocator).scrollIntoViewIfNeeded();
}

  async enterName(name) { await this.type(this.nameField, name); }
  async enterEmail(email) { await this.type(this.emailField, email); }
  async enterMobile(mobile) { await this.type(this.mobileField, mobile); }
  
  async enterTravelStartDate(dateString) {
    const [day, month, year] = dateString.split('/');
    await this.click(this.calendarIcon);

    const targetDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const currentDate = new Date();
    currentDate.setDate(1); 

    const monthDiff = (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + (targetDate.getMonth() - currentDate.getMonth());

    if (monthDiff > 0) {
      const nextButton = this.page.locator("//button[@class='rdrNextPrevButton rdrNextButton']");
      for (let i = 0; i < monthDiff; i++) {
        await nextButton.click();
      }
    }
    
    const dayLocator = `//button[contains(@class, 'rdrDay') and not(contains(@class, 'rdrDayPassive'))]//span[text()='${parseInt(day, 10)}']`;
    await this.page.locator(dayLocator).first().click();
  }

  async selectSourceCountry(country) { await this.selectReactSelectOption(this.sourceCountry, country); }
  async selectDestinationCountry(country) { await this.selectReactSelectOption(this.destinationCountry, country); }

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