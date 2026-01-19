// // tests/cardPayment.spec.js
// const { test, expect } = require('@playwright/test');
// const RegisterFormPage = require('../../pages/RegisterFormPage');
// const RazorpayPage = require('../../pages/RazorpayPage');
// const ThankYouPage = require('../../pages/ThankYouPage');
// const fs = require('fs');

// const BASE_URL = 'https://staging.musafir.welcomecure.online/msf-cure?lang=en-US&dir=ltr';

// const testData = {
//   name: 'Mehul Singh ',
//   email: 'Mehul@yopmail.com',
//   mobile: '9328221950',
//   JourneyDate : '20-06-2026',
//   countries: { source: 'India', destination: 'United States' },
//   SelectSalesPerson : {Person : 'Rajesh'} ,
//   cards: {
//     Mastercard: {
//       cardnumber: '2305 3242 5784 8228',
//       mmyy: '11/27',
//       cvv: '111'
//     }
//   }
  
// };

// test.describe('Card Payment Functional Test', () => {

//   test('Complete registration and payment with domestic card - success', async ({ page }) => {
//     const registerPage = new RegisterFormPage(page);
//     const razorpayPage = new RazorpayPage(page);
//     const thankYouPage = new ThankYouPage(page);

//     // Navigate and fill form
//     await registerPage.navigate(BASE_URL);
//     await page.waitForLoadState('networkidle');
//     await registerPage.scrollToForm();
//     await registerPage.enterName(testData.name);
//     await registerPage.enterEmail(testData.email);
//     await registerPage.enterMobile(testData.mobile);
//     await registerPage.enterJourneydate(testData.JourneyDate);
//     // await registerPage.selectSourceCountry(testData.countries.source);
//     await registerPage.selectDestinationCountry(testData.countries.destination);
//     await registerPage.selectSalesPerson(testData.SelectSalesPerson.Person);
//     await registerPage.checkCheckbox1();
//     await registerPage.checkCheckbox2();
//     await registerPage.submitForm();

//     // Complete Card Payment
//     await razorpayPage.completeCardPayment(testData.mobile, testData.cards.Mastercard, true);
//     await page.waitForTimeout(5000);

//     // Thank You page validation
//     await page.waitForURL({ url: /thankyou/});
//     const thankYouMsg = await thankYouPage.getThankYouMessage();
//     expect(thankYouMsg).toContain('Payment Successful!');
//     const receiptPath = await thankYouPage.downloadReceipt();
//     expect(fs.existsSync(receiptPath)).toBeTruthy();
//     await thankYouPage.goToHome();
//     expect(page.url()).toContain('vfs_uk');
//   });

//   /*test('Complete registration and payment with domestic card - failure', async ({ page }) => {
//     const registerPage = new RegisterFormPage(page);
//     const razorpayPage = new RazorpayPage(page);

//     // Navigate and fill form
//     await registerPage.navigate(BASE_URL);
//     await page.waitForLoadState('networkidle');
//     await registerPage.scrollToForm();
//     await registerPage.enterName(testData.name);
//     await registerPage.enterEmail(testData.email);
//     await registerPage.enterMobile(testData.mobile);
//     await registerPage.selectSourceCountry(testData.countries.source);
//     await registerPage.selectDestinationCountry(testData.countries.destination);
//     await registerPage.checkCheckbox1();
//     await registerPage.checkCheckbox2();
//     await registerPage.submitForm();

//     // Complete Card Payment
//     await razorpayPage.completeCardPayment(testData.mobile, testData.cards.Mastercard, false);

//     // Assert that the payment failed and we are still on the payment page
//     expect(page.url()).toContain('razorpay');
//   });*/
// });



// ----------------------------------------------------------------------------------------------------------


// tests/cardPayment.spec.js
const { test, expect } = require('@playwright/test');
const RegisterFormPage = require('../../pages/RegisterFormPage');
const RazorpayPage = require('../../pages/RazorpayPage');
const ThankYouPage = require('../../pages/ThankYouPage');
const fs = require('fs');

const BASE_URL = 'https://staging.vfs.welcomecure.online/in-chandigarh?lang=en-US&dir=ltr';

const testData = {
  name: 'Aman ',
  email: 'Mehul@yopmail.com',
  mobile: '9328221950',
  JourneyDate : '20-06-2026',
  countries: { source: 'India', destination: 'United States' },
  SelectSalesPerson : {Person : 'Rajesh'} ,
  cards: {
    Mastercard: {
      cardnumber: '4386 2894 0766 0153',
      mmyy: '10/26',
      cvv: '123'
    }
  }
  
};

test.describe('Card Payment Functional Test', () => {

  test('Complete registration and payment with domestic card - success', async ({ page }) => {
    const registerPage = new RegisterFormPage(page);
    const razorpayPage = new RazorpayPage(page);
    const thankYouPage = new ThankYouPage(page);

    // Navigate and fill form
    await registerPage.navigate(BASE_URL);
    await page.waitForLoadState('networkidle');
    await registerPage.scrollToForm();
    await registerPage.enterName(testData.name);
    await registerPage.enterEmail(testData.email);
    await registerPage.enterMobile(testData.mobile);
    await registerPage.enterJourneydate(testData.JourneyDate);
    // await registerPage.selectSourceCountry(testData.countries.source);
    await registerPage.selectDestinationCountry(testData.countries.destination);
    // await registerPage.selectSalesPerson(testData.SelectSalesPerson.Person);
    await registerPage.checkCheckbox1();
    await registerPage.checkCheckbox2();
    await registerPage.submitForm();

    // Complete Card Payment and wait for navigation
    await Promise.race([
      page.waitForURL(/thankyou/, { timeout: 60000 }),
      razorpayPage.completeCardPayment(testData.mobile, testData.cards.Mastercard, true)
    ]);

    // Additional wait to ensure page is fully loaded
    
    await page.waitForLoadState('networkidle');

    // Thank You page validation
    const currentUrl = page.url();
    console.log('Current URL after payment:', currentUrl);
    expect(currentUrl).toMatch(/thankyou/);
    
    const thankYouMsg = await thankYouPage.getThankYouMessage();
    expect(thankYouMsg).toContain('Payment Successful!');
    
    const receiptPath = await thankYouPage.downloadReceipt();
    expect(fs.existsSync(receiptPath)).toBeTruthy();
    
    await thankYouPage.goToHome();
    expect(page.url()).toContain('vfs_uk');
  });
});