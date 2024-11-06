import CtrError from '../CtrError';
import type {ExtendedSupportOptions} from "../installLogsCollector.types";
import LogCollectorState from "./LogCollectorState";
import type {MessageData, State, TestData} from "../types";

export default abstract class LogCollectControlBase {
  protected abstract collectorState: LogCollectorState;
  protected abstract config: ExtendedSupportOptions;

  sendLogsToPrinter(
    logStackIndex: number,
    mochaRunnable: Mocha.Runnable,
    options: {
      state?: State,
      title?: string,
      noQueue?: boolean,
      consoleTitle?: string,
      isHook?: boolean,
      wait?: number,
      continuous?: boolean,
    } = {}
  ) {
    let testState = options.state || mochaRunnable.state as State;
    let testTitle = options.title || mochaRunnable.title;
    let testLevel = 0;

    let spec = this.getSpecFilePath(mochaRunnable);

    if (!spec) {
      return;
    }

    let wait = typeof options.wait === 'number' ? options.wait : 5;

    {
      let parent = mochaRunnable.parent;
      while (parent?.title) {
        testTitle = `${parent.title} -> ${testTitle}`
        parent = parent.parent;
        ++testLevel;
      }
    }

    if (testState === 'failed' && mochaRunnable && (mochaRunnable as any)._retries > 0) {
      testTitle += ` (Attempt ${mochaRunnable && (mochaRunnable as any)._currentRetry + 1})`
    }

    const prepareLogs = () => 
      this.prepareLogs(logStackIndex, {mochaRunnable, testState, testTitle, testLevel});

    const buildDataMessage = () => ({
      spec: spec,
      test: testTitle,
      messages: prepareLogs(),
      state: testState,
      level: testLevel,
      consoleTitle: options.consoleTitle,
      isHook: options.isHook,
      continuous: options.continuous,
    });

    this.triggerSendTask(buildDataMessage, options.noQueue || false, wait);
  }

  protected abstract triggerSendTask(buildDataMessage: (continuous?: boolean) => MessageData, noQueue: boolean, wait: number): void;

  prepareLogs(logStackIndex: number, testData: TestData) {
    let logsCopy = this.collectorState.consumeLogStacks(logStackIndex);

    if (logsCopy === null) {
      throw new CtrError(`Domain exception: log stack null.`);
    }

    if (this.config.filterLog) {
      logsCopy = logsCopy.filter(this.config.filterLog);
    }

    if (this.config.processLog) {
      logsCopy = logsCopy.map(this.config.processLog);
    }

    if (this.config.collectTestLogs) {
      this.config.collectTestLogs(testData, logsCopy);
    }

    return logsCopy;
  }

  getSpecFilePath(mochaRunnable: any) {
    if (!mochaRunnable.invocationDetails && !mochaRunnable.parent.invocationDetails) {
      if (mochaRunnable.parent.file) {
        return mochaRunnable.parent.file;
      }
      return null;
    }

    let invocationDetails = mochaRunnable.invocationDetails;
    let parent = mochaRunnable.parent;
    // always get top-most spec to determine the called .spec file
    while (parent?.invocationDetails) {
      invocationDetails = parent.invocationDetails
      parent = parent.parent;
    }

    return parent.file || // Support for cypress-grep.
      invocationDetails.relativeFile ||
      invocationDetails.fileUrl?.replace(/^[^?]+\?p=/, '');
  }
}
