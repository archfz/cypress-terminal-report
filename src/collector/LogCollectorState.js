const CONSTANTS = require('../constants');

module.exports = class LogCollectorState {
  constructor(config) {
    this.config = config;

    this.currentTest = null;
    this.logStacks = [];
    this.logsChainId = {};
    this.xhrIdsOfLoggedResponses = [];
    this.beforeHookIndexes = [];
    this.afterHookIndexes = [];
  }

  addNewLogStack() {
    this.logStacks.push([]);
  }
  getCurrentLogStackIndex() {
    return this.logStacks.length - 1;
  }
  getCurrentLogStack() {
    return this.logStacks[this.getCurrentLogStackIndex()];
  }
  consumeLogStacks(index) {
    const stack = this.logStacks[index];
    this.logStacks[index] = null;
    return stack;
  }
  hasLogsCurrentStack() {
    return this.getCurrentLogStack() && !!(this.getCurrentLogStack().length);
  }
  getCurrentTest() {
    return this.currentTest;
  }
  setCurrentTest(test) {
    this.currentTest = test;
  }
  getLogChainId(chainId) {
    return this.logsChainId[chainId];
  }

  addLog(entry, chainId, xhrIdOfLoggedResponse) {
    entry[2] = entry[2] || CONSTANTS.SEVERITY.SUCCESS;

    if (this.config.filterLog && !this.config.filterLog(entry)) {
      return;
    }

    if (chainId) {
      this.logsChainId[chainId] = this.getCurrentLogStack().length;
    }
    if (xhrIdOfLoggedResponse) {
      this.xhrIdsOfLoggedResponses.push(xhrIdOfLoggedResponse);
    }

    this.getCurrentLogStack().push(entry);
  }

  updateLog(log, severity, id) {
    this.logStacks.forEach(logStack => {
      const existingLog = this.logsChainId[id] && logStack && logStack[this.logsChainId[id]];
      if (existingLog) {
        existingLog[1] = log;
        existingLog[2] = severity;
      }
    });
  }

  updateLogStatusForChainId(chainId, state = CONSTANTS.SEVERITY.ERROR) {
    if (this.getLogChainId(chainId) !== undefined) {
      this.logStacks.forEach((logStack) => {
        if (logStack && logStack[this.getLogChainId(chainId)]) {
          logStack[this.getLogChainId(chainId)][2] = state;
        }
      });
    }
  }

  hasXhrResponseBeenLogged(xhrId) {
    return this.xhrIdsOfLoggedResponses.includes(xhrId);
  }

  markCurrentStackFromBeforeEach() {
    this.getCurrentLogStack()._ctr_before_each = 1;
  }

  incrementBeforeHookIndex() {
    ++this.beforeHookIndexes[0];
  }
  incrementAfterHookIndex() {
    ++this.afterHookIndexes[0];
  }

  getBeforeHookTestTile() {
    return CONSTANTS.HOOK_TITLES.BEFORE
      .replace('{index}', `#${this.beforeHookIndexes[0]}`);
  }
  getAfterHookTestTile() {
    return CONSTANTS.HOOK_TITLES.AFTER
      .replace('{index}', `#${this.afterHookIndexes[0]}`);
  }

  startSuite() {
    this.xhrIdsOfLoggedResponses = [];
    this.logsChainId = {};
    this.beforeHookIndexes.unshift(0);
    this.afterHookIndexes.unshift(0);
  }
  endSuite() {
    this.beforeHookIndexes.shift();
    this.afterHookIndexes.shift();
  }
  startTest(test) {
    this.setCurrentTest(test);
    this.xhrIdsOfLoggedResponses = [];

    this.addNewLogStack();

    // Merge together before each logs.
    const currentIndex = this.getCurrentLogStackIndex();
    let previousIndex = currentIndex - 1;
    while (
      this.getCurrentLogStack(previousIndex)
      && this.getCurrentLogStack(previousIndex)._ctr_before_each
    ) {
      this.logStacks[currentIndex] = this.logStacks[previousIndex].concat(this.logStacks[currentIndex]);
      --previousIndex;
    }
  }
}
