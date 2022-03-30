import {
  ICONS,
  runTest,
  commandBase, 
  logLastRun,
  clean
} from "../utils";

const {expect} = require('chai');
const fs = require('fs');
const path = require('path');

describe('Output compact logs.', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });

  it('Should compact output file logs to length specified by outputCompactLogs', async () => {
    await runTest(commandBase(['outputCompactLogs=1'], ['outputCompactLogs.spec.js']), (error, stdout, stderr) => {
      // failure occurs on 21st log, compactLogs=1, outputCompactLogs=5

      // test console is correct
      expect(stdout).to.contain(`[ ... 19 omitted logs ... ]`);
      expect(stdout).to.not.contain(`[ ... 15 omitted logs ... ]`);

      // test output log is correct
      const outputFile = path.join(__dirname, '../output/out.txt');
      expect(fs.existsSync(outputFile), `Expected output file ${outputFile} to exist.`).to.be.true;
      const valueBuffer = fs.readFileSync(outputFile);
      let value = clean(valueBuffer.toString());
      expect(value).to.contain(`[ ... 15 omitted logs ... ]`);
      expect(value).to.not.contain(`[ ... 19 omitted logs ... ]`);
    });
  }).timeout(60000);
});
