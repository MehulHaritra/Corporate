// const BasePage = require('./BasePage');

// class StripePage extends BasePage {
//   constructor(page) {
//     super(page);
    
//     this.emailInput = "//input[@id='email']";
//     this.cardNumberInput = "//input[@id='cardNumber']";
//     this.cardExpiryInput = "//input[@id='cardExpiry']";
//     this.cardCvcInput = "//input[@id='cardCvc']";
//     this.cardholderNameInput = "//input[@id='billingName']";
//     this.payButton = "//div[@class='SubmitButton-IconContainer']";
//     this.verificationFrame = 'iframe[name^="challengeFrame"]';
//     this.verificationCodeInput = '#challenge-input';
//   }

//   async completePayment(email, _mobile, cardDetails) {
//     await this.page.waitForLoadState('networkidle');
    
//     await this.type(this.cardNumberInput, cardDetails.number);
//     await this.type(this.cardExpiryInput, cardDetails.expiry);
//     await this.type(this.cardCvcInput, cardDetails.cvc);
//     await this.type(this.cardholderNameInput, cardDetails.name);
//     await this.type(this.emailInput, email);
//     await this.click(this.payButton);

    
//   }
// }


// pages/StripePage.js
const BasePage = require('./BasePage');

class StripePage extends BasePage {
  constructor(page) {
    super(page);
    
    // Stripe payment form selectors
    this.cardNumberField = '#cardNumber';
    this.cardExpiryField = '#cardExpiry';
    this.cardCvcField = '#cardCvc';
    this.billingNameField = '#billingName';
    this.emailField = '#email';
    this.payButton = '.SubmitButton-TextContainer';
    
    // Stripe iframe selectors (if needed)
    this.stripeCardIframe = 'iframe[name*="__privateStripeFrame"]';
  }

  async waitForStripeForm() {
    try {
      console.log('Waiting for Stripe payment form to load...');
      
      // Wait for network to be idle
      await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
        console.log('Network not idle, continuing...');
      });
      
      // Additional wait for Stripe to initialize
      await this.page.waitForTimeout(3000);
      
      console.log('Stripe form should be ready');
    } catch (error) {
      console.error('Error waiting for Stripe form:', error.message);
    }
  }

  async enterCardNumber(cardNumber) {
    try {
      console.log('Entering card number...');
      
      // Wait for card number field
      await this.page.waitForSelector(this.cardNumberField, { 
        state: 'visible', 
        timeout: 30000 
      });
      
      // Scroll into view
      await this.page.locator(this.cardNumberField).scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(500);
      
      // Fill card number
      await this.page.locator(this.cardNumberField).fill(cardNumber);
      await this.page.waitForTimeout(300);
      
      console.log('Card number entered');
    } catch (error) {
      console.error('Error entering card number:', error.message);
      throw error;
    }
  }

  async enterCardExpiry(expiry) {
    try {
      console.log('Entering card expiry...');
      
      await this.page.waitForSelector(this.cardExpiryField, { 
        state: 'visible', 
        timeout: 30000 
      });
      
      await this.page.locator(this.cardExpiryField).fill(expiry);
      await this.page.waitForTimeout(300);
      
      console.log('Card expiry entered');
    } catch (error) {
      console.error('Error entering card expiry:', error.message);
      throw error;
    }
  }

  async enterCardCvc(cvc) {
    try {
      console.log('Entering CVC...');
      
      await this.page.waitForSelector(this.cardCvcField, { 
        state: 'visible', 
        timeout: 30000 
      });
      
      await this.page.locator(this.cardCvcField).fill(cvc);
      await this.page.waitForTimeout(300);
      
      console.log('CVC entered');
    } catch (error) {
      console.error('Error entering CVC:', error.message);
      throw error;
    }
  }

  async enterBillingName(name) {
    try {
      console.log('Entering billing name...');
      
      await this.page.waitForSelector(this.billingNameField, { 
        state: 'visible', 
        timeout: 30000 
      });
      
      await this.page.locator(this.billingNameField).scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(300);
      
      await this.page.locator(this.billingNameField).fill(name);
      await this.page.waitForTimeout(300);
      
      console.log('Billing name entered');
    } catch (error) {
      console.error('Error entering billing name:', error.message);
      throw error;
    }
  }

  async enterEmail(email) {
    try {
      console.log('Entering email in Stripe form...');
      
      // Try multiple strategies to find and fill email field
      
      // Strategy 1: Direct selector
      const emailCount = await this.page.locator(this.emailField).count();
      console.log(`Email fields found with #email: ${emailCount}`);
      
      if (emailCount > 0) {
        const isVisible = await this.page.locator(this.emailField).first().isVisible();
        console.log(`Email field visible: ${isVisible}`);
        
        if (isVisible) {
          await this.page.locator(this.emailField).first().scrollIntoViewIfNeeded();
          await this.page.waitForTimeout(500);
          await this.page.locator(this.emailField).first().fill(email);
          console.log('Email entered successfully');
          return;
        }
      }
      
      // Strategy 2: Try by name attribute
      console.log('Trying alternative email selectors...');
      const alternativeSelectors = [
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="email" i]',
        '#billingEmail',
        '[id*="email"]'
      ];
      
      for (const selector of alternativeSelectors) {
        const count = await this.page.locator(selector).count();
        if (count > 0) {
          const visible = await this.page.locator(selector).first().isVisible();
          if (visible) {
            console.log(`Using selector: ${selector}`);
            await this.page.locator(selector).first().scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(300);
            await this.page.locator(selector).first().fill(email);
            console.log('Email entered with alternative selector');
            return;
          }
        }
      }
      
      // Strategy 3: Check if email field might be pre-filled or not required
      console.log('Email field might not be required or is pre-filled');
      
    } catch (error) {
      console.error('Error entering email:', error.message);
      // Don't throw error - email might be optional or pre-filled
      console.log('Continuing without email field...');
    }
  }

  async clickPayButton() {
    try {
      console.log('Clicking pay button...');
      
      // Wait for pay button with multiple strategies
      const payButtonSelectors = [
        this.payButton,
        '.SubmitButton',
        'button[type="submit"]',
        'button:has-text("Pay")',
        '[class*="SubmitButton"]'
      ];
      
      for (const selector of payButtonSelectors) {
        const count = await this.page.locator(selector).count();
        if (count > 0) {
          const visible = await this.page.locator(selector).first().isVisible();
          if (visible) {
            console.log(`Using pay button selector: ${selector}`);
            
            // Scroll into view
            await this.page.locator(selector).first().scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);
            
            // Click the button
            await this.page.locator(selector).first().click();
            console.log('Pay button clicked');
            
            // Wait for payment processing
            await this.page.waitForTimeout(2000);
            return;
          }
        }
      }
      
      throw new Error('Pay button not found');
      
    } catch (error) {
      console.error('Error clicking pay button:', error.message);
      throw error;
    }
  }

  async completePayment() {
    try {
      console.log('\n=== Starting Stripe Payment ===');
      
      // Wait for Stripe form to load
      await this.waitForStripeForm();
      
      // Fill card details
      await this.enterCardNumber('4111111111111111');
      await this.enterCardExpiry('10/27');
      await this.enterCardCvc('123');
      
      // Fill billing details
      await this.enterBillingName('Mehul Singh');
      
      // Try to fill email (might be optional or pre-filled)
      await this.enterEmail('test@yopmail.com');
      
      // Click pay button
      await this.clickPayButton();
      
      console.log('=== Payment Submitted ===\n');
      
      // Wait for payment to process
      await this.page.waitForTimeout(3000);
      
    } catch (error) {
      console.error('Error completing payment:', error.message);
      
      // Take screenshot for debugging
      await this.page.screenshot({ 
        path: `payment-error-${Date.now()}.png`,
        fullPage: true 
      });
      
      throw error;
    }
  }
}

module.exports = StripePage;