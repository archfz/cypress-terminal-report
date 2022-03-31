import { runTest, commandBase, logLastRun, clean } from "../utils";

const {expect} = require('chai');
const fs = require('fs');
const path = require('path');

function getOutputFileContents() {
  const outputFile = path.join(__dirname, '../output/out.txt');
  expect(fs.existsSync(outputFile), `Expected output file ${outputFile} to exist.`).to.be.true;
  const valueBuffer = fs.readFileSync(outputFile);
  return clean(valueBuffer.toString());
}

describe('Output compact logs.', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });

  it('Should compact logs to length specified by compactLogs and outputCompactLogs - compactLogs=1, outputCompactLogs=5', async () => {
    await runTest(commandBase(['outputCompactLogs=1'], ['outputCompactLogs.spec.js']), (error, stdout, stderr) => {
      // failure occurs on 21st log, compactLogs=1, outputCompactLogs=5

      // test terminal is correct
      expect(stdout, 'compactLogs compacts terminal logs to correct val (1)' ).to.contain( `[ ... 19 omitted logs ... ]`);
      expect(stdout, 'compactLogs does not compact terminal to outputCompactLogs val (5)' ).to.not.contain(`[ ... 15 omitted logs ... ]`);

      // test output log is correct
      const fileContents = getOutputFileContents();
      expect(fileContents, 'outputCompactLogs compacts output file logs to correct val (5)').to.contain( `[ ... 15 omitted logs ... ]` );
      expect(fileContents, 'outputCompactLogs does not compact output file logs to compactLogs val (1)').to.not.contain(`[ ... 19 omitted logs ... ]`);
    });
  }).timeout(60000);

  it('Should compact logs to length specified by compactLogs and outputCompactLogs - compactLogs=unspecified, outputCompactLogs=5', async () => {
    await runTest(commandBase(['outputCompactLogs=2'], ['outputCompactLogs.spec.js']), (error, stdout, stderr) => {
      // failure occurs on 21st log, compactLogs=unspecified (default), outputCompactLogs=5

      // test terminal is correct
      expect(stdout, 'not specifying compactLogs results in uncompacted terminal output even if outputCompactLogs>=0 specified' ).to.not.contain(`omitted logs`);

      // test output log is correct
      const fileContents = getOutputFileContents();
      expect(fileContents, 'outputCompactLogs>=0 compacts terminal even if compactLogs not specified' ).to.contain(`[ ... 15 omitted logs ... ]`);
    });
  }).timeout(60000);

  it('Should compact logs to length specified by compactLogs and outputCompactLogs - compactLogs=5, outputCompactLogs=-1', async () => {
    await runTest(commandBase(['outputCompactLogs=3'], ['outputCompactLogs.spec.js']), (error, stdout, stderr) => {
      // failure occurs on 21st log, compactLogs=5, outputCompactLogs=-1

      // test terminal is correct
      expect(stdout, 'compactLogs compacts terminal logs to correct val (5)').to.contain( `[ ... 15 omitted logs ... ]`);

      // test output log is correct
      const fileContents = getOutputFileContents();
      expect(fileContents, 'outputCompactLogs=-1 causes terminal to not compact even if compactLogs specified' ).to.not.contain(`omitted logs`);
    });
  }).timeout(60000);
});
