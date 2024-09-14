import CONSTANTS from '../constants';
import {ExtendedSupportOptions} from "../installLogsCollector.types";
import {Log, Severity} from "../types";

type LogArray = [Log['type'], Log['message'], Log['severity']]

interface StackLog extends Log {
  timeString?: string;
  chainId?: string;
}

export type StackLogArray = StackLog[] & { _ctr_before_each?: number }

export default class LogCollectorState {
  afterHookIndexes: number[];
  beforeHookIndexes: number[];
  currentTest: any;
  isStrict: boolean;
  listeners: Record<string, CallableFunction[]>;
  logStacks: Array<StackLogArray | null>;
  suiteStartTime: Date | null;
  xhrIdsOfLoggedResponses: string[];

  constructor(protected config: ExtendedSupportOptions) {
    this.listeners = {};
    this.currentTest = null;
    this.logStacks = [];
    this.xhrIdsOfLoggedResponses = [];
    this.beforeHookIndexes = [];
    this.afterHookIndexes = [];
    this.isStrict = false;
    this.suiteStartTime = null;
  }

  setStrict() {
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
  consumeLogStacks(index: number) {
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'consuming log stack at ' + index);
    }
    const stack = this.logStacks[index];
    this.logStacks[index] = null;

    stack?.forEach((log) => {
      if (log.chainId) {
        delete log.chainId;
      }
    });

    return stack;
  }
  hasLogsCurrentStack() {
    return this.getCurrentLogStack() && !!(this.getCurrentLogStack()?.length);
  }
  getCurrentTest() {
    return this.currentTest;
  }
  setCurrentTest(test: any) {
    this.currentTest = test;
  }

  addLog(entry: LogArray, chainId?: string, xhrIdOfLoggedResponse?: any) {
    entry[2] = entry[2] || CONSTANTS.SEVERITY.SUCCESS;

    const currentStack = this.getCurrentLogStack();
    if (!currentStack) {
      if (this.isStrict) {
        console.warn('cypress-terminal-report: Attempted to collect logs while no stack was defined.');
      }
      return;
    }

    const structuredEntry: StackLog = {
      type: entry[0],
      message: entry[1],
      severity: entry[2],
    };

    if (chainId) {
      structuredEntry.chainId = chainId;
    }
    if (this.config.commandTimings) {
      if (this.config.commandTimings == 'timestamp') {
        structuredEntry.timeString = Date.now() + "";
      } else if (this.config.commandTimings == 'seconds' && this.suiteStartTime) {
        structuredEntry.timeString = (Date.now() - this.suiteStartTime.getTime()) / 1000 + "s";
      }
    }
    if (xhrIdOfLoggedResponse) {
      this.xhrIdsOfLoggedResponses.push(xhrIdOfLoggedResponse);
    }

    currentStack.push(structuredEntry);
    this.emit('log');
  }

  updateLog(log: string, severity: Severity, id: string) {
    this.loopLogStacks((entry: any) => {
      if (entry.chainId === id) {
        entry.message = log;
        entry.severity = severity;
      }
    });
    this.emit('log');
  }

  updateLogStatusForChainId(chainId: string, state: Severity = CONSTANTS.SEVERITY.ERROR) {
    this.loopLogStacks((entry: any) => {
        if (entry.chainId === chainId) {
          entry.severity = state;
        }
    });
  }

  loopLogStacks(callback: (entry: StackLog) => void) {
    this.logStacks.forEach((logStack) => {
      if (logStack) {
        logStack.forEach((entry) => {
          if (entry) {
            callback(entry);
          }
        });
      }
    });
  }

  markCurrentStackFromBeforeEach() {
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'current log stack is before each at ' + this.getCurrentLogStackIndex());
    }
    let stack = this.getCurrentLogStack();
    if (stack) {
      stack._ctr_before_each = 1;
    }
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

    // Merge together before each log.
    const currentIndex = this.getCurrentLogStackIndex();
    let previousIndex = currentIndex - 1;
    while (this.getCurrentLogStack()?._ctr_before_each) {
      const previousStack = this.logStacks[previousIndex];
      if (previousStack) {
        this.logStacks[currentIndex] = previousStack.concat(this.logStacks[currentIndex] || []);
      }
      --previousIndex;
    }
  }

  emit(event: 'log') {
    (this.listeners[event] || []).forEach((callback: any) => callback());
  }

  on(event: 'log', callback: () => void) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  }
}
