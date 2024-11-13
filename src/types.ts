import CONSTANTS from './constants';

// *****************************************************************************
// Type operations
// *****************************************************************************

export type ValueOf<T> = T[keyof T];

export type SetOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// *****************************************************************************
// String unions
// *****************************************************************************

export type Severity = ValueOf<typeof CONSTANTS.SEVERITY>;

export type LogType = ValueOf<typeof CONSTANTS.LOG_TYPES>;

export type LogSymbols =
  | ValueOf<typeof CONSTANTS.LOG_SYMBOLS>
  | ValueOf<typeof CONSTANTS.LOG_SYMBOLS_BASIC>
  | '-';

export type LogOccurrence = ValueOf<typeof CONSTANTS.LOG_OCCURRENCE>;

export type Colors = ValueOf<typeof CONSTANTS.COLORS>;

export type State = ValueOf<typeof CONSTANTS.STATE>;

export type CommandTimings = ValueOf<typeof CONSTANTS.COMMAND_TIMINGS>;

export type BuiltinOutputProcessorsTypes = 'txt' | 'json';

// *****************************************************************************
// Objects
// *****************************************************************************

export type Log = {
  type: LogType;
  message: string;
  severity: Severity;
  timeString?: string;
};

export type MessageData = {
  spec: string;
  test: string;
  state: State;
  messages: Log[];
  consoleTitle?: string;
  level?: number;
  isHook?: boolean;
  continuous?: boolean;
};

export type TestData = {
  mochaRunnable: Mocha.Runnable;
  testState?: string;
  testTitle: string;
  testLevel: number;
};
