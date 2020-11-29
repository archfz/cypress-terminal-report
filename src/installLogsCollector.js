const methods = require('methods');
const tv4 = require('tv4');

const schema = require('./installLogsCollector.schema.json');
const CtrError = require('./CtrError');
const LOG_TYPE = require('./constants').LOG_TYPES;
const CONSTANTS = require('./constants');
const xhrPartParse = require('./xhrPartParse');
const tv4ErrorTransformer = require('./tv4ErrorTransformer');

/**
 * Installs the logs collector for cypress.
 *
 * Needs to be added to support file.
 *
 * @param {object} config
 *    Options for collection logs:
 *      - collectTypes?: array; Collect only these types of logs. Defaults to all types.
 *      - filterLog?: ([type, message, severity]) => boolean; Callback to filter logs manually.
 *      - xhr?:
 *          - printHeaderData?: boolean; Defaults to false. Whether to write XHR header data.
 *          - printRequestData?: boolean; Defaults to false. Whether to write XHR request data.
 */
function installLogsCollector(config = {}) {
  validateConfig(config);

  const collectTypes = config.collectTypes || Object.values(LOG_TYPE);
  const collectRequestData = config.xhr && config.xhr.printRequestData;
  const collectHeaderData = config.xhr && config.xhr.printHeaderData;

  let logs = [];
  let logsChainId = {};
  let xhrIdsOfLoggedResponses = [];
  const addLog = (entry, id, xhrIdOfLoggedResponse) => {
    entry[2] = entry[2] || CONSTANTS.SEVERITY.SUCCESS;

    if (config.filterLog && !config.filterLog(entry)) {
      return;
    }

    if (id) {
      logsChainId[id] = logs.length;
    }
    if (xhrIdOfLoggedResponse) {
      xhrIdsOfLoggedResponses.push(xhrIdOfLoggedResponse);
    }

    logs.push(entry);
  };

  const updateLog = (log, severity, id) => {
    const existingLog = logsChainId[id] && logs[logsChainId[id]];
    if (existingLog) {
      existingLog[1] = log;
      existingLog[2] = severity;
    }
  };

  const hasXhrResponseBeenLogged = (xhrId) => xhrIdsOfLoggedResponses.includes(xhrId);

  const formatXhrLog = (xhrLog) => {
    let logMessage = '';
    if (xhrLog.response) {
      logMessage += `Status: ${xhrLog.response.status}\n`;
    } else if (xhrLog.networkError) {
      logMessage += `Network error: ${xhrLog.networkError}\n`;
    }
    if (xhrLog.request) {
      if (collectRequestData) {
        if (collectHeaderData) {
          logMessage += `Request headers: ${xhrLog.request.headers}\n`;
        }
        logMessage += `Request body: ${xhrLog.request.body}\n`;
      }
    }
    if (xhrLog.response) {
      if (collectHeaderData) {
        logMessage += `Response headers: ${xhrLog.response.headers}\n`;
      }
      logMessage += `Response body: ${xhrLog.response.body}`;
    }
    return logMessage.trimEnd();
  };

  collectBrowserConsoleLogs(addLog, collectTypes);

  if (collectTypes.includes(LOG_TYPE.CYPRESS_LOG)) {
    collectCypressLogCommand(addLog);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_XHR)) {
    collectCypressXhrLog(addLog, updateLog, hasXhrResponseBeenLogged);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_REQUEST)) {
    collectCypressRequestCommand(addLog, formatXhrLog);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_ROUTE)) {
    collectCypressRouteCommand(addLog, formatXhrLog);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_COMMAND)) {
    collectCypressGeneralCommandLog(addLog);
  }

  Cypress.on('log:changed', (options) => {
    if (options.state === 'failed' && logsChainId[options.id] && logs[logsChainId[options.id]]) {
      logs[logsChainId[options.id]][2] = CONSTANTS.SEVERITY.ERROR;
    }
  });

  Cypress.mocha.getRunner().on('test', () => {
    xhrIdsOfLoggedResponses = [];
    logsChainId = {};
    logs = [];
  });

  afterEach(function () {
    // Need to wait otherwise some last commands get omitted from logs.
    cy.wait(3, {log: false});
    
    if (config.collectTestLogs) {
      config.collectTestLogs(this, logs);
    }
    
    cy.task(
      CONSTANTS.TASK_NAME,
      {
        spec: this.test.file,
        test: this.currentTest.title,
        messages: logs,
        state: this.currentTest.state,
      },
      {log: false}
    );
  });

  after(function () {
    // Need to wait otherwise some last commands get omitted from logs.
    cy.task(CONSTANTS.TASK_NAME_OUTPUT, null, {log: false});
  });
}

function validateConfig(config) {
  before(function () {
    if (typeof config.printLogs === 'string') {
      cy.log(
        'cypress-terminal-report: WARN! printLogs ' +
          'configuration has been removed. Please check changelog in readme.'
      );
    }
  });

  const result = tv4.validateMultiple(config, schema);

  if (!result.valid) {
    throw new Error(
      `[cypress-terminal-report] Invalid plugin install options: ${tv4ErrorTransformer.toReadableString(
        result.errors
      )}`
    );
  }

  if (config.filterLog && typeof config.filterLog !== 'function') {
    throw new CtrError(`[cypress-terminal-report] Filter log option expected to be a function.`);
  }
  if (config.collectTestLogs && typeof config.collectTestLogs !== 'function') {
    throw new CtrError(`[cypress-terminal-report] Collect test logs option expected to be a function.`);
  }
}

function collectBrowserConsoleLogs(addLog, collectTypes) {
  const oldConsoleMethods = {};

  Cypress.on('window:before:load', function () {
    const docIframe = window.parent.document.querySelector("[id*='Your App']");
    const appWindow = docIframe.contentWindow;

    const processArg = (arg) => {
      if (['string', 'number', 'undefined', 'function'].includes(typeof arg)) {
        return arg ? arg.toString() : arg === undefined ? 'undefined' : '';
      }

      if (
        (arg instanceof appWindow.Error || arg instanceof Error) &&
        typeof arg.stack === 'string'
      ) {
        let stack = arg.stack;
        if (stack.indexOf(arg.message) !== -1) {
          stack = stack.slice(stack.indexOf(arg.message) + arg.message.length + 1);
        }
        return arg.toString() + '\n' + stack;
      }

      let json = '';
      try {
        json = JSON.stringify(arg, null, 2);
      } catch (e) {
        return '[unprocessable=' + arg + ']';
      }

      if (typeof json === 'undefined') {
        return 'undefined';
      }

      return json;
    };

    const createWrapper = (method, logType, type = CONSTANTS.SEVERITY.SUCCESS) => {
      oldConsoleMethods[method] = appWindow.console[method];

      appWindow.console[method] = (...args) => {
        addLog([logType, args.map(processArg).join(`,\n`), type]);
        oldConsoleMethods[method](...args);
      };
    };

    if (collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_WARN)) {
      createWrapper('warn', LOG_TYPE.BROWSER_CONSOLE_WARN, CONSTANTS.SEVERITY.WARNING);
    }
    if (collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_ERROR)) {
      createWrapper('error', LOG_TYPE.BROWSER_CONSOLE_ERROR, CONSTANTS.SEVERITY.ERROR);
    }
    if (collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_INFO)) {
      createWrapper('info', LOG_TYPE.BROWSER_CONSOLE_INFO);
    }
    if (collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_DEBUG)) {
      createWrapper('debug', LOG_TYPE.BROWSER_CONSOLE_DEBUG);
    }
    if (collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_LOG)) {
      createWrapper('log', LOG_TYPE.BROWSER_CONSOLE_LOG);
    }
  });
}

function collectCypressLogCommand(addLog) {
  Cypress.Commands.overwrite('log', (subject, ...args) => {
    addLog([LOG_TYPE.CYPRESS_LOG, args.join(' ')]);
    subject(...args);
  });
}

function collectCypressXhrLog(addLog, updateLog, hasXhrResponseBeenLogged) {
  const formatXhr = (options) => options.message +
    (options.consoleProps.Stubbed === 'Yes' ? 'STUBBED ' : '') +
    options.consoleProps.Method + ' ' + options.consoleProps.URL;

  const formatDuration = (durationInMs) =>
    durationInMs < 1000 ? `${durationInMs} ms` : `${durationInMs / 1000} s`;

  Cypress.on('log:added', (options) => {
    if (options.instrument === 'command' && options.consoleProps && options.name === 'xhr') {
      const log = formatXhr(options);
      const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.WARNING : '';
      addLog([LOG_TYPE.CYPRESS_XHR, log, severity], options.id);
    }
  });

  Cypress.on('log:changed', async (options) => {
    if (
      options.instrument === 'command' &&
      options.name === 'xhr' &&
      options.consoleProps &&
      options.consoleProps.Status
    ) {
      const [, statusCode, statusText] = /^(\d{3})\s\((.+)\)$/.exec(options.consoleProps.Status) || [];
      const isSuccess = statusCode && statusCode[0] === '2';
      const severity = isSuccess ? CONSTANTS.SEVERITY.SUCCESS : CONSTANTS.SEVERITY.WARNING;
      let log = formatXhr(options) +
        ` (${formatDuration(options.consoleProps.Duration)})` +
        `\nStatus: ${statusCode} - ${statusText}`;
      if (!isSuccess && !hasXhrResponseBeenLogged(options.consoleProps.XHR.id)) {
        log += `\nResponse body: ${await xhrPartParse(options.consoleProps.Response.body)}`;
      }
      updateLog(log, severity, options.id);
    }
  });
}

function collectCypressRequestCommand(addLog, formatXhrLog) {
  const isValidHttpMethod = (str) =>
    typeof str === 'string' && methods.some((s) => str.toLowerCase().includes(s));

  const isNetworkError = (e) =>
    e.message && e.message.startsWith('`cy.request()` failed trying to load:');

  const isStatusCodeFailure = (e) => e.message && e.message.startsWith('`cy.request()` failed on:');

  const parseRequestStatusCodeFailureMessage = (message) => {
    const responseStart = '\n\nThe response we got was:\n\n';
    const statusStart = 'Status: ';
    const headersStart = '\nHeaders: ';
    const bodyStart = '\nBody: ';
    if (
      message.indexOf(responseStart) === -1 ||
      message.indexOf(statusStart) === -1 ||
      message.indexOf(headersStart) === -1 ||
      message.indexOf(bodyStart) === -1
    ) {
      return {status: 'Cannot parse cy.request status code failure message!'};
    }
    const response = message.substr(message.indexOf(responseStart) + responseStart.length);
    const statusStr = response.substr(
      response.indexOf(statusStart) + statusStart.length,
      response.indexOf(headersStart) - (response.indexOf(statusStart) + statusStart.length)
    );
    const headersStr = response.substr(
      response.indexOf(headersStart) + headersStart.length,
      response.indexOf(bodyStart) - (response.indexOf(headersStart) + headersStart.length)
    );
    const bodyStr = response.substr(response.indexOf(bodyStart) + bodyStart.length);
    return {status: statusStr, headers: headersStr, body: bodyStr.trimEnd()};
  };

  const parseRequestNetworkError = (message) => {
    const errorPartStart = 'We received this error at the network level:\n\n  > ';
    const errorPrefix = 'Error: ';
    if (message.indexOf(errorPartStart) === -1) {
      return {status: 'Cannot parse cy.request network error message!'};
    }
    let fromError = message.substr(message.indexOf(errorPartStart) + errorPartStart.length);
    let errorPart = fromError.substr(0, fromError.indexOf('\n'));
    if (errorPart.startsWith(errorPrefix)) {
      return errorPart.substr(errorPrefix.length).trim();
    }
    return errorPart.trim();
  };

  Cypress.Commands.overwrite('request', async (originalFn, ...args) => {
    let log;
    let requestBody;
    let requestHeaders;

    // args can have up to 3 arguments
    // https://docs.cypress.io/api/commands/request.html#Syntax
    if (args[0].method) {
      log = `${args[0].method} ${args[0].url ? `${args[0].url}` : args[0]}`;
      requestBody = args[0].body;
      requestHeaders = args[0].headers;
    } else if (isValidHttpMethod(args[0])) {
      log = `${args[0]} ${args[1]}`;
      requestBody = args[3];
    } else {
      log = `${args[0]}`;
    }

    const response = await originalFn(...args).catch(async (e) => {
      if (isNetworkError(e)) {
        log +=
          `\n` +
          formatXhrLog({
            request: {
              headers: await xhrPartParse(requestHeaders),
              body: await xhrPartParse(requestBody),
            },
            networkError: parseRequestNetworkError(e.message),
          });
      } else if (isStatusCodeFailure(e)) {
        const xhr = parseRequestStatusCodeFailureMessage(e.message);
        log +=
          `\n` +
          formatXhrLog({
            request: {
              headers: await xhrPartParse(requestHeaders),
              body: await xhrPartParse(requestBody),
            },
            response: {
              status: xhr.status,
              headers: await xhrPartParse(xhr.headers),
              body: await xhrPartParse(xhr.body),
            },
          });
      } else {
        log += `\n` + 'Cannot parse cy.request error content!';
      }

      addLog([LOG_TYPE.CYPRESS_REQUEST, log, CONSTANTS.SEVERITY.ERROR]);
      throw e;
    });

    log +=
      `\n` +
      formatXhrLog({
        request: {
          headers: await xhrPartParse(requestHeaders),
          body: await xhrPartParse(requestBody),
        },
        response: {
          status: response.status,
          headers: await xhrPartParse(response.headers),
          body: await xhrPartParse(response.body),
        },
      });

    addLog([LOG_TYPE.CYPRESS_REQUEST, log]);
    return response;
  });
}

function collectCypressRouteCommand(addLog, formatXhrLog) {
  Cypress.Commands.overwrite('server', (originalFn, options = {}) => {
    const prevCallback = options && options.onAnyResponse;
    options.onAnyResponse = async (route, xhr) => {
      if (prevCallback) {
        prevCallback(route, xhr);
      }

      if (!route) {
        return;
      }

      const severity = String(xhr.status).match(/^2[0-9]+$/) ? '' : CONSTANTS.SEVERITY.WARNING;
      let logMessage = `(${route.alias}) ${xhr.method} ${xhr.url}\n`;
      logMessage += formatXhrLog({
        request: {
          headers: await xhrPartParse(xhr.request.headers),
          body: await xhrPartParse(xhr.request.body),
        },
        response: {
          status: xhr.status,
          headers: await xhrPartParse(xhr.response.headers),
          body: await xhrPartParse(xhr.response.body),
        },
      });

      addLog([LOG_TYPE.CYPRESS_ROUTE, logMessage, severity], null, xhr.id);
    };
    originalFn(options);
  });
}

function collectCypressGeneralCommandLog(addLog) {
  Cypress.on('log:added', (options) => {
    if (
      options.instrument === 'command' &&
      options.consoleProps &&
      !['xhr', 'log', 'request'].includes(options.name) &&
      !(options.name === 'task' && options.message.match(/ctrLogMessages/))
    ) {
      const log = options.name + '\t' + options.message;
      const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : '';
      addLog([LOG_TYPE.CYPRESS_COMMAND, log, severity], options.id);
    }
  });
}

module.exports = installLogsCollector;
