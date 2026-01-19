const BasePage = require('./BasePage');

class RazorpayPage extends BasePage {
  constructor(page) {
    super(page);
    this.iframe = 'iframe.razorpay-checkout-frame';
    this.contactField = "//input[@placeholder='Mobile number']";
    this.continueButton = "//button[@name='button']";
    
    this.upiPaymentMethod = '[data-value="upi"]';
    this.vpaField = '[name="vpa"]';
    this.verifyAndPayButton = 'button[data-testid="bottom-cta-button"]';
    
    this.cardPaymentMethod = '[data-value="card"]';
    this.cardNumberField = '[name="card.number"]';
    this.cardExpiryField = '[name="card.expiry"]';
    this.cardCvvField = '[name="card.cvv"]';
    this.saveCardCheckbox = '[name="save"]';
    this.verifyAndPayButton = 'button[data-testid="bottom-cta-button"]';
    this.skipOtpButton = '[text="Skip OTP"]' 
    this.successButon= 'text=Success';        
    this.successButon='text=Failure';

    this.netBankingMethod = '[data-testid="Netbanking"]';
    this.netBankingButton='[text="HDFC"]';
    this.successButon= 'text=Success';        
    this.successButon='text=Failure';

    this.walletPaymentMethod ='[data-value="wallet"]';
    this.airtelPaymentsBank ='[text="Airtel Payments Bank"]'; 
    //this.walletPaymentMethod ='[text="Airtel Payments Bank"]';
    this.successButon= 'text=Success';        
    this.successButon='text=Failure';



  }
  async completeCardPayment(mobileNumber, cardDetails, shouldSucceed) {
    console.log('Starting completeCardPayment method...');
    await this.page.waitForSelector(this.iframe, { state: 'visible' });
    const frame = this.page.frameLocator(this.iframe);

    console.log(`Entering contact number: ${mobileNumber}`);
    await frame.locator(this.contactField).type(mobileNumber);
    console.log('Clicking continue button...');
    await frame.locator(this.continueButton).click();

    console.log('Waiting for Card payment method...');
    const cardOption = frame.getByText('card');
    await cardOption.waitFor({ state: 'visible' });
    await cardOption.click();

    console.log(`Entering card number: ${cardDetails.cardnumber}`);
    await frame.locator(this.cardNumberField).type(cardDetails.cardnumber);
    console.log(`Entering card expiry: ${cardDetails.mmyy}`);
    await frame.locator(this.cardExpiryField).type(cardDetails.mmyy);
    console.log(`Entering card CVV: ${cardDetails.cvv}`);
    await frame.locator(this.cardCvvField).type(cardDetails.cvv);
    console.log('Clicking save card checkbox...');
    await frame.locator(this.saveCardCheckbox).click();
    console.log('Clicking pay button...');
    await frame.locator(this.verifyAndPayButton).click();

    console.log('Waiting 3 seconds before clicking NetBanking...');
    await this.page.waitForTimeout(3000); 
    
    console.log('Clicking skip OTP button...');
const [popup] = await Promise.all([
  this.page.waitForEvent('popup'),
  frame.getByText('Skip OTP', { exact: true }).click()
]);

if (shouldSucceed) {
  console.log('Clicking success button in popup...');
  await popup.locator('text=Success').click();
} else {
  console.log('Clicking failure button in popup...');
  await popup.locator('text=Failure').click();
}
console.log('completeCardPayment method finished.');
  }
    async completeUpiPayment(contactNumber, upiId) {
    console.log('Starting completeUpiPayment method...');
    const frame = this.page.frameLocator(this.iframe);
    console.log(`Entering contact number: ${contactNumber}`);
    await frame.locator(this.contactField).type(contactNumber);
    console.log('Clicking continue button...');
    await frame.locator(this.continueButton).click();
    console.log('Waiting for UPI payment method to be. visible...');
    await frame.locator(this.upiPaymentMethod).waitFor({ state: 'visible' });
    console.log('Clicking UPI payment method...');
    await frame.locator(this.upiPaymentMethod).click();
    console.log('Waiting for VPA field to be visible...');
    await frame.locator(this.vpaField).waitFor({ state: 'visible' });
    console.log(`Entering UPI ID: ${upiId}`);
    await frame.locator(this.vpaField).type(upiId);
    await frame.locator(this.verifyAndPayButton).waitFor({ state: 'visible' });
    await frame.locator(this.verifyAndPayButton).click();

    console.log('completeUpiPayment method finished.');
  }
   async completeNetBankingPayment(mobileNumber, shouldSucceed) {
    console.log('Starting complete NetBanking Payment method...');
    await this.page.waitForSelector(this.iframe, { state: 'visible' });
    const frame = this.page.frameLocator(this.iframe);

    console.log(`Entering contact number: ${mobileNumber}`);
    await frame.locator(this.contactField).type(mobileNumber);
    console.log('Clicking continue button...');
    await frame.locator(this.continueButton).click();

    console.log('Waiting for NetBanking payment method to be. visible...');
    await frame.locator(this.netBankingMethod).first().waitFor({ state: 'visible' });

     console.log('Waiting 3 seconds before clicking NetBanking...');
    await this.page.waitForTimeout(3000);  // <-- CORRECT WAIT

    console.log('Clicking NetBanking payment method...'); 
    await frame.locator(this.netBankingMethod).first().click();
    
    await frame.getByText('BOB', { exact: true }).waitFor({ state: 'visible' });
    const [popup] = await Promise.all([
        this.page.waitForEvent('popup'),
        frame.getByText('BOB', { exact: true }).click()
    ]);

if (shouldSucceed) {
  console.log('Clicking success button in popup...');
  await popup.locator('text=Success').click();
} else {
  console.log('Clicking failure button in popup...');
  await popup.locator('text=Failure').click();
}
console.log('completeNetbankingPayment method finished.');
  }

  async completeWalletPayment(mobileNumber, shouldSucceed) {
    console.log('Starting complete Wallet Payment method...');
    await this.page.waitForSelector(this.iframe, { state: 'visible' });
    const frame = this.page.frameLocator(this.iframe);

    console.log(`Entering contact number: ${mobileNumber}`);
    await frame.locator(this.contactField).type(mobileNumber);
    console.log('Clicking continue button...');
    await frame.locator(this.continueButton).click();

    console.log('Waiting for Wallet payment method to be. visible...');
    await frame.locator(this.walletPaymentMethod).first().waitFor({ state: 'visible' });
    console.log('Clicking Wallet payment method...');
    await frame.locator(this.walletPaymentMethod).first().click();
    
    await frame.getByText('Airtel Payments Bank', { exact: true }).waitFor({ state: 'visible' });
    const [popup] = await Promise.all([
        this.page.waitForEvent('popup'),
        frame.getByText('Airtel Payments Bank', { exact: true }).click()
    ]);

if (shouldSucceed) {
  console.log('Clicking success button in popup...');
  await popup.locator('text=Success').click();
} else {
  console.log('Clicking failure button in popup...');
  await popup.locator('text=Failure').click();
}
console.log('completeWalletPayment method finished.');
  }
}

module.exports = RazorpayPage;
