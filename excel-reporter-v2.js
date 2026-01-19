const ExcelJS = require('exceljs');
const path = require('path');

class ExcelReporter {
  constructor(options) {
    this.results = [];
    this.outputFileName = options.outputFileName || 'final-test-report.xlsx';
  }

  onBegin(config, suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
    this.currentTestFile = suite.allTests()[0].location.file;
  }

  onTestEnd(test, result) {
    const emptyColumnsAnnotation = test.annotations.find(a => a.type === 'empty-columns');
    const emptyColumns = emptyColumnsAnnotation ? JSON.parse(emptyColumnsAnnotation.description) : [];

    const missingHeadersAnnotation = test.annotations.find(a => a.type === 'missing-headers');
    const missingHeaders = missingHeadersAnnotation ? JSON.parse(missingHeadersAnnotation.description) : [];

    const testCaseOutcomeAnnotation = test.annotations.find(a => a.type === 'test-case-outcome');
    const testCaseOutcome = testCaseOutcomeAnnotation ? testCaseOutcomeAnnotation.description : '';

    this.results.push({
      test: test.title,
      status: result.status,
      duration: result.duration,
      errors: result.errors.map(error => error.message).join('\n'),
      testFile: test.location.file,
      testLine: test.location.line,
      errorStack: result.errors.map(error => error.stack).join('\n\n'),
      emptyColumns: emptyColumns.join(', '),
      missingHeaders: missingHeaders.join(', '),
      testCaseOutcome: testCaseOutcome,
    });
    //console.log('onTestEnd: this.results.length:', this.results.length);
  }

  async onEnd(result) {
    //console.log('--- USING MODIFIED EXCEL REPORTER ---');
    console.log(`Finished the run: ${result.status}`);
    //console.log('this.results.length:', this.results.length);

    let outputFileName = this.outputFileName;
    if (this.currentTestFile) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const testFileName = path.basename(this.currentTestFile, '.spec.js'); // Get filename without extension
        outputFileName = `${testFileName}-report-${timestamp}.xlsx`;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test Results');

    // Define columns
    worksheet.columns = [
      { header: 'Test Name', key: 'test', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Test Case Outcome', key: 'testCaseOutcome', width: 50, style: { alignment: { wrapText: true } } },
      { header: 'Duration (ms)', key: 'duration', width: 15 },
      { header: 'Test File', key: 'testFile', width: 40 },
      { header: 'Line', key: 'testLine', width: 10 },
      { header: 'Errors', key: 'errors', width: 100, style: { alignment: { wrapText: true } } },
      { header: 'Error Stack', key: 'errorStack', width: 120, style: { alignment: { wrapText: true } } },
      { header: 'Empty Columns', key: 'emptyColumns', width: 50, style: { alignment: { wrapText: true } } },
      { header: 'Missing Headers', key: 'missingHeaders', width: 50, style: { alignment: { wrapText: true } } },
    ];

    // Add rows
    this.results.forEach(row => {
      worksheet.addRow(row);
    });

    // Save to file
    const reportDir = path.join(process.cwd(), 'report');
    const filePath = path.join(reportDir, outputFileName);
    //console.log(`Attempting to save report to: ${filePath}`);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Excel report generated at: ${filePath}`);
  }
}

module.exports = ExcelReporter;