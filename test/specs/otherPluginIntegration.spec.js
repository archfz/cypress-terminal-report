import {
  ICONS,
  runTest,
  commandBase,
  expectOutFilesMatch, logLastRun,
} from "../utils";

const {expect} = require('chai');
const fs = require('fs');
const glob = require('glob');

describe('Other plugin integrations.', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });

  it('Should run happy flow with cucumber preprocessor.', async () => {
    await runTest(commandBase(['enableCucumber=1', 'printLogsToConsoleAlways=1'], ['cucumber/Happy.feature']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:command ${ICONS.success}  assert\texpected **0** to be below **2**`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  step\tI open Happy page`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  step\tI can load comments`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  step\tI can post comment`);
    });
  }).timeout(30000);

  it('Should generate proper nested log output files with cucumber preprocessor.', async () => {
    const specFiles = ['cucumber/Happy.feature'];
    await runTest(commandBase(['generateNestedOutput=1', 'enableCucumber=1', 'printLogsToFileAlways=1'], specFiles), (error, stdout) => {
      const specs = glob.sync('./output_nested_cucumber_spec/**/*', {nodir: true});
      specs.forEach(specFile => {
        const actualFile = specFile.replace('output_nested_cucumber_spec', 'output_nested');
        expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be.true;
        expectOutFilesMatch(actualFile, specFile);
      });
    });
  }).timeout(90000);

  it('Should be compatible with cypress-grep.', async () => {
    const specFiles = ['cypressGrep.spec.js'];
    await runTest(commandBase(['generateNestedOutput=1', 'cypressGrep=1', 'printLogsToFileAlways=1', 'printLogsToConsoleAlways=1'], specFiles), (error, stdout) => {
      expect(stdout).to.contain(`cy:command ${ICONS.success}  contains\tcypress`);
      expect(stdout).to.not.contain(`cy:log ${ICONS.info}  should not be logged`);

      const specs = glob.sync('./output_nested_cypress_grep_spec/**/*', {nodir: true});
      specs.forEach(specFile => {
        const actualFile = specFile.replace('output_nested_cypress_grep_spec', 'output_nested');
        expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be.true;
        expectOutFilesMatch(actualFile, specFile);
      });
    });
  }).timeout(90000);
});
