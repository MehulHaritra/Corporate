const { test, expect } = require('@playwright/test');
const RegisterFormPage = require('../../pages/RegisterFormPage');
const RazorpayPage = require('../../pages/RazorpayPage');
const ThankYouPage = require('../../pages/ThankYouPage');
const testData = require('../../data/testData.json');
const { BASE_URL } = require('../../utils/helpers');
const fs = require('fs');

test.describe('Payment Tests', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    const registerPage = new RegisterFormPage(page);
    await registerPage.navigate(BASE_URL);
    await page.waitForLoadState('networkidle');
    await registerPage.scrollToForm();
    await registerPage.enterName(testData.name.positive[0]);
    await registerPage.enterEmail(testData.email.positive[0]);
    await registerPage.enterMobile(testData.mobile.positive[0]);
    await registerPage.selectSourceCountry(testData.countries.source);
    await registerPage.selectDestinationCountry(testData.countries.destination);
    await registerPage.checkCheckbox1();
    await registerPage.checkCheckbox2();
    await registerPage.submitForm();
  });
});
