import { test, expect } from '@playwright/test';
import path from 'path';
import LoginPage from '../../../pages/LoginPage';
import ExcelJS from 'exceljs';

const EXPECTED_HEADERS = [
  'Invoice_No',
  'Invoice_Date',
  'Group',
  'Department',
  'Product_Code',
  'Product_description',
  'Product_long_description',
  'Quantity',
  'Price',
  'Discount',
  'Prdct_Net_Amount',
  'Branch_Name',
  'Agent_Name',
  'USER_NAME',
  'countryCode',
  'Customer Contact No',
  'Customer Mail Id',
  'Destination Country',
  'Customer Name',
];

test.describe('Add Member - File Upload Module', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Starting beforeEach hook...');
    const loginPage = new LoginPage(page);
    console.log('Logging in...');
    await loginPage.login('8978989789', 'Test@1234', 'Corporate');
    console.log('Waiting for URL to be **/vfs/branch...');
    await page.waitForURL('**/vfs/branch');
    console.log('URL matched.');

    // Navigate to Members page and then to Create Member page
    console.log('Navigating to Create Member page...');
    await page.click("//img[@alt='arrow']");
    await page.click("//a[normalize-space()='Create Member']");
    console.log('Navigation to Create Member page successful.');
    

    console.log('Verifying visibility of file upload text...');
    await expect(page.locator('text=Click to upload the member list file OR drag & drop the file here.')).toBeVisible();
    console.log('File upload text is visible.');
    console.log('Finished beforeEach hook.');
  });

  test('Valid Excel file upload', async ({ page }) => {
    const filePath = path.resolve('tests/fixtures/sample-members/valid_members.xlsx');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.click('button:has-text("Validate")');
    await expect(page.locator("//div[contains(text(),'File is verified. Click upload to continue.')]")).toBeVisible();
    await page.click('button:has-text("Upload")');
    await expect(page.locator("//div[contains(text(),'Member data has been added successfully.')]")).toBeVisible();
  });

  test('Empty Excel file upload', async ({ page }) => {
    const filePath = path.resolve('tests/fixtures/sample-members/empty.xlsx');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.click('button:has-text("Validate")');
    await expect(page.locator("//div[contains(text(),'There must be at least one data row in the excel f')]")).toBeVisible();
  });

  test('Excel with missing columns', async ({ page }) => {
    const filePath = path.resolve('tests/fixtures/sample-members/invalid_columns.xlsx');
    console.log('Testing file for missing headers:', filePath);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const actualHeaders = worksheet.getRow(1).values.filter(Boolean); // Filter out null/undefined
    const missingHeaders = EXPECTED_HEADERS.filter(header => !actualHeaders.includes(header));

    if (missingHeaders.length > 0) {
      test.info().annotations.push({
        type: 'missing-headers',
        description: JSON.stringify(missingHeaders)
      });
      console.log('Missing headers found:', missingHeaders);
    } else {
      console.log('No missing headers detected.');
    }

    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.click('button:has-text("Validate")');
    await expect(page.locator("//div[contains(text(),'Empty headers found in the file')]")).toBeVisible();
  });


  // --- Data-driven test for invalid email formats ---

  const invalidEmails = [
    'saloni@yopmial.com',
    'plainaddress',
    '#@%^%#$@#$@#.com',
    '@domain.com',
    'Joe Smith <email@domain.com>',
    'email.domain.com',
    'email@domain@domain.com',
    '.email@domain.com',
    'email.@domain.com',
    'email..email@domain.com',
    'email@domain.com (Joe Smith)',
    'email@domain',
    'email@-domain.com',
    'email@111.222.333.444',
    'email@domain..com',
  ];

  for (const email of invalidEmails) {
    test(`should show an error for invalid email: ${email}`, async ({ page }) => {
      console.log(`Starting test for invalid email: ${email}`);
      const filePath = path.resolve('tests/fixtures/sample-members/temp_invalid_email.xlsx');
      console.log(`File path resolved to: ${filePath}`);

      console.log('Creating new Excel workbook and worksheet...');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet 1');
      console.log('Workbook and worksheet created.');

      console.log('Setting up worksheet columns...');
      worksheet.columns = [
          { header: 'Invoice_No', key: 'invoice_no' },
          { header: 'Invoice_Date', key: 'invoice_date' },
          { header: 'Group', key: 'group' },
          { header: 'Department', key: 'department' },
          { header: 'Product_Code', key: 'product_code' },
          { header: 'Product_description', key: 'product_description' },
          { header: 'Product_long_description', key: 'product_long_description' },
          { header: 'Quantity', key: 'quantity' },
          { header: 'Price', key: 'price' },
          { header: 'Discount', key: 'discount' },
          { header: 'Prdct_Net_Amount', key: 'prdct_net_amount' },
          { header: 'Branch_Name', key: 'branch_name' },
          { header: 'Agent_Name', key: 'agent_name' },
          { header: 'USER_NAME', key: 'user_name' },
          { header: 'Customer Contact No', key: 'customer_contact_no' },
          { header: 'Customer Mail Id', key: 'customer_mail_id' },
          { header: 'Destination Country', key: 'destination_country' },
          { header: 'Customer Name', key: 'customer_name' },
      ];
      console.log('Worksheet columns set up.');
      console.log('Defining row data...');
      const rowData = {
          invoice_no: 'IND0061306250005',
          invoice_date: '13-Jun-2025',
          group: 'Travel Concierge',
          department: 'Concierge',
          product_code: 'DOC-RTL',
          product_description: 'Doctor on Call - RTL',
          product_long_description: 'Doctor on Call - RTL',
          quantity: 1,
          price: 3000,
          discount: 0,
          prdct_net_amount: 300,
          branch_name: 'Pune Jvac',
          agent_name: 'Darshan',
          user_name: 'Sonu Verma',
          customer_contact_no: 9712738076,
          customer_mail_id: email,
          destination_country: 'Germany',
          customer_name: 'darshil',
      };
      console.log('Row data defined.');

      console.log('Adding row to worksheet...');
      worksheet.addRow(rowData);
      console.log('Row added.');

      console.log('Writing to XLSX file...');
      await workbook.xlsx.writeFile(filePath);
      console.log('Finished writing to XLSX file.');

      console.log('Setting input files for upload...');
      await page.locator('input[type="file"]').setInputFiles(filePath);
      console.log('Input files set.');

      console.log('Clicking Validate button...');
      await page.click('button:has-text("Validate")');
      console.log('Validate button clicked.');

      console.log('Waiting for 3 seconds...');
      await page.waitForTimeout(3000); 
      console.log('Wait finished.');

      console.log('Page body inner text...');
      console.log(await page.locator('body').innerText());

      console.log('Verifying visibility of invalid email error message...');
      await expect(page.getByText(`Invalid email ${email} in row 2`)).toBeVisible();

      console.log('Invalid email error message is visible.');    
    });
  } 

test('Validate Excel file for empty columns dynamically', async ({ page }) => {
  

  // Specify the Excel file to test (any uploaded Excel)
  const filePath = path.resolve('tests/fixtures/sample-members/check_empty_cells.xlsx'); // your Excel file
  console.log('Testing file:', filePath);

  // Read Excel file dynamically
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0]; // first sheet

  // Get headers and all data rows
  const headers = worksheet.getRow(1).values.slice(1); // remove first empty value
  const dataRows = worksheet.getRows(2, worksheet.rowCount - 1); // all rows except header

  // Detect empty cells dynamically
  const emptyColumnsSet = new Set(); // store headers with empty cells
  dataRows.forEach((row, rowIndex) => {
    row.values.slice(1).forEach((cell, colIndex) => {
      if (cell === null || cell === undefined || String(cell).trim() === '') {
        emptyColumnsSet.add(headers[colIndex]);
      }
    });
  });

  const emptyColumns = Array.from(emptyColumnsSet);
  console.log('Empty columns found:', emptyColumns);

  // Upload the Excel file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Click Validate button safely
  const validateButton = page.locator('button:has-text("Validate")');
  await validateButton.waitFor({ state: 'visible', timeout: 10000 });
  await validateButton.scrollIntoViewIfNeeded();
  await validateButton.click();
  await page.waitForTimeout(3000);

  //  Validate UI shows error messages for empty columns
  for (const column of emptyColumns) {
    // Replace spaces with underscores to match UI error format
    const uiMessage = column.replace(/\s/g, '_') + ' is missing in row';
    console.log('Checking error message for column:', column, '->', uiMessage);

    await expect(page.locator('body')).toContainText(uiMessage);
  }

  console.log('All empty column errors validated successfully.');
});
});