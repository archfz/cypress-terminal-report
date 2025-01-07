import {
  ICONS,
  clean,
  runTest,
  commandBase,
  expectOutputFilesToBeCorrect,
  outputCleanUpAndInitialization,
  logLastRun,
} from '../utils';
import {expect} from 'chai';
require('chai').config.truncateThreshold = 0;

describe('Extended controller.', () => {
  afterEach(function () {
    if (this.currentTest?.state == 'failed') {
      logLastRun();
    }
  });

  it('Should generate proper log output files for after and before hooks when logging is on fail.', async () => {
    const {outRoot, outFiles} = outputCleanUpAndInitialization();

    const specFiles = [
      'afterLogs.spec.js',
      'beforeLogs.spec.js',
      'allHooks.spec.js',
      'mochaContexts.spec.js',
    ];
    await runTest(
      commandBase(['generateOutput=1', 'enableExtendedCollector=1'], specFiles),
      (error, stdout, stderr) => {
        expectOutputFilesToBeCorrect(outFiles, outRoot, 'hooks.onFail');
      }
    );
  }).timeout(90000);

  it('Should print all tests to output files when configured so with hooks and contexts.', async function () {
    this.retries(1);

    const {outRoot, outFiles} = outputCleanUpAndInitialization();

    const specFiles = [
      'afterLogs.spec.js',
      'allHooks.spec.js',
      'beforeLogs.spec.js',
      'mochaContexts.spec.js',
    ];
    await runTest(
      commandBase(
        ['generateOutput=1', 'printLogsToFileAlways=1', 'enableExtendedCollector=1'],
        specFiles
      ),
      (error, stdout, stderr) => {
        expectOutputFilesToBeCorrect(outFiles, outRoot, 'hooks.always');
      }
    );
  }).timeout(90000);

  it('Should display logs from before all hooks if they fail.', async function () {
    this.retries(3);

    await runTest(
      commandBase(['enableExtendedCollector=1'], ['beforeLogs.spec.js']),
      (error, stdout, stderr) => {
        expect(clean(stdout, true)).to.contain(
          clean(`  before fails
    1) "before all" hook for "the test"
          cy:log ${ICONS.info}  some before command
      cy:command ${ICONS.error}  get\t.breaking.get



  before succeeds
    2) the test fails

          cy:log ${ICONS.info}  log
      cy:command ${ICONS.error}  get\t.breaking.get


  nested before fails
    ✓ not nested
    nested context
      3) "before all" hook for "the test nested"
            cy:log ${ICONS.info}  some before command in nested
        cy:command ${ICONS.error}  get\t.breaking.get`)
        );
      }
    );
  }).timeout(60000);

  it('Should display logs from before all hooks even if they passed, when configured so.', async function () {
    this.retries(3);

    await runTest(
      commandBase(
        ['printSuccessfulHookLogs=1', 'enableExtendedCollector=1'],
        ['beforeLogs.spec.js']
      ),
      (error, stdout, stderr) => {
        expect(clean(stdout, true)).to.contain(
          clean(`  before fails
    1) "before all" hook for "the test"
          cy:log ${ICONS.info}  some before command
      cy:command ${ICONS.error}  get\t.breaking.get



    [[ after all #1 ]]
          cy:log ${ICONS.info}  after


  before succeeds
    [[ before all #1 ]]
          cy:log ${ICONS.info}  some before command
          cy:log ${ICONS.info}  some other before command


    [[ before all #2 ]]
          cy:log ${ICONS.info}  some before command from second before hook


    2) the test fails

          cy:log ${ICONS.info}  log
      cy:command ${ICONS.error}  get\t.breaking.get


    [[ after all #1 ]]
          cy:log ${ICONS.info}  after before succeeds


  nested before fails
    [[ before all #1 ]]
          cy:log ${ICONS.info}  some before command not in nested


    ✓ not nested
    nested context
      3) "before all" hook for "the test nested"
            cy:log ${ICONS.info}  some before command in nested
        cy:command ${ICONS.error}  get\t.breaking.get



      [[ after all #1 ]]
            cy:log ${ICONS.info}  after nested


    [[ after all #1 ]]
          cy:log ${ICONS.info}  after not nested`)
        );
      }
    );
  }).timeout(60000);

  it('Should display logs from outer before all hooks that failed in scope of nested suites.', async function () {
    this.retries(3);

    await runTest(
      commandBase(
        ['printSuccessfulHookLogs=1', 'enableExtendedCollector=1'],
        ['beforeLogs.spec.js']
      ),
      (error, stdout, stderr) => {
        expect(clean(stdout, true)).to.contain(
          clean(`  Describe 1
    4) "before all" hook for "it 1"
            cy:log ${ICONS.info}  Log 1
        cy:command ${ICONS.error}  assert\tExpect 1: expected **false** to be true`)
        );
      }
    );
  }).timeout(60000);

  it('Should not display logs from before all hooks when printing to console is never.', async function () {
    await runTest(
      commandBase(
        ['printSuccessfulHookLogs=1', 'enableExtendedCollector=1', 'printLogsToConsoleNever=1'],
        ['beforeLogs.spec.js']
      ),
      (error, stdout, stderr) => {
        expect(clean(stdout, true)).to.not.contain(`cy:log ${ICONS.info}  some before command`);
      }
    );
  }).timeout(60000);

  it('Should display logs from after all hooks if they fail.', async function () {
    this.retries(3);

    await runTest(
      commandBase(['enableExtendedCollector=1'], ['afterLogs.spec.js']),
      (error, stdout, stderr) => {
        expect(clean(stdout, true)).to.contain(
          clean(`1) "after all" hook for "the test 11"

          cy:log ✱  after log simple
      cy:command ✘  get\tafter simple`)
        );

        expect(clean(stdout, true)).to.contain(
          clean(`nested after fails
    nested context
      ✓ the test 3
      2) "after all" hook for "the test 3"
      3) "after all" hook for "the test 3"
        cy:command ${ICONS.error}  get\tafter nested


          cy:log ${ICONS.info}  log after root
      cy:command ${ICONS.error}  get\tafter root`)
        );
      }
    );
  }).timeout(60000);

  it('Should display logs from after all hooks even if they passed, when configured so.', async function () {
    this.retries(3);

    await runTest(
      commandBase(
        ['printSuccessfulHookLogs=1', 'enableExtendedCollector=1'],
        ['afterLogs.spec.js']
      ),
      (error, stdout, stderr) => {
        expect(clean(stdout, true)).to.contain(
          clean(`  after succeeds
    ✓ the test 2
    ✓ the test 22
    ✓ the test 222

    [[ after all #1 ]]
          cy:log ${ICONS.info}  after 1


    [[ after all #2 ]]
          cy:log ${ICONS.info}  after 2


  nested after fails`)
        );
      }
    );
  }).timeout(60000);

  it('Should not error with extended collector when a top level suite is skipped.', async function () {
    await runTest(
      commandBase(['enableExtendedCollector=1'], ['skipTopLevelSuite.spec.js']),
      (error, stdout, stderr) => {
        expect(clean(stdout)).to.contain(clean(`1 pending`));
      }
    );
  }).timeout(60000);

  it('Should not send logs twice when parent suite after each exists for test.', async function () {
    await runTest(
      commandBase(['enableExtendedCollector=1'], ['mochaContexts2.spec.js']),
      (error, stdout, stderr) => {
        expect(clean(stdout).match(/Nested test no after each/g) || []).to.have.length(1);
        expect(clean(stdout).match(/Nested test with after each/g) || []).to.have.length(1);
      }
    );
  }).timeout(60000);

  it('Should work correctly with dynamic skip. [backward-compatibility-skip]', async function () {
    this.retries(2);

    await runTest(
      commandBase(['enableExtendedCollector=1'], ['dynamicSkip.spec.js']),
      (error, stdout, stderr) => {
        expect(clean(stdout)).to.contain(`- test3
          cy:log ${ICONS.info}  before
          cy:log ${ICONS.info}  test3 1
          cy:log ${ICONS.info}  test3 2
          cy:log ${ICONS.info}  test3 3
      cy:command ${ICONS.success}  wrap\t{}


    ✓ test4`);
      }
    );
  }).timeout(60000);

  it('Should work correctly with skipped tests.', async function () {
    await runTest(
      commandBase(['enableExtendedCollector=1'], ['skipTest.spec.js']),
      (error, stdout, stderr) => {
        expect(clean(stdout, true)).to.contain(`  Describe 1
    - Skipped test 1
    ✓ Test 2

  Describe 2
    - Skipped test 2
    - Skipped test 3
    ✓ Test 3
    ✓ Test 4`);
      }
    );
  }).timeout(60000);

  it('Should work correctly with simple skipped tests.', async function () {
    await runTest(
      commandBase(
        ['enableExtendedCollector=1,printLogsToConsoleAlways=1'],
        ['skipTestSimple.spec.js']
      ),
      (error, stdout, stderr) => {
        expect(clean(stdout, true)).to.contain(`  Error repro
    ✓ Test1
    - test2
    - test3`);
      }
    );
  }).timeout(60000);
});
