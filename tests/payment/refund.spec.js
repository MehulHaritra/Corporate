const { test, expect } = require('@playwright/test');
const RegisterFormPageUAE = require('../../pages/RegisterForm-vfsuk-uae-Page.js');
const fs = require('fs');
import * as XLSX from 'xlsx';


const EXCEL_PATH = './refund_data.xlsx'; 

function readRefundData() {
  const workbook = XLSX.read(fs.readFileSync(EXCEL_PATH), { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  if (jsonData.length === 0) {
    return [];
  }

  return jsonData.slice(18, 21).map(row => ({ 
    memberName: row['Name'],
    memberEmail: row['Email'],
    memberContact: row['Contact'],
    invoiceId: row['Invoice Number']
  }));
}

const allData = readRefundData();

for (const [index, data] of allData.entries()) {
  test(`should test refund function for ${data.memberName} - ${index + 1}`, async ({ page }) => {
    if (!data) {
      throw new Error(`No data found in ${EXCEL_PATH}. Please ensure the file is not empty and has the correct headers.`);
    }

    // 1. Open page
    //await page.goto('https://staging.corporate.welcomecure.com/vfsbahrain?_id=6909bb242d10c0b6a70b0d12'); 
    //await page.goto('https://staging.corporate.welcomecure.com/vfssaudi?_id=690b296669f0ce9eef9aa896');
    //await page.goto('https://staging.corporate.welcomecure.com/onevascosaudi?_id=690c6e7855e6f45410a6acbd');
    //await page.goto('https://staging.corporate.welcomecure.com/onevascosaudi?_id=690c359255e6f45410a6acb2');
    //await page.goto('https://staging.corporate.welcomecure.com/onevascosaudi?_690c6ead55e6f45410a6acbe');
      await page.goto('https://staging.corporate.welcomecure.com/onevascobahrain?_id=690d8bcbebdcc5b774ef1bd5');


    // 2. Scroll to and click refund link
    const refundLink = page.locator('text="Payment Refund"');
    await refundLink.scrollIntoViewIfNeeded();
    await refundLink.click();

    // Wait for popup/modal to appear
    const popup = page.locator('text="Payment Refund Request"');
    await expect(popup).toBeVisible({ timeout: 10000 });

    // 3. Fill form fields
    await page.fill("(//input[@id='name'])[2]", String(data.memberName));
    await page.fill("(//input[@id='email'])[2]", String(data.memberEmail));

    // Fill mobile number (without country code)
    await page.fill("(//input[@id='contact'])[2]", String(data.memberContact));

    // Fill invoice number
    await page.fill("//input[@id='invoiceId']", String(data.invoiceId));

    // Fill reason
    const reasonDropdown = page.locator('div.col-span-6:has-text("Reason")').locator('div[class$="-control"]');
    await reasonDropdown.click();
    //await page.locator(`div[class*="option"]:has-text("Service not required")`).click(); 
    await page.locator(`div[class*="option"]:has-text("Visa not approved")`).click();

    // 4. Submit
    await page.click("//button[normalize-space()='Submit']");

    // 5. Fetch and log refund message
    const messageElement = page.locator("//div[contains(text(),'Refund request created successfully')]"); 
    await expect(messageElement).toBeVisible({ timeout: 10000 });
    const message = await messageElement.textContent();
    console.log(' Refund Result:', message.trim());
  });
}
