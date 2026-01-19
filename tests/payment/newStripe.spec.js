const { test, expect } = require('@playwright/test');
const RegisterFormPage = require('../../pages/RegisterFormPage');
const StripePage = require('../../pages/StripePage.js');
const ThankYouPage = require('../../pages/ThankYouPage');
const fs = require('fs');

const BASE_URL = 'https://staging.onevasco.welcomecure.online/uae-dubai?lang=ar-EG&dir=rtl';

// Number of times to run the test
const NUMBER_OF_RUNS = 1;

// Sample data pools
const names = ['Tushar', 'Haritra', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya', 'Arjun'];
const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'UAE', 'Italy', 'Spain'];

// Function to generate random 11-digit mobile number
function generateMobileNumber() {
  const prefix = '91'; // Starting with 91
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000); // 9 random digits
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
      source: 'United Arab Emirates', 
      destination: countries[index % countries.length] 
    },
  };
}

// Function to handle language selection popup
async function handleLanguageSelection(page, language = 'English') {
  try {
    console.log('Checking for language selection popup...');
    
    // Wait for the language popup to appear (with timeout)
    const languagePopup = page.locator('text=Select Your Language');
    await languagePopup.waitFor({ state: 'visible', timeout: 5000 });
    
    console.log(`Language popup detected. Selecting ${language}...`);
    
    // Click on the desired language radio button
    if (language === 'English') {
      await page.locator('text=English').click();
    } else if (language === 'Arabic') {
      await page.locator('text=Arabic').click();
    }
    
    console.log('Clicking Save button...');
    // Click the Save button
    await page.locator('button:has-text("Save")').click();
    
    // Wait for popup to close
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
      // Generate unique test data for this run
      const testData = generateTestData(i);
      
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
      // await registerPage.selectSourceCountry(testData.countries.source);
      await registerPage.selectDestinationCountry(testData.countries.destination);
      // await registerPage.selectSalesPerson(testData.SelectSalesPerson.Person);
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
      
      console.log(`✓ Test Run ${i + 1} completed successfully`);
    });
  }
});



