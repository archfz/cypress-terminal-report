import {ICONS, runTest, commandBase, logLastRun, logLastRunFull} from '../utils';
import {expect} from 'chai';

describe('Component testing support.', () => {
  afterEach(function () {
    if (this.currentTest?.state === 'failed') {
      const errMsg =
        (this.currentTest as any)?.err?.message || (this.currentTest as any)?.err?.stack || '';
      const isTimeout =
        typeof errMsg === 'string' && /timed? out|timeout of \d+ms exceeded/i.test(errMsg);
      if (isTimeout) {
        logLastRunFull();
      } else {
        logLastRun();
      }
    }
  });

  it('Should log console correctly.', async () => {
    await runTest(commandBase([], ['consoleLogs.cy.jsx'], true), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cons:warn ${ICONS.warning}  warning`);
      expect(stdout).to.not.contain(`Maximum call stack size exceeded`);
    });
  }).timeout(60000);
});
