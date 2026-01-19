import { test, expect } from '@playwright/test';
import path from 'path';
import LoginPage from '../../../pages/LoginPage';
import ExcelJS from 'exceljs';

const EXPECTED_HEADERS = [
  'Name',
  'Email',
  'Country Code',
  'Mobile No',
];

test.describe('Admin Add Member - File Upload Module', () => {
  test.beforeEach(async ({ page }) => {
   
    const loginPage = new LoginPage(page);
    console.log('Logging in...');
    await loginPage.login('9687298058', 'Cure@3210#', 'Admin');
    console.log('Waiting for URL to be **/Admin-page');
    await page.waitForURL('https://staging.corporate.welcomecure.com/admin/admin_user/corporate');
    console.log('URL matched.');

    // Navigate to Members page and then to Create Member page
    console.log('Navigating to Create Member page...');
    await page.click("(//img[contains(@alt,'arrow')])[1]");
    await page.click("//a[normalize-space()='Create Member']");
    console.log('Navigation to Select Corporate dropdown menu');
    await page.locator('div.css-19bb58m').click();
    await page.locator('div:text("Madan lab")').click();
    await expect(page.locator('text=Click to upload the member list file OR drag & drop the file here.')).toBeVisible();
    console.log('File upload text is visible.');
    
  });

  test('Valid Excel file upload', async ({ page }) => {
    const filePath = path.resolve('tests/fixtures/sample-members/valid-data.xlsx');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.click('button:has-text("Save")');

    const successMessage = "Member data has been added successfully.";
    const duplicateMessage = "already register with us";
    
    const successLocator = page.locator(`//div[contains(text(),'${successMessage}')]`);
    const duplicateLocator = page.locator(`//div[contains(text(),'${duplicateMessage}')]`);

    await expect(successLocator.or(duplicateLocator)).toBeVisible();

    const isSuccess = await successLocator.isVisible();
    const note = isSuccess ? 'Member data added successfully.' : 'Member already registered.';

    test.info().annotations.push({
      type: 'test-case-outcome',
      description: note,
    });
  });

  test('Empty Excel file upload', async ({ page }) => {
    const filePath = path.resolve('tests/fixtures/sample-members/empty-check-admin-login.xlsx');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(3000);
    await expect(page.locator("//div[contains(text(),'There must be at least one data row in the excel f')]")).toBeVisible();
  });

  test('Excel with missing columns', async ({ page }) => {
    const filePath = path.resolve('tests/fixtures/sample-members/missing-header-check-admin-login.xlsx');
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
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(3000);
    await expect(page.locator("//div[contains(text(),'There must be at least one data row in the excel f')]")).toBeVisible();
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
      //console.log(`Starting test for invalid email: ${email}`);
      const filePath = path.resolve('tests/fixtures/sample-members/temp1_invalid_email.xlsx');
      //console.log(`File path resolved to: ${filePath}`);

      //console.log('Creating new Excel workbook and worksheet...');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet 1');
      //console.log('Workbook and worksheet created.');

      //console.log('Setting up worksheet columns...');
      worksheet.columns = [
          { header: 'Name', key: 'name' },
          { header: 'Email', key: 'email_id' },
          { header: 'Country Code', key: 'country_code'},
          { header: 'Mobile No', key: 'mobile_no' }, 
      ];
      //console.log('Worksheet columns set up.');
      //console.log('Defining row data...');
      const rowData = {
          name: 'Samrat',
          email_id: email,
          country_code: 91,
          mobile_no: 9712738076,
        };
      //console.log('Row data defined.');

      //console.log('Adding row to worksheet...');
      worksheet.addRow(rowData);
      //console.log('Row added.');

      //console.log('Writing to XLSX file...');
      await workbook.xlsx.writeFile(filePath);
      //console.log('Finished writing to XLSX file.');

      //console.log('Setting input files for upload...');
      await page.locator('input[type="file"]').setInputFiles(filePath);
      //console.log('Input files set.');

      //console.log('Clicking Save button...');
      await page.click('button:has-text("Save")');
      //console.log('Validate button clicked.');

     // console.log('Waiting for 3 seconds...');
      //await page.waitForTimeout(3000); 
      //console.log('Wait finished.');

      //console.log('Page body inner text...');
      //console.log(await page.locator('body').innerText());

      //console.log('Verifying visibility of invalid email error message...');
      await expect(page.getByText(`Please Enter a Valid Email ${email}`)).toBeVisible();

      //console.log('Invalid email error message is visible.');    
    });
  } 

test('Validate Excel file for empty columns dynamically', async ({ page }) => {
  

  // Specify the Excel file to test (any uploaded Excel)
  const filePath = path.resolve('tests/fixtures/sample-members/empty-data-check-admin-login.xlsx'); 
  //console.log('Testing file:', filePath);

  // Read Excel file dynamically
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0]; // first sheet

  // Get headers and all data rows
  const headers = worksheet.getRow(1).values.filter(Boolean); // Filter out null/undefined/empty string headers
  const dataRows = [];
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    if (row.values.filter(Boolean).length > 0) { // Only add rows that have at least one non-empty cell
      dataRows.push(row);
    }
  }

  // Detect empty cells dynamically
  const emptyColumnsSet = new Set(); // store headers with empty cells
  dataRows.forEach((row) => {
    row.values.forEach((cell, colIndex) => { // Iterate through all cells in the row
      // Ensure colIndex corresponds to a valid header
      if (colIndex > 0 && headers[colIndex - 1] && (cell === null || cell === undefined || String(cell).trim() === '')) {
        emptyColumnsSet.add(headers[colIndex - 1]); // Use colIndex - 1 because headers are 0-indexed
      }
    });
  });

  const emptyColumns = Array.from(emptyColumnsSet);
  if (emptyColumns.length > 0) {
    test.info().annotations.push({
      type: 'empty-columns',
      description: JSON.stringify(emptyColumns),
    });
  }
  console.log('Empty columns found:', emptyColumns);

  // Upload the Excel file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Click Validate button safely
  const validateButton = page.locator('button:has-text("Save")');
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