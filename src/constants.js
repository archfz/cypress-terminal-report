module.exports = {
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
    CYPRESS_REQUEST: 'cy:request',
    CYPRESS_ROUTE: 'cy:route',
    CYPRESS_COMMAND: 'cy:command',

    PLUGIN_LOG_TYPE: 'ctr:info',
  },

  SEVERITY: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
  },

  PADDING: {
    LOG: Array(21).join(' '),
  }
};
