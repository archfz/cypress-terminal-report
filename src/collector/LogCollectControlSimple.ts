import CONSTANTS from '../constants';
import LogCollectControlBase from './LogCollectControlBase';
import utils from '../utils';
import type LogCollectorState from './LogCollectorState';
import type {ExtendedSupportOptions} from '../installLogsCollector.types';
import type {MessageData, State} from '../types';

/**
 * Collects and dispatches all logs from all tests and hooks.
 */
export default class LogCollectControlSimple extends LogCollectControlBase {
  constructor(
    protected collectorState: LogCollectorState,
    protected config: ExtendedSupportOptions
  ) {
    super();
    this.config = config;
    this.collectorState = collectorState;
  }

  register() {
    this.registerState();

    if (this.config.enableContinuousLogging) {
      this.registerTestsContinuous();
    } else {
      this.registerTests();
    }

    this.registerLogToFiles();
  }

  triggerSendTask(
    buildDataMessage: (continuous?: boolean) => MessageData,
    noQueue: boolean,
    wait: number
  ) {
    if (noQueue) {
      utils.nonQueueTask(CONSTANTS.TASK_NAME, buildDataMessage()).catch(console.error);
    } else {
      // Need to wait for command log update debounce.
      cy.wait(wait, {log: false}).then(() =>
        cy.task(CONSTANTS.TASK_NAME, buildDataMessage(), {log: false})
      );
    }
  }

  registerState() {
    Cypress.on('log:changed', (options) => {
      if (options.state === 'failed') {
        this.collectorState.updateLogStatus(options.id);
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
      self.sendLogsToPrinter(
        self.collectorState.getCurrentLogStackIndex(),
        self.collectorState.getCurrentTest()
      );
    });

    // Logs commands if test was manually skipped.
    Cypress.mocha.getRunner().on('pending', function () {
      let test = self.collectorState.getCurrentTest();
      if (test?.state === ('pending' as State)) {
        // In case of fully skipped tests we might not yet have a log stack.
        self.collectorState.ensureLogStack();
        self.sendLogsToPrinter(self.collectorState.getCurrentLogStackIndex(), test, {
          noQueue: true,
        });
      }
    });
  }

  registerTestsContinuous() {
    const self = this;

    this.collectorState.addEventListener('log', () => {
      self.sendLogsToPrinter(
        self.collectorState.getCurrentLogStackIndex(),
        self.collectorState.getCurrentTest(),
        {noQueue: true, continuous: true}
      );
      this.collectorState.addNewLogStack();
    });
  }

  registerLogToFiles() {
    after(function () {
      cy.task(CONSTANTS.TASK_NAME_OUTPUT, null, {log: false});
    });
  }
}
