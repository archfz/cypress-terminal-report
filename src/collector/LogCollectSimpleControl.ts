import CONSTANTS from '../constants';
import LogCollectBaseControl from './LogCollectBaseControl';
import utils from "../utils";
import type LogCollectorState from "./LogCollectorState";
import {ExtendedSupportOptions} from "../installLogsCollector.types";
import * as stream from "node:stream";

/**
 * Collects and dispatches all logs from all tests and hooks.
 */
export default class LogCollectSimpleControl extends LogCollectBaseControl {
  constructor(protected collectorState: LogCollectorState, protected config: ExtendedSupportOptions) {
    super();
    this.config = config;
    this.collectorState = collectorState;
  }

  register() {
    this.registerState();
    this.registerTests();
    this.registerLogToFiles();
  }

  sendLogsToPrinter(
    logStackIndex: number,
    mochaRunnable: Mocha.Runnable,
    options: {
      state?: string,
      title?: string,
      noQueue?: boolean,
      consoleTitle?: string,
      isHook?: boolean,
    } = {}
  ) {
    let testState = options.state || mochaRunnable.state;
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

    if (testState === 'failed' && mochaRunnable && (mochaRunnable as any)._retries > 0) {
      testTitle += ` (Attempt ${mochaRunnable && (mochaRunnable as any)._currentRetry + 1})`
    }

    const prepareLogs = () => {
      return this.prepareLogs(logStackIndex, {mochaRunnable, testState, testTitle, testLevel});
    };

    const buildDataMessage = () => ({
      spec: spec,
      test: testTitle,
      messages: prepareLogs(),
      state: testState,
      level: testLevel,
      consoleTitle: options.consoleTitle,
      isHook: options.isHook,
      continuous: this.config.enableContinuousLogging,
    });

    if (options.noQueue) {
      utils.nonQueueTask(CONSTANTS.TASK_NAME, buildDataMessage()).catch(console.error);
    } else {
      // Need to wait for command log update debounce.
      cy.wait(wait, {log: false})
        .then(() => cy.task(CONSTANTS.TASK_NAME, buildDataMessage(), {log: false}));
    }
  }

  registerState() {
    Cypress.on('log:changed', (options) => {
      if (options.state === 'failed') {
        this.collectorState.updateLogStatusForChainId(options.id);
      }
    });

    // @ts-ignore
    Cypress.mocha.getRunner().on('test', (test: Mocha.Runnable) => {
      this.collectorState.startTest(test);
    });

    // @ts-ignore
    Cypress.mocha.getRunner().on('suite', () => {
      this.collectorState.startSuite();
    });

    // @ts-ignore
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
    // @ts-ignore
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
