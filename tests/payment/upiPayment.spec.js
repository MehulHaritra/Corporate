// tests/registerForm.spec.js
const { test, expect } = require('@playwright/test');
const RegisterFormPage = require('../../pages/RegisterFormPage');
// const RazorpayPage = require('../../pages/RazorpayPage'); 
const StripePage = require("../../pages/StripePage")
const ThankYouPage = require('../../pages/ThankYouPage');
const fs = require('fs');

const BASE_URL = 'https://staging.corporate.welcomecure.com/vfsukuae?_id=68dccfa8f9a996d15168118d';

const testData = {
  name: { positive: ['Saloni QA'], negative: ['123', '!@#'] },
  email: { positive: ['saloni@yopmail.com'], negative: ['abc.com', 'user@'] },
  mobile: { positive: ['9712738076'], negative: ['123', 'aibcd'] },
  countries: { source: 'India', destination: 'United States' },
  upi: { success: 'success@razorpay', failure: 'failure@razorpay' }
};

test.describe('Register Form Functional Test - Chrome Desktop', () => {

  test('Complete registration flow with all fields', async ({ page }) => {
    const registerPage = new RegisterFormPage(page);
    const razorpayPage = new StripePage(page);
    const thankYouPage = new ThankYouPage(page);
    
    // Navigate and scroll to form
    await registerPage.navigate(BASE_URL);
    await page.waitForLoadState('networkidle');
    await registerPage.scrollToForm();

    // Fill all fields
    await registerPage.enterName(testData.name.positive[0]);
    await registerPage.enterEmail(testData.email.positive[0]);
    await registerPage.enterMobile(testData.mobile.positive[0]);
    await registerPage.selectSourceCountry(testData.countries.source);
    await registerPage.selectDestinationCountry(testData.countries.destination);
    await registerPage.checkCheckbox1();
    await registerPage.checkCheckbox2();

    // Disclaimer link
    await registerPage.clickDisclaimer();
    await registerPage.closeDisclaimerModal();

    // Submit form
    await registerPage.submitForm();

    //Complete UPI Payment
    await razorpayPage.completeUpiPayment(testData.mobile.positive[0], testData.upi.success);

    // Thank You page validation
    await page.waitForNavigation({ url: /thankyou/ });
    const thankYouMsg = await thankYouPage.getThankYouMessage();
          expect(thankYouMsg).toContain('Payment Successful!');
    // Download receipt
    const receiptPath = await thankYouPage.downloadReceipt();
    expect(fs.existsSync(receiptPath)).toBeTruthy();

    // Go to homepage
    await thankYouPage.goToHome();
    expect(page.url()).toContain('vfs_uk');

    });
    
    /*test('Failed registration with failed payment', async ({ page }) => {
    const registerPage = new RegisterFormPage(page);
    const razorpayPage = new RazorpayPage(page);
    
    // Navigate and scroll to form
    await registerPage.navigate(BASE_URL);
    await page.waitForLoadState('networkidle');
    await registerPage.scrollToForm();
    
    // Fill all fields
    await registerPage.enterName(testData.name.positive[0]);
    await registerPage.enterEmail(testData.email.positive[0]);
    await registerPage.enterMobile(testData.mobile.positive[0]);
    await registerPage.selectSourceCountry(testData.countries.source);
    await registerPage.selectDestinationCountry(testData.countries.destination);
    await registerPage.checkCheckbox1();
    await registerPage.checkCheckbox2();
    
    // // Disclaimer link
    await registerPage.clickDisclaimer();
    await registerPage.closeDisclaimerModal();
    
    // Submit form
    await registerPage.submitForm();
    
     // Complete UPI Payment with failing ID
    await razorpayPage.completeUpiPayment(testData.mobile.positive[0], testData.upi.failure);
    
    // Assert that the payment failed and we are still on the payment page
    expect(page.url()).toContain('razorpay');
    });*/

});