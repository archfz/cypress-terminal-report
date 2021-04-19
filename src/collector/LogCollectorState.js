const CONSTANTS = require('../constants');

module.exports = class LogCollectorState {
  constructor(config) {
    this.config = config;

    this.currentTest = null;
    this.logStacks = [];
    this.xhrIdsOfLoggedResponses = [];
    this.beforeHookIndexes = [];
    this.afterHookIndexes = [];
    this.isStrict = false;
  }

  setStrict(strict) {
    this.isStrict = true;
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

  addLog(entry, chainId, xhrIdOfLoggedResponse) {
    entry[2] = entry[2] || CONSTANTS.SEVERITY.SUCCESS;

    const currentStack = this.getCurrentLogStack();
    if (!currentStack) {
      if (this.isStrict) {
        console.warn('[cypress-terminal-report] Attempted to collect logs while no stack was defined.');
      }
      return;
    }

    if (chainId) {
      entry.chainId = chainId;
    }
    if (xhrIdOfLoggedResponse) {
      this.xhrIdsOfLoggedResponses.push(xhrIdOfLoggedResponse);
    }

    currentStack.push(entry);
  }

  updateLog(log, severity, id) {
    this.loopLogStacks((entry) => {
      if (entry.chainId === id) {
        entry[1] = log;
        entry[2] = severity;
      }
    });
  }

  updateLogStatusForChainId(chainId, state = CONSTANTS.SEVERITY.ERROR) {
    this.loopLogStacks((entry) => {
        if (entry.chainId === chainId) {
          entry[2] = state;
        }
    });
  }

  loopLogStacks(callback) {
    this.logStacks.forEach(logStack => {
      if (!logStack) {
        return;
      }

      logStack.forEach(entry => {
        if (!entry) {
          return;
        }

        callback(entry);
      });
    });
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
