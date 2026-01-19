const { test, expect } = require('@playwright/test');
const RegisterFormPageUAE = require('../../pages/RegisterForm-vfsuk-uae-Page.js');
const StripePage = require('../../pages/StripePage');
const ThankYouPage = require('../../pages/ThankYouPage');
const fs = require('fs');
const { faker } = require('@faker-js/faker');

const numberOfRuns = 13;

for (let i = 1; i <= numberOfRuns; i++) {
  test(`Complete registration and Stripe payment flow - Run ${i}`, async ({ page }) => {
    const registerPage = new RegisterFormPageUAE(page);
    const stripePage = new StripePage(page);
    const thankYouPage = new ThankYouPage(page);
    const randomName = faker.person.fullName();
    const testData = {
      name: randomName,
      email: `${randomName.split(' ')[0].toLowerCase()}@yopmail.com`,
      mobile: (Math.floor(Math.random() * (99999444444444 - 6000000033333)) + 60000001111111).toString(),
      journeyDate: '10/11/2025',
      destinationCountry: 'Aruba',
      cardDetails: {
        number: '4242 4242 4242 4242',
        expiry: '12 / 30',
        cvc: '123',
        name: randomName
      }
    };

    // Step 1: Navigate to registration form
      //await registerPage.navigate('https://staging.corporate.welcomecure.com/vfsukuae?_id=68dccfa8f9a996d15168118d');  --uae
      //await registerPage.navigate('https://staging.corporate.welcomecure.com/vfsbahrain?_id=6909bb242d10c0b6a70b0d12');  1
      //await registerPage.navigate('https://staging.corporate.welcomecure.com/vfsbahrain?_id=6904599ad4b03b380657b96f');
      //await registerPage.navigate('https://staging.corporate.welcomecure.com/vfssaudi?_id=690b296669f0ce9eef9aa896');
      //await registerPage.navigate('https://staging.corporate.welcomecure.com/onevascosaudi?_id=690c6e7855e6f45410a6acbd');
      //await registerPage.navigate('https://staging.corporate.welcomecure.com/onevascosaudi?_id=690c359255e6f45410a6acb2');
      //await registerPage.navigate('https://staging.corporate.welcomecure.com/onevascosaudi?_id=690c6ead55e6f45410a6acbe');
        await registerPage.navigate('https://staging.corporate.welcomecure.com/onevascobahrain?_id=690d8bcbebdcc5b774ef1bd5');


    await page.waitForTimeout(3000);
    // Wait for the app to load (React app needs JS)
    await registerPage.scrollToForm();

    // Step 2: Fill registration form
    await registerPage.enterName(testData.name);
    await registerPage.enterEmail(testData.email);
    await registerPage.enterMobile(testData.mobile);
    await registerPage.enterTravelStartDate(testData.journeyDate);
    await registerPage.selectDestinationCountry(testData.destinationCountry);
    await registerPage.checkCheckbox1();
    await registerPage.checkCheckbox2();

    // Submit form → redirects to payment
    await registerPage.submitForm();

    //await page.pause();
   
  });
}