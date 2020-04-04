const methods = require('methods');

const LOG_TYPE = require('./constants').LOG_TYPES;
const PADDING = require('./constants').PADDING;
const CONSTANTS = require('./constants');
const responseBodyParser = require('./requestReponseBodyParser.js');

function installLogsCollector(config = {}) {
  validateConfig(config);
  const collectTypes = config.collectTypes || Object.values(LOG_TYPE);

  let logs = [];
  const addLog = (entry) => {
    if (config.filterLog && !config.filterLog(entry)) {
      return;
    }

    logs.push(entry);
  };

  collectBrowserConsoleLogs(addLog, collectTypes);

  if (collectTypes.includes(LOG_TYPE.CYPRESS_LOG)) {
    collectCypressLogCommand(addLog);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_XHR)) {
    collectCypressXhrLog(addLog);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_REQUEST)) {
    collectCypressRequestCommand(addLog);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_ROUTE)) {
    collectCypressRouteCommand(addLog);
  }
  if (collectTypes.includes(LOG_TYPE.CYPRESS_COMMAND)) {
    collectCypressGeneralCommandLog(addLog);
  }

  Cypress.on('fail', error => {
    const [type, message] = logs[logs.length - 1];
    logs[logs.length - 1] = [type, message, CONSTANTS.SEVERITY.ERROR];
    throw error;
  });

  Cypress.mocha.getRunner().on('test', () => {
    logs = [];
  });

  afterEach(function() {
    if (this.currentTest.state !== 'passed' || (config && config.printLogs === 'always')) {
      cy.task(CONSTANTS.TASK_NAME, logs);
    }
  });
}

function validateConfig(config) {
  if (config.collectTypes) {
    if (!Array.isArray(config.collectTypes)) {
      throw new Error(`Collect types should be of type array. [cypress-terminal-report]`);
    }

    const types = Object.values(LOG_TYPE);
    const unknownTypes = config.collectTypes.filter((t) => !types.includes(t));

    if (unknownTypes.length !== 0) {
      throw new Error(`Invalid collect types: ${unknownTypes.join(', ')}. [cypress-terminal-report]`);
    }
  }

  if (config.filterLog && typeof config.filterLog !== 'function') {
    throw new Error(`Filter log expected to be a function. [cypress-terminal-report]`);
  }

  if (config.printLogs && !(['always', 'onFail'].includes(config.printLogs))) {
    throw new Error(`Print logs config can only be 'always' or 'onFail'. [cypress-terminal-report]`);
  }
}

function collectBrowserConsoleLogs(addLog, collectTypes) {
  const oldConsoleMethods = {};
  const processArg = (arg) => {
    if (typeof arg === 'string' || typeof arg === 'number') {
      return arg;
    }

    if (arg instanceof Error && typeof arg.stack === "string") {
      let stack = arg.stack;
      if (stack.indexOf(arg.message) !== -1) {
        stack = stack.slice(stack.indexOf(arg.message) + arg.message.length + 1);
      }
      return arg.toString() + '\n' + stack.split('\n')
        .map((part) => PADDING.LOG + part)
        .join('\n');
    }

    let json = '';
    try {
      json = JSON.stringify(arg, null, 2);
    } catch (e) {
      return '[unprocessable=' + arg + ']';
    }

    return '\n' + json.split('\n')
      .map((part) => PADDING.LOG + part)
      .join('\n');
  };

  Cypress.on('window:before:load', () => {
    const docIframe = window.parent.document.querySelector("[id*='Your App']");
    const appWindow = docIframe.contentWindow;

    const createWrapper = (method, logType) => {
      oldConsoleMethods[method] = appWindow.console[method];

      appWindow.console[method] = (...args) => {
        addLog([logType, args.map(processArg).join('\n')]);
        oldConsoleMethods[method](...args);
      };
    };

    if (collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_WARN)) {
      createWrapper('warn', LOG_TYPE.BROWSER_CONSOLE_WARN);
    }
    if (collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_ERROR)) {
      createWrapper('error', LOG_TYPE.BROWSER_CONSOLE_ERROR);
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
      addLog([LOG_TYPE.CYPRESS_XHR, log, options.state]);
    }
  });
}

function collectCypressRequestCommand(addLog) {
  const isValidHttpMethod = (str) =>
    typeof str === 'string' && methods.some(s => str.toLowerCase().includes(s));

  Cypress.Commands.overwrite('request', async (originalFn, ...args) => {
    let log;
    // args can have up to 3 arguments
    // https://docs.cypress.io/api/commands/request.html#Syntax
    if (args[0].method) {
      log = `${args[0].method} ${args[0].url ? `${args[0].url}` : args[0]}`;
    } else if (isValidHttpMethod(args[0])) {
      log = `${args[0]} ${args[1]}`;
    } else {
      log = `${args[0]}`;
    }

    const response = await originalFn(...args).catch(async e => {
      let body = {};
      if (
        // check the body is there
        e.onFail().toJSON().consoleProps.Yielded &&
        e.onFail().toJSON().consoleProps.Yielded.body
      ) {
        body = e.onFail().toJSON().consoleProps.Yielded.body;
      }

      log += `\n${PADDING.LOG}${e.message.match(/Status:.*\d*/g)}
      ${PADDING.LOG}Response: ${await responseBodyParser(body)}`;

      addLog([LOG_TYPE.CYPRESS_REQUEST, log]);
      throw e;
    });

    log += `\n${PADDING.LOG}Status: ${response.status} 
      ${PADDING.LOG}Response: ${await responseBodyParser(response.body)}`;

    addLog([LOG_TYPE.CYPRESS_REQUEST, log]);
    return response;
  });
}

function collectCypressRouteCommand(addLog) {
  Cypress.Commands.overwrite('server', (originalFn, options = {}) => {
    const prevCallback = options && options.onAnyResponse;
    options.onAnyResponse = async (route, xhr) => {
      if (prevCallback) {
        prevCallback(route, xhr);
      }

      if (!route) {
        return;
      }

      const severity = String(xhr.status).match(/^2[0-9]+$/) ? CONSTANTS.SEVERITY.WARNING : '';
      addLog([
        LOG_TYPE.CYPRESS_ROUTE,
        `Status: ${xhr.status} (${route.alias})\n${PADDING.LOG}Method: ${xhr.method}\n${
          PADDING.LOG
        }Url: ${xhr.url}\n${PADDING.LOG}Response: ${await responseBodyParser(xhr.response.body)}`,
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
      addLog([LOG_TYPE.CYPRESS_COMMAND, log, severity]);
    }
  });
}

module.exports = installLogsCollector;
