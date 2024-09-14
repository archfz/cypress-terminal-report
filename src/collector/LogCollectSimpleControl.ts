import CONSTANTS from '../constants';
import LogCollectBaseControl from './LogCollectBaseControl';
import utils from "../utils";

/**
 * Collects and dispatches all logs from all tests and hooks.
 */
export default class LogCollectSimpleControl extends LogCollectBaseControl {
  collectorState: any;
  config: any;
  getSpecFilePath: any;
  prepareLogs: any;

  constructor(collectorState: any, config: any) {
    super();
    this.config = config;
    this.collectorState = collectorState;
  }

  register() {
    this.registerState();
    this.registerTests();
    this.registerLogToFiles();
  }

  sendLogsToPrinter(logStackIndex: any, mochaRunnable: any, options = {}) {
    // @ts-expect-error TS(2339): Property 'state' does not exist on type '{}'.
    let testState = options.state || mochaRunnable.state;
    // @ts-expect-error TS(2339): Property 'title' does not exist on type '{}'.
    let testTitle = options.title || mochaRunnable.title;
    let testLevel = 0;

    let spec = this.getSpecFilePath(mochaRunnable);

    if (!spec) {
      return;
    }

    // @ts-expect-error TS(2339): Property 'wait' does not exist on type '{}'.
    let wait = typeof options.wait === 'number' ? options.wait : 6;

    {
      let parent = mochaRunnable.parent;
      while (parent && parent.title) {
        testTitle = `${parent.title} -> ${testTitle}`
        parent = parent.parent;
        ++testLevel;
      }
    }

    if (testState === 'failed' && mochaRunnable && mochaRunnable._retries > 0) {
      testTitle += ` (Attempt ${mochaRunnable && mochaRunnable._currentRetry + 1})`
    }

    const prepareLogs = () => {
      return this.prepareLogs(logStackIndex, {mochaRunnable, testState, testTitle, testLevel});
    };

    // @ts-expect-error TS(2339): Property 'noQueue' does not exist on type '{}'.
    if (options.noQueue) {
      utils.nonQueueTask(CONSTANTS.TASK_NAME, {
        spec: spec,
        test: testTitle,
        messages: prepareLogs(),
        state: testState,
        level: testLevel,
        // @ts-expect-error TS(2339): Property 'consoleTitle' does not exist on type '{}... Remove this comment to see the full error message
        consoleTitle: options.consoleTitle,
        // @ts-expect-error TS(2339): Property 'isHook' does not exist on type '{}'.
        isHook: options.isHook,
        continuous: this.config.enableContinuousLogging,
      }).catch(console.error);
    } else {
      // Need to wait for command log update debounce.
      cy.wait(wait, {log: false})
        .then(() => {
          cy.task(
            CONSTANTS.TASK_NAME,
            {
              spec: spec,
              test: testTitle,
              messages: prepareLogs(),
              state: testState,
              level: testLevel,
              // @ts-expect-error TS(2339): Property 'consoleTitle' does not exist on type '{}... Remove this comment to see the full error message
              consoleTitle: options.consoleTitle,
              // @ts-expect-error TS(2339): Property 'isHook' does not exist on type '{}'.
              isHook: options.isHook,
              continuous: this.config.enableContinuousLogging,
            },
            {log: false}
          );
        });
    }
  }

  registerState() {
    Cypress.on('log:changed', (options: any) => {
      if (options.state === 'failed') {
        this.collectorState.updateLogStatusForChainId(options.id);
      }
    });
    // @ts-expect-error TS(2339): Property 'mocha' does not exist on type 'Cypress &... Remove this comment to see the full error message
    Cypress.mocha.getRunner().on('test', (test: any) => {
      this.collectorState.startTest(test);
    });
    // @ts-expect-error TS(2339): Property 'mocha' does not exist on type 'Cypress &... Remove this comment to see the full error message
    Cypress.mocha.getRunner().on('suite', () => {
      this.collectorState.startSuite();
    });
    // @ts-expect-error TS(2339): Property 'mocha' does not exist on type 'Cypress &... Remove this comment to see the full error message
    Cypress.mocha.getRunner().on('suite end', () => {
      this.collectorState.endSuite();
    });
  }

  registerTests() {
    const self = this;

    if (this.config.enableContinuousLogging) {
      this.collectorState.on('log', () => {
        self.sendLogsToPrinter(self.collectorState.getCurrentLogStackIndex(), self.collectorState.getCurrentTest(), {noQueue: true});
        this.collectorState.addNewLogStack();
      });
      return;
    }

    afterEach(function () {
      self.sendLogsToPrinter(self.collectorState.getCurrentLogStackIndex(), self.collectorState.getCurrentTest());
    });

    // Logs commands if test was manually skipped.
    // @ts-expect-error TS(2339): Property 'mocha' does not exist on type 'Cypress &... Remove this comment to see the full error message
    Cypress.mocha.getRunner().on('pending', function () {
      let test = self.collectorState.getCurrentTest();
      if (test && test.state === 'pending') {
        // In case of fully skipped tests we might not yet have a log stack.
        if (!self.collectorState.hasLogsCurrentStack()) {
          self.collectorState.addNewLogStack();
        }
        self.sendLogsToPrinter(self.collectorState.getCurrentLogStackIndex(), test, {noQueue: true});
      }
    });
  }

  registerLogToFiles() {
    after(function () {
      // Need to wait otherwise some last commands get omitted from logs.
      cy.task(CONSTANTS.TASK_NAME_OUTPUT, null, {log: false});
    });
  }
};
