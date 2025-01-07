import {ICONS, runTest, commandBase, expectOutFilesMatch, logLastRun} from '../utils';
import * as fs from 'fs';
import * as glob from 'glob';

const {expect} = require('chai');

describe('Other plugin integrations.', () => {
  afterEach(function () {
    if (this.currentTest?.state == 'failed') {
      logLastRun();
    }
  });

  it('Should run happy flow with cucumber preprocessor. [backward-compatibility-skip]', async () => {
    await runTest(
      commandBase(['enableCucumber=1', 'printLogsToConsoleAlways=1'], ['cucumber/Happy.feature']),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(
          `cy:command ${ICONS.success}  assert\texpected **0** to be below **2**`
        );
        expect(stdout).to.contain(`cy:command ${ICONS.success}  Given \t**I open Happy page**`);
        expect(stdout).to.contain(`cy:command ${ICONS.success}  Then \t**I can load comments**`);
        expect(stdout).to.contain(`cy:command ${ICONS.success}  Then \t**I can post comment**`);
      }
    );
  }).timeout(30000);

  it('Should generate proper nested log output files with cucumber preprocessor. [backward-compatibility-skip]', async () => {
    const specFiles = ['cucumber/Happy.feature'];
    await runTest(
      commandBase(
        ['generateNestedOutput=1', 'enableCucumber=1', 'printLogsToFileAlways=1'],
        specFiles
      ),
      (error, stdout) => {
        const specs = glob.sync('./output_nested_cucumber_spec/**/*', {nodir: true});
        specs.forEach((specFile) => {
          const actualFile = specFile.replace('output_nested_cucumber_spec', 'output_nested');
          expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be
            .true;
          expectOutFilesMatch(actualFile, specFile);
        });
      }
    );
  }).timeout(90000);

  it('Should be compatible with cypress-grep.', async () => {
    const specFiles = ['cypressGrep.spec.js'];
    await runTest(
      commandBase(
        [
          'generateNestedOutput=1',
          'cypressGrep=1',
          'printLogsToFileAlways=1',
          'printLogsToConsoleAlways=1',
        ],
        specFiles
      ),
      (error, stdout) => {
        expect(stdout).to.contain(`cy:command ${ICONS.success}  contains\tcypress`);
        expect(stdout).to.not.contain(`cy:log ${ICONS.info}  should not be logged`);

        const specs = glob.sync('./output_nested_cypress_grep_spec/**/*', {nodir: true});
        specs.forEach((specFile) => {
          const actualFile = specFile.replace('output_nested_cypress_grep_spec', 'output_nested');
          expect(fs.existsSync(actualFile), `Expected output file ${actualFile} to exist.`).to.be
            .true;
          expectOutFilesMatch(actualFile, specFile);
        });
      }
    );
  }).timeout(90000);

  it('Should be able to send logs to mochawesome.', async () => {
    await runTest(commandBase(['mochawesome=1'], ['commandLogUpdate.spec.js']), (error, stdout) => {
      expect(stdout).to
        .contain(`cy:log ${ICONS.info}  Global API logs:         cy:command (K): visit\t/commands/network-requests
                            cy:command (K): window
                            cy:command (K): get\t[href="https://on.cypress.io/request"]
                            cy:command (K): first
                            cy:command (K): assert\texpected **<a>** to have text **something else**
                                            Actual: \t"something else"
                                            Expected: \t"something else"
                            cy:command (X): get\tbreaking`);
    });
  }).timeout(90000);
});
