import {
  ICONS,
  runTest,
  commandBase, logLastRun, clean, runTestContinuous,
} from "../utils";

const {expect} = require('chai');

describe('Misc.', () => {

  afterEach(function () {
    if (this.currentTest.state == 'failed') {
      logLastRun();
    }
  });

  it('Should not break normal execution.', async () => {
    await runTest(commandBase([], ['successful.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.not.contain(`error`);
      expect(stdout).to.not.contain(`CypressError`);
      expect(stdout).to.contain(`1 passing`);
    });
  }).timeout(60000);

  it('Should properly set the breaking command in logs.', async () => {
    await runTest(commandBase([], [`waitFail.spec.js`]), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-wait`);
      expect(stdout).to.contain(`cy:xhr ${ICONS.route}  GET https://jsonplaceholder.cypress.io/comments/1
                    Status: 200`);
    });
  }).timeout(60000);

  it('Should be able to disable verbose.', async () => {
    await runTest(commandBase(['generateNestedOutput=1', 'disableVerbose=1'], ['multiple.dots.in.spec.js']), (error, stdout) => {
      expect(stdout).to.not.contain(`cypress-terminal-report: Wrote custom logs to txt.`);
      expect(stdout).to.not.contain(`cypress-terminal-report: Wrote custom logs to json.`);
      expect(stdout).to.not.contain(`cypress-terminal-report: Wrote custom logs to custom.`);
    });
  }).timeout(60000);

  it('Should display correctly in console with multiple contexts.', async () => {
    await runTest(commandBase([], ['mochaContexts.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`\n      cy:command ${ICONS.error}  get\t.breaking-get 1\n`);
      expect(stdout).to.contain(`\n        cy:command ${ICONS.error}  get\t.breaking-get 2\n`);
      expect(stdout).to.contain(`\n          cy:command ${ICONS.error}  get\t.breaking-get 3\n`);
    });
  }).timeout(60000);

  it('Should filter and process late update logs correctly.', async () => {
    await runTest(commandBase(['filterKeepOnlyWarningAndError=1,processAllLogs=1'], ['lateCommandUpdate.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:command ${ICONS.error}  | get\t.breaking-get`);
      expect(stdout).to.contain(`cy:xhr ${ICONS.warning}  | STUBBED PUT https://example.cypress.io/comments/10
                    Status: 404
                    Response body: {
                      "error": "Test message."
                    }`);
    });
  }).timeout(30000);

  it('Should not send logs outside of tests and it should not break cypress errors.', async () => {
    await runTest(commandBase([], ['errorsOutside.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`Cannot call \`cy.log()\` outside a running test.`);
      expect(stdout).to.not.contain(`TypeError: Cannot read property 'relativeFile' of undefined`);
    });
  }).timeout(30000);

  it('Should not overlap error throw outside of spec.', async () => {
    await runTest(commandBase([], ['errorsOutside2.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`> Error thrown outside of describe.`);
      expect(stdout).to.not.contain(`TypeError: Cannot read properties of undefined (reading 'replace')`);
    });
  }).timeout(30000);

  it('Should print logs for all cypress retries.', async () => {
    await runTest(commandBase(['breaking=1'], ['retries.spec.js']), (error, stdout, stderr) => {
      // @TODO: Attempt lines are not displayed anymore: (Attempt 1 of 3) fails
      expect(stdout).to.contain(`
      cy:command ${ICONS.error}  get\tbreaking


      cy:command ${ICONS.error}  get\tbreaking


    1) fails
      cy:command ${ICONS.error}  get\tbreaking`);
    });
  }).timeout(30000);

  it('Should work correctly with skipped tests.', async function () {
    await runTest(commandBase([''], ['skipTest.spec.js']), (error, stdout, stderr) => {
      expect(clean(stdout, true)).to.contain(`  Describe 1
    - Skipped test 1
    ✓ Test 2

  Describe 2
    - Skipped test 2
    - Skipped test 3
    ✓ Test 3
    ✓ Test 4`);
    });
  }).timeout(60000);

  it('Should continuously log.', async function () {
    let checksMade = 0;
    await runTestContinuous(
      commandBase(['enableContinuousLogging=1'], ['continuousLogging.spec.js']),
      'continuous logging',
      (data, elapsedTime) => {
        if (elapsedTime > 0.5 && elapsedTime <= 1) {
          ++checksMade;
          expect(clean(data)).to.contain(`cy:log ${ICONS.info}  log 1`);
          expect(clean(data)).to.contain(`cy:log ${ICONS.info}  log 2`);
          expect(clean(data)).to.not.contain(`cy:log ${ICONS.info}  log 3`);
        }
        if (elapsedTime > 2.6 && elapsedTime <= 3) {
          ++checksMade;
          expect(clean(data)).to.contain(`cy:log ${ICONS.info}  log again 1`);
          expect(clean(data)).to.not.contain(`cy:log ${ICONS.info}  log again 2`);
        }
      });

    expect(checksMade, "No checks where made. The process might have ended too early.").to.be.greaterThan(0)
  }).timeout(60000);

});
