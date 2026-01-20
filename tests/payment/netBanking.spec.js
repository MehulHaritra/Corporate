// tests/neBanking.spec.js
const { test, expect } = require('@playwright/test');
const RegisterFormPage = require('../../pages/RegisterFormPage');
const RazorpayPage = require('../../pages/RazorpayPage');
const ThankYouPage = require('../../pages/ThankYouPage');
const fs = require('fs');

const BASE_URL = 'https://staging.onevasco.welcomecure.online/in-chandigarh?lang=en-US&dir=ltr';

// Number of times to run the test
const NUMBER_OF_RUNS = 1;

// Indian name pools
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Reyansh', 'Aadhya', 'Ananya', 'Pari', 'Anika', 'Navya',
  'Diya', 'Saanvi', 'Aarohi', 'Kiara', 'Myra', 'Avni', 'Sara', 'Prisha', 'Riya', 'Anaya',
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya', 'Tushar'
];

const lastNames = [
  'Sharma', 'Sonani', 'Bordiwala', 'Aalewar', 'Haritra', 'Verma', 'Singh', 'Kumar', 'Patel', 
  'Gupta', 'Shah', 'Reddy', 'Mehta', 'Nair', 'Agarwal', 'Joshi', 'Desai', 'Kapoor', 'Malhotra', 
  'Rao', 'Iyer', 'Chopra', 'Bhat', 'Pandey', 'Kulkarni', 'Mishra', 'Thakur', 'Saxena', 'Bansal', 
  'Jain', 'Sinha', 'Pillai', 'Menon', 'Das'
];

const countries = [
   'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
  'France', 'Singapore', 'Italy', 'Spain'
];

// Function to generate random Indian name
function generateRandomIndianName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

// Function to generate random 11-digit mobile number
function generateMobileNumber() {
  const prefix = '91';
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
  return prefix + randomDigits;
}

// Function to generate random future date
function generateJourneyDate() {
  const today = new Date();
  const futureDate = new Date(today);
  const randomDays = Math.floor(Math.random() * 335) + 30;
  futureDate.setDate(today.getDate() + randomDays);
  
  const day = String(futureDate.getDate()).padStart(2, '0');
  const month = String(futureDate.getMonth() + 1).padStart(2, '0');
  const year = futureDate.getFullYear();
  
  return `${day}-${month}-${year}`;
}

// Function to generate random 2-digit number
function generateRandomNumber() {
  return Math.floor(10 + Math.random() * 90);
}

// Function to generate test data with random name
function generateTestData() {
  const fullName = generateRandomIndianName();
  const firstName = fullName.split(' ')[0];
  const mobileNumber = generateMobileNumber();
  const randomNum = generateRandomNumber();
  const randomCountry = countries[Math.floor(Math.random() * countries.length)];
  
  return {
    name: fullName,
    email: `${firstName.toLowerCase()}${randomNum}@yopmail.com`,
    mobile: mobileNumber,
    JourneyDate: generateJourneyDate(),
    countries: {
      source: 'India',
      destination: randomCountry
    }
  };
}

test.describe('NetBanking Payment Functional Test', () => {
  // Generate tests dynamically
  for (let i = 0; i < NUMBER_OF_RUNS; i++) {
    test(`Complete registration and payment with NetBanking - Run ${i + 1}`, async ({ page }) => {
      // Generate unique random test data for this run
      const testData = generateTestData();
      
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
      await registerPage.selectDestinationCountry(testData.countries.destination);
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
      
      console.log(`✓ Test Run ${i + 1} completed successfully with name: ${testData.name}`);
    });
  }
});