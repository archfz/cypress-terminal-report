import CONSTANTS from '../constants';

export default class LogCollectorState {
  afterHookIndexes: any;
  beforeHookIndexes: any;
  config: any;
  currentTest: any;
  isStrict: any;
  listeners: any;
  logStacks: any;
  suiteStartTime: any;
  xhrIdsOfLoggedResponses: any;
  constructor(config: any) {
    this.config = config;

    this.listeners = {};
    this.currentTest = null;
    this.logStacks = [];
    this.xhrIdsOfLoggedResponses = [];
    this.beforeHookIndexes = [];
    this.afterHookIndexes = [];
    this.isStrict = false;
    this.suiteStartTime = null;
  }

  setStrict(strict: any) {
    this.isStrict = true;
  }

  addNewLogStack() {
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'adding new log stack, new size ' + (this.logStacks.length + 1));
    }
    this.logStacks.push([]);
  }
  getCurrentLogStackIndex() {
    return this.logStacks.length - 1;
  }
  getCurrentLogStack() {
    return this.logStacks[this.getCurrentLogStackIndex()];
  }
  consumeLogStacks(index: any) {
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'consuming log stack at ' + index);
    }
    const stack = this.logStacks[index];
    this.logStacks[index] = null;

    stack.forEach((log: any) => {
      if (log.chainId) {
        delete log.chainId;
      }
    });

    return stack;
  }
  hasLogsCurrentStack() {
    return this.getCurrentLogStack() && !!(this.getCurrentLogStack().length);
  }
  getCurrentTest() {
    return this.currentTest;
  }
  setCurrentTest(test: any) {
    this.currentTest = test;
  }

  addLog(entry: any, chainId: any, xhrIdOfLoggedResponse: any) {
    entry[2] = entry[2] || CONSTANTS.SEVERITY.SUCCESS;

    const currentStack = this.getCurrentLogStack();
    if (!currentStack) {
      if (this.isStrict) {
        console.warn('cypress-terminal-report: Attempted to collect logs while no stack was defined.');
      }
      return;
    }

    const structuredEntry = {
      type: entry[0],
      message: entry[1],
      severity: entry[2],
    };

    if (chainId) {
      // @ts-expect-error TS(2339): Property 'chainId' does not exist on type '{ type:... Remove this comment to see the full error message
      structuredEntry.chainId = chainId;
    }
    if (this.config.commandTimings) {
      if (this.config.commandTimings == 'timestamp') {
        // @ts-expect-error TS(2339): Property 'timeString' does not exist on type '{ ty... Remove this comment to see the full error message
        structuredEntry.timeString = Date.now() + "";
      } else if (this.config.commandTimings == 'seconds') {
        // @ts-expect-error TS(2339): Property 'timeString' does not exist on type '{ ty... Remove this comment to see the full error message
        structuredEntry.timeString = (Date.now() - this.suiteStartTime.getTime()) / 1000 + "s";
      }
    }
    if (xhrIdOfLoggedResponse) {
      this.xhrIdsOfLoggedResponses.push(xhrIdOfLoggedResponse);
    }

    currentStack.push(structuredEntry);
    this.emit('log');
  }

  updateLog(log: any, severity: any, id: any) {
    this.loopLogStacks((entry: any) => {
      if (entry.chainId === id) {
        entry.message = log;
        entry.severity = severity;
      }
    });
    this.emit('log');
  }

  updateLogStatusForChainId(chainId: any, state = CONSTANTS.SEVERITY.ERROR) {
    this.loopLogStacks((entry: any) => {
        if (entry.chainId === chainId) {
          entry.severity = state;
        }
    });
  }

  loopLogStacks(callback: any) {
    this.logStacks.forEach((logStack: any) => {
      if (!logStack) {
        return;
      }

      logStack.forEach((entry: any) => {
        if (!entry) {
          return;
        }

        callback(entry);
      });
    });
  }

  hasXhrResponseBeenLogged(xhrId: any) {
    return this.xhrIdsOfLoggedResponses.includes(xhrId);
  }

  markCurrentStackFromBeforeEach() {
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'current log stack is before each at ' + this.getCurrentLogStackIndex());
    }
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
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'starting suite');
    }
    this.suiteStartTime = new Date();
    this.xhrIdsOfLoggedResponses = [];
    this.beforeHookIndexes.unshift(0);
    this.afterHookIndexes.unshift(0);
  }
  endSuite() {
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'ending suite');
    }
    this.beforeHookIndexes.shift();
    this.afterHookIndexes.shift();
  }
  startTest(test: any) {
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'starting test: ' + test.title);
    }
    this.setCurrentTest(test);
    this.xhrIdsOfLoggedResponses = [];

    this.addNewLogStack();

    // Merge together before each logs.
    const currentIndex = this.getCurrentLogStackIndex();
    let previousIndex = currentIndex - 1;
    while (
      // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
      this.getCurrentLogStack(previousIndex)
      // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
      && this.getCurrentLogStack(previousIndex)._ctr_before_each
    ) {
      this.logStacks[currentIndex] = this.logStacks[previousIndex].concat(this.logStacks[currentIndex]);
      --previousIndex;
    }
  }

  emit(event: any) {
    (this.listeners[event] || []).forEach((callback: any) => callback());
  }

  on(event: any, callback: any) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  }
}
