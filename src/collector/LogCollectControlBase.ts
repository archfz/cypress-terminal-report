import CtrError from '../CtrError';
import type {ExtendedSupportOptions} from '../installLogsCollector.types';
import LogCollectorState from './LogCollectorState';
import type {MessageData, SetOptional, State, TestData} from '../types';

const getRetryTitles = (
  testState: State | undefined,
  mochaRunnable: Mocha.Runnable,
  testTitle: string
) => {
  if (testState !== 'failed' || mochaRunnable['_retries'] <= 0) {
    return {testTitle, consoleTitle: undefined};
  }

  const attempt = mochaRunnable['_currentRetry'] + 1;
  const attemptTitle = `(Attempt ${attempt} of ${mochaRunnable['_retries'] + 1}) ${testTitle}`;

  return {
    testTitle: `${testTitle} (Attempt ${attempt})`,
    consoleTitle: Cypress.config('reporter') === 'spec' ? undefined : attemptTitle,
  };
};

export default abstract class LogCollectControlBase {
  protected abstract collectorState: LogCollectorState;
  protected abstract config: ExtendedSupportOptions;

  sendLogsToPrinter(
    logStackIndex: number,
    mochaRunnable: Mocha.Runnable,
    options: {
      state?: State;
      title?: string;
      noQueue?: boolean;
      consoleTitle?: string;
      isHook?: boolean;
      wait?: number;
      continuous?: boolean;
    } = {}
  ) {
    let testState = options.state || mochaRunnable.state;
    let testTitle = options.title || mochaRunnable.title;
    let testLevel = 0;

    let spec = this.getSpecFilePath(mochaRunnable);
    if (!spec) return;

    let wait = typeof options.wait === 'number' ? options.wait : 5;

    {
      let parent = mochaRunnable.parent;
      while (parent?.title) {
        testTitle = `${parent.title} -> ${testTitle}`;
        parent = parent.parent;
        ++testLevel;
      }
    }

    const retryTitles = getRetryTitles(testState, mochaRunnable, testTitle);
    testTitle = retryTitles.testTitle;

    const prepareLogs = () =>
      this.prepareLogs(logStackIndex, {mochaRunnable, testState, testTitle, testLevel});

    const buildDataMessage = () => ({
      spec: spec,
      test: testTitle,
      messages: prepareLogs(),
      state: testState,
      level: testLevel,
      consoleTitle: options.consoleTitle ?? retryTitles.consoleTitle,
      isHook: options.isHook,
      continuous: options.continuous,
    });

    this.triggerSendTask(buildDataMessage, options.noQueue || false, wait);
  }

  protected abstract triggerSendTask(
    buildDataMessage: (continuous?: boolean) => SetOptional<MessageData, 'state'>,
    noQueue: boolean,
    wait: number
  ): void;

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

  getSpecFilePath(mochaRunnable: Mocha.Runnable) {
    if (!mochaRunnable.invocationDetails && !mochaRunnable.parent?.invocationDetails) {
      return mochaRunnable.parent?.file ?? null;
    }

    let invocationDetails = mochaRunnable.invocationDetails;
    let parent = mochaRunnable.parent;
    // always get top-most spec to determine the called .spec file
    while (parent?.invocationDetails) {
      invocationDetails = parent.invocationDetails;
      parent = parent.parent;
    }

    return (
      parent?.file || // Support for cypress-grep.
      invocationDetails.relativeFile ||
      invocationDetails.fileUrl?.replace(/^[^?]+\?p=/, '')
    );
  }
}
