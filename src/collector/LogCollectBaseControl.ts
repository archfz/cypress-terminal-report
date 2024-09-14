import CtrError from '../CtrError';
import {ExtendedSupportOptions} from "../installLogsCollector.types";
import LogCollectorState from "./LogCollectorState";
import {TestData} from "../types";

export default abstract class LogCollectBaseControl {
  protected abstract collectorState: LogCollectorState;
  protected abstract config: ExtendedSupportOptions;

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
    while (parent && parent.invocationDetails) {
      invocationDetails = parent.invocationDetails
      parent = parent.parent;
    }

    return parent.file || // Support for cypress-grep.
      invocationDetails.relativeFile ||
      (invocationDetails.fileUrl && invocationDetails.fileUrl.replace(/^[^?]+\?p=/, ''));
  }
}
