module.exports = {
  TASK_NAME: 'ctrLogMessages',

  LOG_TYPES: {
    BROWSER_CONSOLE_LOG: 'cons:log',
    BROWSER_CONSOLE_INFO: 'cons:info',
    BROWSER_CONSOLE_WARN: 'cons:warn',
    BROWSER_CONSOLE_ERROR: 'cons:error',

    CYPRESS_LOG: 'cy:log',
    CYPRESS_XHR: 'cy:xhr',
    CYPRESS_REQUEST: 'cy:request',
    CYPRESS_ROUTE: 'cy:route',
    CYPRESS_COMMAND: 'cy:command',
  },

  SEVERITY: {
    ERROR: 'error',
    WARNING: 'warning',
  },

  PADDING: {
    LOG: '\t\t    ',
  }
};
