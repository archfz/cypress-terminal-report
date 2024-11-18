const CONSTANTS = {
  TASK_NAME: 'ctrLogMessages',
  TASK_NAME_OUTPUT: 'ctrLogFiles',

  LOG_TYPES: {
    BROWSER_CONSOLE_LOG: 'cons:log',
    BROWSER_CONSOLE_INFO: 'cons:info',
    BROWSER_CONSOLE_WARN: 'cons:warn',
    BROWSER_CONSOLE_ERROR: 'cons:error',
    BROWSER_CONSOLE_DEBUG: 'cons:debug',

    CYPRESS_LOG: 'cy:log',
    CYPRESS_XHR: 'cy:xhr',
    CYPRESS_FETCH: 'cy:fetch',
    CYPRESS_REQUEST: 'cy:request',
    CYPRESS_INTERCEPT: 'cy:intercept',
    CYPRESS_COMMAND: 'cy:command',

    PLUGIN_LOG_TYPE: 'ctr:info',
  },

  SEVERITY: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
  },

  /**
   * Unicode log symbols
   */
  LOG_SYMBOLS: {
    ERROR: '✘',
    WARNING: '❖',
    SUCCESS: '✔',
    INFO: '✱',
    DEBUG: '⚈',
    ROUTE: '➟',
  },
  /**
   * Non-unicode log symbols
   */
  LOG_SYMBOLS_BASIC: {
    ERROR: 'x',
    WARNING: '!',
    SUCCESS: '+',
    INFO: 'i',
    DEBUG: '%',
    ROUTE: '~',
  },

  LOG_OCCURRENCE: {
    ON_FAIL: 'onFail',
    ALWAYS: 'always',
    NEVER: 'never',
  },

  COLORS: {
    WHITE: 'white',
    YELLOW: 'yellow',
    RED: 'red',
    BLUE: 'blue',
    GREEN: 'green',
    GREY: 'grey',
  },

  STATE: {
    FAILED: 'failed',
    PASSED: 'passed',
    RUNNING: 'running',
  },

  HOOK_TITLES: {
    BEFORE: '[[ before all {index} ]]',
    AFTER: '[[ after all {index} ]]',
  },

  PADDING: {
    LOG: Array(21).join(' '),
  },

  DEBUG_LOG_PREFIX: 'CTR-DEBUG: ',

  // HTTP methods defined by the `node:http` module
  // prettier-ignore
  HTTP_METHODS: [
    'ACL',         'BIND',       'CHECKOUT',
    'CONNECT',     'COPY',       'DELETE',
    'GET',         'HEAD',       'LINK',
    'LOCK',        'M-SEARCH',   'MERGE',
    'MKACTIVITY',  'MKCALENDAR', 'MKCOL',
    'MOVE',        'NOTIFY',     'OPTIONS',
    'PATCH',       'POST',       'PROPFIND',
    'PROPPATCH',   'PURGE',      'PUT',
    'REBIND',      'REPORT',     'SEARCH',
    'SOURCE',      'SUBSCRIBE',  'TRACE',
    'UNBIND',      'UNLINK',     'UNLOCK',
    'UNSUBSCRIBE'
  ],

  COMMAND_TIMINGS: {
    TIMESTAMP: 'timestamp',
    SECONDS: 'seconds',
  },
} as const;

export default CONSTANTS;
