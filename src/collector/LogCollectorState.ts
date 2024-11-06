import CONSTANTS from '../constants';
import type {ExtendedSupportOptions} from '../installLogsCollector.types';
import type {Log, Severity} from '../types';

type LogArray = [Log['type'], Log['message'], Log['severity']];

interface StackLog extends Log {
  timeString?: string;
  chainId?: string;
}

export type StackLogArray = StackLog[] & {_ctr_before_each?: number};

export default class LogCollectorState extends EventTarget {
  afterHookIndexes: number[];
  beforeHookIndexes: number[];
  currentTest: any;
  isStrict: boolean;
  listeners: Record<string, CallableFunction[]>;
  logStacks: Array<StackLogArray | null>;
  suiteStartTime: Date | null;
  logProcessors: Array<(log: StackLog) => void> = [];

  constructor(protected config: ExtendedSupportOptions) {
    super();

    this.listeners = {};
    this.currentTest = null;
    this.logStacks = [];
    this.beforeHookIndexes = [];
    this.afterHookIndexes = [];
    this.isStrict = false;
    this.suiteStartTime = null;

    if (this.config.commandTimings == 'timestamp') {
      this.logProcessors.push((log) => {
        log.timeString = Date.now() + '';
      });
    } else if (this.config.commandTimings == 'seconds') {
      this.logProcessors.push((log) => {
        log.timeString = (Date.now() - (this.suiteStartTime?.getTime() || 0)) / 1000 + 's';
      });
    }
  }

  setStrict() {
    this.isStrict = true;
  }

  addNewLogStack() {
    if (this.config.debug) {
      console.log(
        CONSTANTS.DEBUG_LOG_PREFIX + 'adding new log stack, new size ' + (this.logStacks.length + 1)
      );
    }
    this.logStacks.push([]);
  }

  ensureLogStack() {
    if (!this.hasLogsInCurrentStack()) {
      this.addNewLogStack();
    }
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

    stack?.forEach((log) => {
      delete log.chainId;
    });

    this.logStacks[index] = null;
    return stack;
  }

  hasLogsInCurrentStack() {
    return this.getCurrentLogStack() && !!this.getCurrentLogStack()?.length;
  }

  getCurrentTest() {
    return this.currentTest;
  }

  addLog(entry: LogArray, chainId?: string) {
    const currentStack = this.getCurrentLogStack();

    if (!currentStack) {
      if (this.isStrict) {
        console.warn(
          'cypress-terminal-report: Attempted to collect logs while no stack was defined.'
        );
      }
      return;
    }

    const structuredEntry: StackLog = {
      type: entry[0],
      message: entry[1],
      severity: entry[2] || CONSTANTS.SEVERITY.SUCCESS,
      chainId,
    };

    this.logProcessors.forEach((processor) => processor(structuredEntry));
    currentStack.push(structuredEntry);

    this.dispatchEvent(new Event('log'));
  }

  updateLog(log: string, severity: Severity, id: string) {
    const entry = this.findReversed(id);
    if (entry) {
      entry.message = log;
      entry.severity = severity;
    }
    this.dispatchEvent(new Event('log'));
  }

  updateLogStatus(id: string, state: Severity = CONSTANTS.SEVERITY.ERROR) {
    const entry = this.findReversed(id);
    if (entry) {
      entry.severity = state;
    }
  }

  findReversed(id: string): StackLog | null {
    if (!id) {
      return null;
    }

    for (let i = this.logStacks.length - 1; i >= 0; i--) {
      const logStack = this.logStacks[i];
      if (logStack) {
        for (let j = logStack.length - 1; j >= 0; j--) {
          if (logStack[j].chainId === id) {
            return logStack[j];
          }
        }
      }
    }
    return null;
  }

  markCurrentStackFromBeforeEach() {
    if (this.config.debug) {
      console.log(
        CONSTANTS.DEBUG_LOG_PREFIX +
          'current log stack is before each at ' +
          this.getCurrentLogStackIndex()
      );
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
    return CONSTANTS.HOOK_TITLES.BEFORE.replace('{index}', `#${this.beforeHookIndexes[0]}`);
  }

  getAfterHookTestTile() {
    return CONSTANTS.HOOK_TITLES.AFTER.replace('{index}', `#${this.afterHookIndexes[0]}`);
  }

  startSuite() {
    if (this.config.debug) {
      console.log(CONSTANTS.DEBUG_LOG_PREFIX + 'starting suite');
    }
    this.suiteStartTime = new Date();
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

    this.currentTest = test;
    this.addNewLogStack();

    const currentIndex = this.getCurrentLogStackIndex();
    const previousIndex = currentIndex - 1;

    // Merge together before each log.
    if (this.logStacks[currentIndex]?._ctr_before_each && this.logStacks[previousIndex]) {
      this.logStacks[currentIndex] = this.logStacks[previousIndex].concat(
        this.logStacks[currentIndex]
      );
    }
  }
}
