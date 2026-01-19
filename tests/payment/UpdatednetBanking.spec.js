const { test, expect } = require('@playwright/test');
const RegisterFormPage = require('../../pages/RegisterFormPage');
const RazorpayPage = require('../../pages/RazorpayPage');
const ThankYouPage = require('../../pages/ThankYouPage');
const fs = require('fs');

const BASE_URL = 'https://staging.onevasco.welcomecure.online/in-chandigarh?lang=ar-EG&dir=rtl';

// Number of times to run the test
const NUMBER_OF_RUNS = 1;

// Sample data pools
const names = ['Tushar', 'Haritra', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya', 'Arjun'];
const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Italy', 'Spain'];

// Function to generate random 11-digit mobile number
function generateMobileNumber() {
const prefix = '91'; // Starting with 91
  const randomDigits = Math.floor(100000 + Math.random() * 900000); // 9 random digits
  return prefix + randomDigits;
}

// Function to generate random future date
function generateJourneyDate() {
  const today = new Date();
  const futureDate = new Date(today);
  // Add random days between 30 to 365 days
  const randomDays = Math.floor(Math.random() * 335) + 30;
  futureDate.setDate(today.getDate() + randomDays);
  
  const day = String(futureDate.getDate()).padStart(2, '0');
  const month = String(futureDate.getMonth() + 1).padStart(2, '0');
  const year = futureDate.getFullYear();
  
  return `${day}-${month}-${year}`;
}

// Function to generate random 2-digit number
function generateRandomNumber() {
  return Math.floor(10 + Math.random() * 90); // Generates number between 10-99
}

// Function to generate test data
function generateTestData(index) {
  const name = names[index % names.length];
  const mobileNumber = generateMobileNumber();
  const randomNum = generateRandomNumber();
  
  return {
    name: name,
    email: `${name.toLowerCase()}${randomNum}@yopmail.com`,
    mobile: mobileNumber,
    JourneyDate: generateJourneyDate(),
    countries: { 
      source: 'India', 
      destination: countries[index % countries.length] 
    },
  };
}

test.describe('NetBanking Payment Functional Test', () => {

  // Generate tests dynamically
  for (let i = 0; i < NUMBER_OF_RUNS; i++) {
    test(`Complete registration and payment with NetBanking - Run ${i + 1}`, async ({ page }) => {
      // Generate unique test data for this run
      const testData = generateTestData(i);
      
      console.log(`\n=== Test Run ${i + 1} ===`);
      console.log('Test Data:', JSON.stringify(testData, null, 2));
      
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
      
      console.log(`✓ Test Run ${i + 1} completed successfully`);
    });
  }
});