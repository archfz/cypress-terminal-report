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
  // The support file is evaluated again for every spec, so this resets per spec.
  private deliveryFailureWarned = false;

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
      // Queued in the afterEach hook so the logs reach the printer before the
      // next test starts and stay grouped with their test in the terminal. The
      // send itself runs outside the queue: a failing `cy.task` would fail the
      // hook and skip the rest of the suite.
      cy.then({timeout: wait + CONSTANTS.LOG_DELIVERY_TIMEOUT + 1000}, () =>
        this.sendBestEffort(buildDataMessage, wait)
      );
    }
  }

  sendBestEffort(buildDataMessage: () => MessageData, wait: number): Promise<null> {
    // Lets the command log flush its debounced updates, such as a command
    // switching to failed, before the logs are read.
    return new Promise((resolve) => setTimeout(resolve, wait)).then(() => {
      const message = buildDataMessage();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`timed out after ${CONSTANTS.LOG_DELIVERY_TIMEOUT}ms`)),
          CONSTANTS.LOG_DELIVERY_TIMEOUT
        );
      });

      return Promise.race([
        utils.nonQueueTaskOrThrow(CONSTANTS.TASK_NAME, message, CONSTANTS.LOG_DELIVERY_TIMEOUT),
        timeout,
      ])
        .catch((error) => this.warnDeliveryFailure(message, error))
        .then(() => {
          clearTimeout(timer);
          return null;
        });
    });
  }

  warnDeliveryFailure(message: MessageData, error: unknown) {
    if (this.deliveryFailureWarned) {
      return;
    }
    this.deliveryFailureWarned = true;

    // The server's timeout error carries the task handler's source as its message.
    const reason = (error as {timedOut?: boolean})?.timedOut
      ? `timed out after ${CONSTANTS.LOG_DELIVERY_TIMEOUT}ms`
      : error instanceof Error
        ? error.message
        : String(error);
    console.warn(
      `cypress-terminal-report: Failed to send logs for test "${message.test}", so they were not printed: ${reason}\n` +
        `Further log delivery failures in this spec are not reported.`
    );
    utils.nonQueueTask(CONSTANTS.TASK_NAME_DELIVERY_WARNING, {
      spec: message.spec,
      test: message.test,
      error: reason,
    });
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
