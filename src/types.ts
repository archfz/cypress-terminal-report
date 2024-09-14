export type Severity = 'success' | 'error' | 'warning';

export type LogType = 'cons:log' |
  'cons:info' |
  'cons:warn' |
  'cons:error' |
  'cons:debug' |
  'cy:log' |
  'cy:xhr' |
  'cy:fetch' |
  'cy:request' |
  'cy:intercept' |
  'cy:command' |
  'ctr:info';

export type Log = {
  type: LogType,
  message: string,
  severity: Severity,
  timeString?: string,
};

export type MessageData = {
  spec: string,
  test: string,
  state: 'failed' | 'passed',
  messages: Log[],
  consoleTitle?: string;
  level?: number,
  isHook?: boolean;
  continuous?: boolean;
}

export type TestData = {
  mochaRunnable: Mocha.Runnable,
  testState?: string,
  testTitle: string,
  testLevel: number
}
