const CONSTANTS = require('../constants');

/**
 * Collects and dispatches all logs from all tests and hooks.
 */
module.exports = class LogCollectSimpleControl {

  constructor(collectorState, config) {
    this.config = config;
    this.collectorState = collectorState;
  }

  register() {
    this.registerState();
    this.registerTests();
    this.registerLogToFiles();
  }

  sendLogsToPrinter(logStackIndex, mochaRunnable, options = {}) {
    let testState = options.state || mochaRunnable.state;
    let testTitle = options.title || mochaRunnable.title;
    let testLevel = 0;
    let spec = mochaRunnable.parent.invocationDetails.relativeFile;
    let wait = typeof options.wait === 'number' ? options.wait : 6;

    let parent = mochaRunnable.parent;
    while (parent && parent.title) {
      testTitle = `${parent.title} -> ${testTitle}`
      parent = parent.parent;
      ++testLevel;
    }

    const prepareLogs = () => {
      const logsCopy = this.collectorState.consumeLogStacks(logStackIndex);

      if (logsCopy === null) {
        throw new Error(`[cypress-terminal-report] Domain exception: log stack null.`);
      }

      if (this.config.collectTestLogs) {
        this.config.collectTestLogs({mochaRunnable, testState, testTitle, testLevel}, logsCopy);
      }

      return logsCopy;
    };

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
            consoleTitle: options.consoleTitle,
            isHook: options.isHook,
          },
          {log: false}
        );
      });
  }

  registerState() {
    Cypress.on('log:changed', (options) => {
      if (options.state === 'failed') {
        this.collectorState.updateLogStatusForChainId(options.id);
      }
    });
    Cypress.mocha.getRunner().on('test', (test) => {
      this.collectorState.startTest(test);
    });
    Cypress.mocha.getRunner().on('suite', () => {
      this.collectorState.startSuite();
    });
    Cypress.mocha.getRunner().on('suite end', () => {
      this.collectorState.endSuite();
    });
  }

  registerTests() {
    const self = this;

    afterEach(function () {
      self.sendLogsToPrinter(self.collectorState.getCurrentLogStackIndex(), self.collectorState.getCurrentTest());
    });
  }

  registerLogToFiles() {
    after(function () {
      // Need to wait otherwise some last commands get omitted from logs.
      cy.task(CONSTANTS.TASK_NAME_OUTPUT, null, {log: false});
    });
  }

};
