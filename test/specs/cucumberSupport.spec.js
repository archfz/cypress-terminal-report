import {
  ICONS,
  runTest,
  commandBase,
  expectOutFilesMatch, logLastRun,
} from "../utils";

const {expect} = require('chai');
const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');

describe('Cucumber support.', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });

  // @TODO: Reenable tests once cucumber plugin is updated.
  // https://github.com/badeball/cypress-cucumber-preprocessor/issues/722
  //
  // it('Should run happy flow with cucumber preprocessor.', async () => {
  //   await runTest(commandBase(['enableCucumber=1', 'printLogsToConsoleAlways=1'], ['cucumber/Happy.feature']), (error, stdout, stderr) => {
  //     expect(stdout).to.contain(`cy:command ${ICONS.success}  assert\texpected **0** to be below **2**`);
  //     expect(stdout).to.contain(`cy:command ${ICONS.success}  step\t**I open Happy page**`);
  //     expect(stdout).to.contain(`cy:command ${ICONS.success}  step\t**I can load comments**`);
  //     expect(stdout).to.contain(`cy:command ${ICONS.success}  step\t**I can post comment**`);
  //   });
  // }).timeout(30000);
  //
  // it('Should generate proper nested log output files with cucumber preprocessor.', async () => {
  //   const specFiles = ['cucumber/Happy.feature'];
  //   await runTest(commandBase(['generateNestedOutput=1', 'enableCucumber=1', 'printLogsToFileAlways=1'], specFiles), (error, stdout) => {
  //     const specs = glob.sync('./output_nested_cucumber_spec/**/*', {nodir: true});
  //     specs.forEach(specFile => {
  //       const actualFile = specFile.replace('output_nested_cucumber_spec', 'output_nested');
  //       expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be.true;
  //       expectOutFilesMatch(actualFile, specFile);
  //     });
  //   });
  // }).timeout(90000);
});
