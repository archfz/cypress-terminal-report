import CtrError from '../CtrError';

export default class LogCollectBaseControl {
  collectorState: any;
  config: any;
  prepareLogs(logStackIndex: any, testData: any) {
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
