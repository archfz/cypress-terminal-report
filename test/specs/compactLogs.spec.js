import {ICONS, runTest, commandBase, logLastRun} from '../utils';

const {expect} = require('chai');

describe('Compact logs.', () => {
  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });

  it('Should compact logs when test fails.', async () => {
    await runTest(
      commandBase(['compactLogs=1'], ['compactLogs.spec.js']),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(
          `ctr:info -  [ ... 16 omitted logs ... ]\n      cy:command ${ICONS.success}  window\t\n      cons:error ${ICONS.error}  null,`
        );
        expect(stdout).to.contain(
          `cy:command ${ICONS.success}  window\t\n        ctr:info -  [ ... 3 omitted logs ... ]\n      cy:command ${ICONS.success}  window\t\n      cons:error ${ICONS.error}  This is an error message\n      cy:command ${ICONS.success}  window\t\n      cons:error ${ICONS.error}  Error: This is an error message with stack.`
        );
        expect(stdout).to.contain(`ctr:info -  [ ... 11 omitted logs ... ]`);
        expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-get`);
      }
    );
  }).timeout(60000);

  it('Should compact all logs when there is no failing test.', async () => {
    await runTest(
      commandBase(
        ['compactLogs=1', 'printLogsToConsoleAlways=1'],
        ['successfulWithNoErrors.spec.js']
      ),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(`ctr:info -  [ ... 27 omitted logs ... ]`);
      }
    );
  }).timeout(60000);
});
