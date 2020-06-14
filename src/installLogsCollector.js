const methods = require('methods');

const CtrError = require('./CtrError');
const LOG_TYPE = require('./constants').LOG_TYPES;
const CONSTANTS = require('./constants');
const xhrPartParse = require('./xhrPartParse');

function installLogsCollector(config = {}) {
  validateConfig(config);
  const collectTypes = config.collectTypes || Object.values(LOG_TYPE);
  const collectRequestData = config.xhr && config.xhr.printRequestData;
  const collectHeaderData = config.xhr && config.xhr.printHeaderData;

  let logs = [];
  let logsChainId = {};
  const addLog = (entry, id) => {
    entry[2] = entry[2] || CONSTANTS.SEVERITY.SUCCESS;

    if (config.filterLog && !config.filterLog(entry)) {
      return;
    }

    if (id) {
      logsChainId[id] = logs.length;
    }

    logs.push(entry);
  };

  const formatXhrLog = (status, reqHeaders, reqBody, respHeaders, respBody) => {
    let logMessage = `Status: ${status}\n`;
    if (collectRequestData) {
      if (collectHeaderData) {
        logMessage += `Request headers: ${reqHeaders}\n`;
      }
      logMessage += `Request body: ${reqBody}\n`;
    }
    if (collectHeaderData) {
      logMessage += `Response headers: ${respHeaders}\n`;
    }
    logMessage += `Response body: ${respBody}`;
    return logMessage;
  };

  collectBrowserConsoleLogs(addLog, collectTypes);

  if (collectTypes.includes(LOG_TYPE.CYPRESS_LOG)) {
    collectCypressLogCommand(addLog);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_XHR)) {
    collectCypressXhrLog(addLog);
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

  Cypress.on('log:changed', options => {
    if ( options.state === 'failed' && logsChainId[options.id] && logs[logsChainId[options.id]]) {
      logs[logsChainId[options.id]][2] = CONSTANTS.SEVERITY.ERROR;
    }
  });

  Cypress.mocha.getRunner().on('test', () => {
    logsChainId = {};
    logs = [];
  });

  afterEach(function() {
    if (this.currentTest.state !== 'passed' || (config && config.printLogs === 'always')) {
      // Need to wait otherwise some last commands get omitted from logs.
      cy.wait(1, {log: false});
      cy.task(CONSTANTS.TASK_NAME, {
        spec: this.test.file,
        test: this.currentTest.title,
        messages: logs
      }, {log: false});
    }
  });

  after(function () {
    cy.task(CONSTANTS.TASK_NAME_OUTPUT, null, {log: false});
  });
}

function validateConfig(config) {
  if (config.collectTypes) {
    if (!Array.isArray(config.collectTypes)) {
      throw new CtrError(`Collect types should be of type array. [cypress-terminal-report]`);
    }

    const types = Object.values(LOG_TYPE);
    const unknownTypes = config.collectTypes.filter((t) => !types.includes(t));

    if (unknownTypes.length !== 0) {
      throw new CtrError(`Invalid collect types: ${unknownTypes.join(', ')}. [cypress-terminal-report]`);
    }
  }

  if (config.filterLog && typeof config.filterLog !== 'function') {
    throw new CtrError(`Filter log expected to be a function. [cypress-terminal-report]`);
  }

  if (config.printLogs && !(['always', 'onFail'].includes(config.printLogs))) {
    throw new CtrError(`Print logs config can only be 'always' or 'onFail'. [cypress-terminal-report]`);
  }
}

function collectBrowserConsoleLogs(addLog, collectTypes) {
  const oldConsoleMethods = {};
  const processArg = (arg) => {
    if (['string', 'number', 'undefined', 'function'].includes(typeof arg)) {
      return arg ? arg.toString() : arg === undefined ? 'undefined' : '';
    }

    if (arg instanceof Error && typeof arg.stack === "string") {
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

  Cypress.on('window:before:load', function () {
    const docIframe = window.parent.document.querySelector("[id*='Your App']");
    const appWindow = docIframe.contentWindow;

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

function collectCypressXhrLog(addLog) {
  Cypress.on('log:added', options => {
    if (options.instrument === 'command' && options.consoleProps && options.name === 'xhr') {
      let detailMessage = (options.consoleProps.Stubbed === 'Yes' ? 'STUBBED ' : '') +
        options.consoleProps.Method + ' ' + options.consoleProps.URL;

      const log = options.message + detailMessage;
      const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.WARNING : '';
      addLog([LOG_TYPE.CYPRESS_XHR, log, severity], options.id);
    }
  });
}

function collectCypressRequestCommand(addLog, formatXhrLog) {
  const isValidHttpMethod = (str) =>
    typeof str === 'string' && methods.some(s => str.toLowerCase().includes(s));

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

    const response = await originalFn(...args).catch(async e => {
      let xhr = e.onFail().toJSON().consoleProps.Yielded;
      let body = xhr ? xhr.body : {};
      let headers = xhr ? xhr.headers : {};
      let status = xhr ? xhr.status : {};

      log += `\n` + formatXhrLog(
        status,
        await xhrPartParse(requestHeaders),
        await xhrPartParse(requestBody),
        await xhrPartParse(headers),
        await xhrPartParse(body),
      );

      addLog([LOG_TYPE.CYPRESS_REQUEST, log, CONSTANTS.SEVERITY.ERROR]);
      throw e;
    });

    log += `\n` + formatXhrLog(
      response.status,
      await xhrPartParse(requestHeaders),
      await xhrPartParse(requestBody),
      await xhrPartParse(response.headers),
      await xhrPartParse(response.body),
    );

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
      logMessage += formatXhrLog(
        xhr.status,
        await xhrPartParse(xhr.request.headers),
        await xhrPartParse(xhr.request.body),
        await xhrPartParse(xhr.response.headers),
        await xhrPartParse(xhr.response.body),
      );

      addLog([
        LOG_TYPE.CYPRESS_ROUTE,
        logMessage,
        severity
      ]);
    };
    originalFn(options);
  });
}

function collectCypressGeneralCommandLog(addLog) {
  Cypress.on('log:added', options => {
    if (
      options.instrument === 'command' &&
      options.consoleProps &&
      !(['xhr', 'log', 'request'].includes(options.name)) &&
      !(options.name === 'task' && options.message.match(/ctrLogMessages/))
    ) {
      const log = options.name + '\t' + options.message;
      const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : '';
      addLog([LOG_TYPE.CYPRESS_COMMAND, log, severity], options.id);
    }
  });
}

module.exports = installLogsCollector;
