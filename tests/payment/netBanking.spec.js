// tests/neBanking.spec.js
const { test, expect } = require('@playwright/test');
const RegisterFormPage = require('../../pages/RegisterFormPage');
const RazorpayPage = require('../../pages/RazorpayPage');
const ThankYouPage = require('../../pages/ThankYouPage');
const fs = require('fs');

const BASE_URL = 'https://staging.onevasco.welcomecure.online/in-chandigarh?lang=en-US&dir=ltr';

const testData = {
  name: 'tushar',
  email: 'tushar101@yopmail.com',
  mobile: '9328221950',
  JourneyDate : '20-06-2026',
  countries: { source: 'India', destination: 'United States' },
  // SelectSalesPerson : {Person : 'Rajesh'},
};

test.describe('NetBanking Payment Functional Test', () => {

  test('Complete registration and payment with NetBanking - success', async ({ page }) => {
    const registerPage = new RegisterFormPage(page);
    const razorpayPage = new RazorpayPage(page);
    const thankYouPage = new ThankYouPage(page);

    // Navigate and fill form
    await registerPage.navigate(BASE_URL);
    await page.waitForLoadState('networkidle');
    await registerPage.scrollToForm();
    await registerPage.enterName(testData.name);
    await registerPage.enterEmail(testData.email);
    // await registerPage.enterMobile(testData.mobile); 
     await registerPage.enterJourneydate(testData.JourneyDate);
    // await registerPage.selectSourceCountry(testData.countries.source);
    await registerPage.selectDestinationCountry(testData.countries.destination);
    // await registerPage.selectSalesPerson(testData.SelectSalesPerson.Person);
    await registerPage.checkCheckbox1();
    await registerPage.checkCheckbox2();
    await registerPage.submitForm();

    // Complete NetBanking Payment
    await razorpayPage.completeNetBankingPayment(testData.mobile, true);
    
    // Thank You page validation
    await page.waitForNavigation({ url: /thankyou/ });
    const thankYouMsg = await thankYouPage.getThankYouMessage();
    expect(thankYouMsg).toContain('Payment Successful!');
    const receiptPath = await thankYouPage.downloadReceipt();
    expect(fs.existsSync(receiptPath)).toBeTruthy();
    await thankYouPage.goToHome();
    expect(page.url()).toContain('in-chandigarh');
  });

  /*test('Complete registration and payment with NetBanking - failure', async ({ page }) => {
    const registerPage = new RegisterFormPage(page);
    const razorpayPage = new RazorpayPage(page);

    // Navigate and fill form
    await registerPage.navigate(BASE_URL);
    await page.waitForLoadState('networkidle');
    await registerPage.scrollToForm();
    await registerPage.enterName(testData.name);
    await registerPage.enterEmail(testData.email);
    await registerPage.enterMobile(testData.mobile);
    await registerPage.selectSourceCountry(testData.countries.source);
    await registerPage.selectDestinationCountry(testData.countries.destination);
    await registerPage.checkCheckbox1();
    await registerPage.checkCheckbox2();
    await registerPage.submitForm();

    // Complete NetBanking Payment
    await razorpayPage.completeNetBankingPayment(testData.mobile, false);

    // Assert that the payment failed and we are still on the payment page
    expect(page.url()).toContain('razorpay');
  });*/
});
