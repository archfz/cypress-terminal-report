import {ICONS, runTest, commandBase, logLastRun} from '../utils';

const {expect} = require('chai');

describe('Component testing support.', () => {
  afterEach(function () {
    if (this.currentTest?.state === 'failed') {
      logLastRun();
    }
  });

  it('Should log console correctly.', async () => {
    await runTest(commandBase([], ['consoleLogs.cy.jsx'], true), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cons:warn ${ICONS.warning}  warning`);
      expect(stdout).to.not.contain(`Maximum call stack size exceeded`);
    });
  }).timeout(60000);
});
