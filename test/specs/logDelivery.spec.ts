import {runTest, commandBase, logLastRun} from '../utils';
import {expect} from 'chai';

const expectLaterTestsToRunAndPrintInOrder = (stdout: string) => {
  expect(stdout).to.contain('3 passing');
  expect(stdout).to.not.contain('failing');
  expect(stdout).to.not.contain('pending');
  expect(stdout).to.not.contain('"after each" hook');

  // Each test's logs print after the previous test's result and before its own,
  // the same position they have when delivery works.
  const firstResult = stdout.search(/[✓√] first test/);
  const secondLog = stdout.indexOf('log of second test');
  const secondResult = stdout.search(/[✓√] second test/);
  const thirdLog = stdout.indexOf('log of third test');
  const thirdResult = stdout.search(/[✓√] third test/);
  expect(firstResult).to.be.greaterThan(-1);
  expect(secondLog).to.be.greaterThan(firstResult);
  expect(secondResult).to.be.greaterThan(secondLog);
  expect(thirdLog).to.be.greaterThan(secondResult);
  expect(thirdResult).to.be.greaterThan(thirdLog);

  expect(stdout).to.not.contain('log of first test');
};

describe('Log delivery.', () => {
  afterEach(function () {
    if (this.currentTest?.state == 'failed') {
      logLastRun();
    }
  });

  it('Should not fail or skip tests when the printer task throws.', async () => {
    await runTest(
      commandBase(
        ['ctrLogDeliveryFailure=throw', 'printLogsToConsoleAlways=1', 'debug=1'],
        ['logDeliveryFailure.spec.js']
      ),
      (error, stdout) => {
        expectLaterTestsToRunAndPrintInOrder(stdout);
        expect(stdout).to.contain(
          '[cypress-terminal-report:debug] ctrLogMessages: Failed to receive messages, for cypress/integration/logDeliveryFailure.spec.js:Log delivery failure. -> first test [ctr-delivery-fails]:'
        );
        expect(stdout).to.contain('Simulated printer failure.');
        expect(stdout.match(/Failed to receive messages/g)).to.have.length(1);
      }
    );
  }).timeout(60000);

  it('Should not fail or skip tests when the printer task never responds.', async () => {
    await runTest(
      commandBase(
        ['ctrLogDeliveryFailure=hang', 'printLogsToConsoleAlways=1', 'debug=1'],
        ['logDeliveryFailure.spec.js']
      ),
      (error, stdout) => {
        expectLaterTestsToRunAndPrintInOrder(stdout);
        expect(stdout).to.contain(
          '[cypress-terminal-report:debug] ctrLogMessages: Failed to receive messages, for cypress/integration/logDeliveryFailure.spec.js:Log delivery failure. -> first test [ctr-delivery-fails]: timed out after 5000ms'
        );
      }
    );
  }).timeout(90000);
});
