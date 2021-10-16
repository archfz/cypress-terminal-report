const CtrError = require('../CtrError');

module.exports = class LogCollectBaseControl {
  prepareLogs(logStackIndex, testData) {
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
}
