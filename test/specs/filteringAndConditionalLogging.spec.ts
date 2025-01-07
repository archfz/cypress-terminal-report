import {ICONS, runTest, commandBase, logLastRun} from '../utils';

const {expect} = require('chai');

describe('Filtering and conditional logging.', () => {
  afterEach(function () {
    if (this.currentTest?.state == 'failed') {
      logLastRun();
    }
  });

  it('Should always print logs to console when configured so.', async () => {
    await runTest(
      commandBase(
        ['printLogsToConsoleAlways=1'],
        ['printLogsSuccess.spec.js', 'printLogsFail.spec.js']
      ),
      (error, stdout, stderr) => {
        // cy.command logs.
        expect(stdout).to.contain(`cy:command ${ICONS.success}  visit\t/\n`);
        expect(stdout).to.contain(`cy:command ${ICONS.success}  contains\tcypress\n`);
        expect(stdout).to.contain(`cy:command ${ICONS.error}  contains\tsserpyc\n`);
      }
    );
  }).timeout(60000);

  it('Should never print logs to console when configured so.', async () => {
    await runTest(
      commandBase(
        ['printLogsToConsoleNever=1'],
        ['printLogsSuccess.spec.js', 'printLogsFail.spec.js']
      ),
      (error, stdout, stderr) => {
        // cy.command logs.
        expect(stdout).to.not.contain(`cy:command ${ICONS.success}  visit\t/\n`);
        expect(stdout).to.not.contain(`cy:command ${ICONS.success}  contains\tcypress\n`);
        expect(stdout).to.not.contain(`cy:command ${ICONS.error}  contains\tsserpyc\n`);
      }
    );
  }).timeout(60000);

  it('Should print only logs allowed if configuration added.', async () => {
    await runTest(
      commandBase(['setLogTypes=1'], ['allTypesOfLogs.spec.js']),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(`cy:request`);
        expect(stdout).to.contain(`cy:log`);
        expect(stdout).to.contain(`cons:warn`);

        expect(stdout).to.not.contain(`cy:route`);
        expect(stdout).to.not.contain(`cy:command`);
        expect(stdout).to.not.contain(`cons:error`);
        expect(stdout).to.not.contain(`cons:log`);
        expect(stdout).to.not.contain(`cons:info`);
      }
    );
  }).timeout(60000);

  it('Should filter logs if configuration added.', async () => {
    await runTest(
      commandBase(['setFilterLogs=1'], ['allTypesOfLogs.spec.js']),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(`This should console.log appear. [filter-out-string]`);
        expect(stdout).to.contain(`This is a cypress log. [filter-out-string]`);
        expect(stdout).to.contain(`.breaking-get [filter-out-string]`);

        expect(stdout).to.not.contain(`cy:route`);
        expect(stdout).to.not.contain(`cy:request`);
        expect(stdout).to.not.contain(`cons:error`);
        expect(stdout).to.not.contain(`cons:warn`);
        expect(stdout).to.not.contain(`cons:info`);
      }
    );
  }).timeout(60000);

  it('Should process logs if configuration added.', async () => {
    await runTest(
      commandBase(['setProcessLogs=1'], ['allTypesOfLogs.spec.js']),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(`This is a cypress log. [******]`);
        expect(stdout).to.contain(`This should console.log appear. [******]`);
        expect(stdout).to.contain(`get\t.breaking-get [******]`);
      }
    );
  }).timeout(60000);

  it('Should collect test logs if support configuration added.', async () => {
    await runTest(
      commandBase(['collectTestLogsSupport=1'], ['allTypesOfLogs.spec.js']),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(`Collected 17 logs for test "All types of logs."`);
        expect(stdout).to.contain(
          `last log: {"type":"cy:command","message":"get\\t.breaking-get [filter-out-string]","severity":"error"}`
        );
      }
    );
  }).timeout(60000);
});
