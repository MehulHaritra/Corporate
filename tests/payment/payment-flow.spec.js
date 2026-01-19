const { test, expect } = require('@playwright/test');
const RegisterFormPageUAE = require('../../pages/RegisterForm-vfsuk-uae-Page.js');
const StripePage = require('../../pages/StripePage.js');
const ThankYouPage = require('../../pages/ThankYouPage.js');
const fs = require('fs');
const { faker } = require('@faker-js/faker');

const numberOfRuns = 2;

for (let i = 1; i <= numberOfRuns; i++) {
  test(`Complete registration and Stripe payment flow - Run ${i}`, async ({ page }) => {
    const registerPage = new RegisterFormPageUAE(page);
    const stripePage = new StripePage(page);
    const thankYouPage = new ThankYouPage(page);
    const randomName = faker.person.fullName();
    const testData = {
      name: randomName,
      email: `${randomName.split(' ')[0].toLowerCase()}@yopmail.com`,
      mobile: (Math.floor(Math.random() * (999999999940000 - 600000000000099)) + 6000000099999).toString(),
      journeyDate: '20-02-2026', // <-- updated default journey date
      destinationCountry: 'Albania',
      cardDetails: {
        number: '4242 4242 4242 4242',
        expiry: '12 / 30',
        cvc: '123',
        name: randomName
      }
    };

    // Step 1: Navigate to registration form
    await registerPage.navigate('https://staging.vfs.welcomecure.online/cure');

    await page.waitForTimeout(3000);
    // Wait for the app to load (React app needs JS)
    await registerPage.scrollToForm();

    // Step 2: Fill registration form
    await registerPage.enterName(testData.name);
    await registerPage.enterEmail(testData.email);
    await registerPage.enterMobile(testData.mobile);
    
    // Step 2a: Set journey date properly
    await registerPage.enterTravelStartDate(testData.journeyDate); // Make sure the method supports this format
    // If the input is type="date", consider converting to yyyy-mm-dd format:
    // const formattedDate = '2026-02-20';
    // await registerPage.enterTravelStartDate(formattedDate);

    await registerPage.selectDestinationCountry(testData.destinationCountry);
    await registerPage.checkCheckbox1();
    await registerPage.checkCheckbox2();

    // Submit form → redirects to payment
    await registerPage.submitForm();

    // Step 3-7: Complete Stripe Payment
    await stripePage.completePayment(testData.email, testData.mobile, testData.cardDetails);

    // Step 8 & 9: Thank You page validation
    await page.waitForURL(/thankyou/);
    const receiptPath = await thankYouPage.downloadReceipt('receipt.pdf');
    expect(fs.existsSync(receiptPath)).toBeTruthy();
    await thankYouPage.goToHome();

    // Final assertion
    await expect(page).toHaveURL(/onevascobahrain/);
  });
}
