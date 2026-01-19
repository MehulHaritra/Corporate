const { test, expect } = require('@playwright/test');
const RegisterFormPage = require('../../pages/RegisterFormPage');
const StripePage = require('../../pages/StripePage.js');
const ThankYouPage = require('../../pages/ThankYouPage');
const fs = require('fs');

const BASE_URL = 'https://staging.vfs.welcomecure.online/ng-abujauk';

// Number of times to run the test
const NUMBER_OF_RUNS = 2;

// Indian name pools
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharva', 'Advik', 'Pranav', 'Reyansh', 'Aadhya', 'Ananya', 'Pari', 'Anika', 'Navya',
  'Diya', 'Saanvi', 'Aarohi', 'Kiara', 'Myra', 'Avni', 'Sara', 'Prisha', 'Riya', 'Anaya',
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya', 'Tushar', 'Haritra'
];

const lastNames = [
  'Sharma', 'Verma', 'Singh', 'Kumar', 'Patel', 'Gupta', 'Shah', 'Reddy', 'Mehta', 'Nair',
  'Agarwal', 'Joshi', 'Desai', 'Kapoor', 'Malhotra', 'Rao', 'Iyer', 'Chopra', 'Bhat', 'Pandey',
  'Kulkarni', 'Mishra', 'Thakur', 'Saxena', 'Bansal', 'Jain', 'Sinha', 'Pillai', 'Menon', 'Das'
];

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
  'France', 'Singapore', 'UAE', 'Italy', 'Spain'
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
      source: 'United Arab Emirates',
      destination: randomCountry
    },
  };
}

// Function to handle language selection popup
async function handleLanguageSelection(page, language = 'English') {
  try {
    console.log('Checking for language selection popup...');
    const languagePopup = page.locator('text=Select Your Language');
    await languagePopup.waitFor({ state: 'visible', timeout: 5000 });
    
    console.log(`Language popup detected. Selecting ${language}...`);
    
    if (language === 'English') {
      await page.locator('text=English').click();
    } else if (language === 'Arabic') {
      await page.locator('text=Arabic').click();
    }
    
    console.log('Clicking Save button...');
    await page.locator('button:has-text("Save")').click();
    await languagePopup.waitFor({ state: 'hidden', timeout: 5000 });
    
    console.log('Language selection completed successfully.');
  } catch (error) {
    console.log('Language popup not found or already dismissed:', error.message);
  }
}

test.describe('Stripe Payment Functional Test', () => {
  // Generate tests dynamically
  for (let i = 0; i < NUMBER_OF_RUNS; i++) {
    test(`Complete registration and payment with Stripe - Run ${i + 1}`, async ({ page }) => {
      // Generate unique random test data for this run
      const testData = generateTestData();
      
      console.log(`\n=== Test Run ${i + 1} ===`);
      console.log('Test Data:', JSON.stringify(testData, null, 2));
      
      const registerPage = new RegisterFormPage(page);
      const stripePage = new StripePage(page);
      const thankYouPage = new ThankYouPage(page);
      
      // Navigate to URL
      await registerPage.navigate(BASE_URL);
      
      // Handle language selection popup (if appears)
      await handleLanguageSelection(page, 'English');
      
      // Wait for page to load completely
      await page.waitForLoadState('networkidle');
      
      // Fill registration form
      await registerPage.scrollToForm();
      await registerPage.enterName(testData.name);
      await registerPage.enterEmail(testData.email);
      await registerPage.enterMobile(testData.mobile);
      await registerPage.enterJourneydate(testData.JourneyDate);
      await registerPage.selectDestinationCountry(testData.countries.destination);
      await registerPage.checkCheckbox1();
      await registerPage.checkCheckbox2();
      await registerPage.submitForm();
      
      // Complete Stripe Payment
      await stripePage.completePayment();
      
      // Thank You page validation
      await page.waitForURL(/thankyou/, { timeout: 30000 });
      const thankYouMsg = await thankYouPage.getThankYouMessage();
      expect(thankYouMsg).toContain('Payment Successful!');
      
      const receiptPath = await thankYouPage.downloadReceipt();
      expect(fs.existsSync(receiptPath)).toBeTruthy();
      
      await thankYouPage.goToHome();
      expect(page.url()).toContain('uae-dubai');
      
      console.log(`✓ Test Run ${i + 1} completed successfully with name: ${testData.name}`);
    });
  }
});