import LogFormat from "./collector/LogFormat";

const LogCollectorState = require("./collector/LogCollectorState");

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
 * @see ./installLogsCollector.d.ts
 */
function installLogsCollector(config = {}) {
  validateConfig(config);
  registerCypressBeforeMochaHooksSealEvent();

  config.collectTypes = config.collectTypes || Object.values(LOG_TYPE);
  config.collectRequestData = config.xhr && config.xhr.printRequestData;
  config.collectHeaderData = config.xhr && config.xhr.printHeaderData;

  let logCollectorState = new LogCollectorState(config)

  collectBrowserConsoleLogs(logCollectorState, config);

  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_LOG)) {
    collectCypressLogCommand(logCollectorState);
  }
  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_XHR)) {
    collectCypressXhrLog(logCollectorState);
  }
  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_REQUEST)) {
    collectCypressRequestCommand(logCollectorState, config);
  }
  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_ROUTE)) {
    collectCypressRouteCommand(logCollectorState, config);
  }
  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_COMMAND)) {
    collectCypressGeneralCommandLog(logCollectorState);
  }

  Cypress.on('log:changed', (options) => {
    if (options.state === 'failed') {
      logCollectorState.updateLogStatusForChainId(options.id);
    }
  });

  Cypress.mocha.getRunner().on('test', (test) => {
    logCollectorState.startTest(test);
  });

  Cypress.mocha.getRunner().on('suite', () => {
    logCollectorState.startSuite();
  });
  Cypress.mocha.getRunner().on('suite end', () => {
    logCollectorState.endSuite();
  });

  const sendLogsToPrinter = (logStackIndex, mochaRunnable, options = {}) => {
    let testState = options.state || mochaRunnable.state;
    let testTitle = options.title || mochaRunnable.title;
    let testLevel = 0;
    let wait = typeof options.wait === 'number' ? options.wait : 6;

    let parent = mochaRunnable.parent;
    while (parent && parent.title) {
      testTitle = `${parent.title} -> ${testTitle}`
      parent = parent.parent;
      ++testLevel;
    }

    const prepareLogs = () => {
      const logsCopy = logCollectorState.consumeLogStacks(logStackIndex);

      if (logsCopy === null) {
        throw new Error(`[cypress-terminal-report] Domain exception: log stack null.`);
      }

      if (config.collectTestLogs) {
        config.collectTestLogs({mochaRunnable, testState, testTitle, testLevel}, logsCopy);
      }

      return logsCopy;
    };

    if (options.noQueue) {
      debounceNextMochaSuite(Promise.resolve()
        // Need to wait for command log update debounce.
        .then(() => new Promise(resolve => setTimeout(resolve, wait)))
        .then(() => {
          Cypress.backend('task', {
            task: CONSTANTS.TASK_NAME,
            arg: {
              spec: mochaRunnable.invocationDetails.relativeFile,
              test: testTitle,
              messages: prepareLogs(),
              state: testState,
              level: testLevel,
              consoleTitle: options.consoleTitle,
              isHook: options.isHook,
            }
          })
            // For some reason cypress throws empty error although the task indeed works.
            .catch((error) => {/* noop */})
        }).catch(console.error)
      );
    } else {
      // Need to wait for command log update debounce.
      cy.wait(wait, {log: false})
        .then(() => {
          cy.task(
            CONSTANTS.TASK_NAME,
            {
              spec: mochaRunnable.invocationDetails.relativeFile,
              test: testTitle,
              messages: prepareLogs(),
              state: testState,
              level: testLevel,
              consoleTitle: options.consoleTitle,
              isHook: options.isHook,
            },
            {log: false}
          );
        });
    }
  };

  // Keeps track of before and after all hook indexes.
  Cypress.mocha.getRunner().on('hook', function (hook) {
    if (!hook._ctr_hook && !hook.fn._ctr_hook) {
      // After each hooks get merged with the test.
      if (hook.hookName !== "after each") {
        logCollectorState.addNewLogStack();
      }

      // Before each hooks also get merged with the test.
      if (hook.hookName === "before each") {
        logCollectorState.markCurrentStackFromBeforeEach();
      }

      if (hook.hookName === "before all") {
        logCollectorState.incrementBeforeHookIndex();
      } else if (hook.hookName === "after all") {
        logCollectorState.incrementAfterHookIndex();
      }
    }
  });

  // Logs commands from before all hook if the hook passed.
  Cypress.mocha.getRunner().on('hook end', function (hook) {
    if (hook.hookName === "before all" && logCollectorState.hasLogsCurrentStack() && !hook._ctr_hook) {
      sendLogsToPrinter(
        logCollectorState.getCurrentLogStackIndex(),
        this.currentRunnable,
        {
          state: 'passed',
          isHook: true,
          title: logCollectorState.getBeforeHookTestTile(),
          consoleTitle: logCollectorState.getBeforeHookTestTile(),
        }
      );
    }
  });

  // Logs commands from before all hooks that failed.
  Cypress.on('before:mocha:hooks:seal', function () {
    const ctrAfterAllPerSuite = function () {
      if (
        this.test.parent === this.currentTest.parent // Since we have after all in each suite we need this for nested suites case.
        && this.currentTest.failedFromHookId // This is how we know a hook failed the suite.
        && logCollectorState.hasLogsCurrentStack()
      ) {
        sendLogsToPrinter(
          logCollectorState.getCurrentLogStackIndex(),
          this.currentTest,
          {
            state: 'failed',
            title: logCollectorState.getBeforeHookTestTile(),
            isHook: true
          }
        );
      }
    };

    const recursiveSuites = (suites) => {
      if (suites) {
        suites.forEach((suite) => {
          suite.afterAll(ctrAfterAllPerSuite);
          // Make sure our hook is first so that other after all hook logs come after
          // the failed before all hooks logs.
          const hook = suite._afterAll.pop();
          suite._afterAll.unshift(hook);
          // Don't count this in the hook index and logs.
          hook._ctr_hook = true;

          recursiveSuites(suite.suites);
        });
      }
    };
    recursiveSuites(this.mocha.getRootSuite().suites)
  });

  const debounceNextMochaSuite = (promise) => {
    const runner = Cypress.mocha.getRunner();

    // Hack to make mocha wait for our logs to be written to console before
    // going to the next suite. This is because 'fail' and 'suite begin' both
    // fire synchronously and thus we wouldn't get a window to display the
    // logs between the failed hook title and next suite title.
    const originalRunSuite = runner.runSuite;
    runner.runSuite = function (...args) {
      promise
        .catch(() => {/* noop */})
        // We need to wait here as for some reason the next suite title will be displayed to soon.
        .then(() => new Promise(resolve => setTimeout(resolve, 6)))
        .then(() => {
          originalRunSuite.apply(runner, args);
          runner.runSuite = originalRunSuite;
        });
    }
  };

  // Logs commands from after all hooks that passed.
  Cypress.mocha.getRunner().on('hook end', function (hook) {
    if (hook.hookName === "after all" && logCollectorState.hasLogsCurrentStack() && !hook._ctr_hook) {
      sendLogsToPrinter(
        logCollectorState.getCurrentLogStackIndex(),
        hook,
        {
          state: 'passed',
          title: logCollectorState.getAfterHookTestTile(),
          consoleTitle: logCollectorState.getAfterHookTestTile(),
          isHook: true,
          noQueue: true,
        }
      );
    }
  });

  // Logs after all hook commands when a command fails in the hook.
  Cypress.prependListener('fail', function (error) {
    const currentRunnable = this.mocha.getRunner().currentRunnable;

    if (currentRunnable.hookName === 'after all' && logCollectorState.hasLogsCurrentStack()) {
      // We only have the full list of commands when the suite ends.
      this.mocha.getRunner().prependOnceListener('suite end', () => {
        sendLogsToPrinter(
          logCollectorState.getCurrentLogStackIndex(),
          currentRunnable,
          {
            state: 'failed',
            title: logCollectorState.getAfterHookTestTile(),
            isHook: true,
            noQueue: true,
            wait: 0,
          }
        );
      });

      // Have to wait for debounce on log updates to have correct state information.
      // Done state is used as callback and awaited in Cypress.fail.
      Cypress.state('done', async (error) => {
        await new Promise(resolve => setTimeout(resolve, 6));
        throw error;
      });
    }

    Cypress.state('error', error);
    throw error;
  });

  const isLastTest = (testOrSuite) => {
    if (testOrSuite.type === 'suite') {
      if (testOrSuite.root === true) {
        return true;
      }

      return testOrSuite.parent.suites.indexOf(testOrSuite) === testOrSuite.parent.suites.length - 1
        && isLastTest(testOrSuite.parent);
    }

    return testOrSuite.parent.tests.indexOf(testOrSuite) === testOrSuite.parent.tests.length - 1
      && isLastTest(testOrSuite.parent);
  };

  const printTestTitle = (test) => {
    if (Cypress.config('isTextTerminal')) {
      Cypress.emit('mocha', 'pass', {
        "id": test.id,
        "order": test.order,
        "title": test.title,
        "state": "passed",
        "type": "test",
        "duration": test.duration,
        "wallClockStartedAt": test.wallClockStartedAt,
        "timings": test.timings,
        "file": null,
        "invocationDetails": test.invocationDetails,
        "final": true,
        "currentRetry": test.currentRetry(),
        "retries": test.retries(),
      })
    }
  };

  const preventNextMochaPassEmit = () => {
    const oldAction = Cypress.action;
    Cypress.action = function (actionName, ...args) {
      if (actionName === 'runner:pass') {
        Cypress.action = oldAction;
        return;
      }

      return oldAction.call(Cypress, actionName, ...args);
    };
  };

  const sendLogsToPrinterForATest = (test) => {
    // We take over logging the passing test titles since we need to control when it gets printed so
    // that our logs come after it is printed.
    if (test.state === 'passed') {
      printTestTitle(test);
      preventNextMochaPassEmit();
    }

    sendLogsToPrinter(logCollectorState.getCurrentLogStackIndex(), test, {noQueue: true});
  };

  // Logs commands form each separate test when after each hooks are present.
  Cypress.mocha.getRunner().on('hook end', function (hook) {
    if (hook.hookName === 'after each') {
      if (hook.parent._afterEach.indexOf(hook) === hook.parent._afterEach.length - 1) {
        sendLogsToPrinterForATest(logCollectorState.getCurrentTest());
      }
    }
  });
  // Logs commands form each separate test when there is no after each hook.
  Cypress.mocha.getRunner().on('test end', function (test) {
    if (test.parent._afterEach.length === 0) {
      sendLogsToPrinterForATest(logCollectorState.getCurrentTest());
    }
  });

  // Logs to files.
  after(function () {
    cy.wait(6, {log: false});
    cy.task(CONSTANTS.TASK_NAME_OUTPUT, null, {log: false});
  });
}

function validateConfig(config) {
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

function registerCypressBeforeMochaHooksSealEvent() {
  // Hack to have dynamic after hook per suite.
  // The onSpecReady in cypress is called before the hooks are 'condensed', or so
  // to say sealed and thus in this phase we can register dynamically hooks.
  const oldOnSpecReady = Cypress.onSpecReady;
  Cypress.onSpecReady = function () {
    Cypress.emit('before:mocha:hooks:seal');
    oldOnSpecReady(...arguments);
  };
}

function collectBrowserConsoleLogs(logCollectorState, config) {
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
        logCollectorState.addLog([logType, args.map(processArg).join(`,\n`), type]);
        oldConsoleMethods[method](...args);
      };
    };

    if (config.collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_WARN)) {
      createWrapper('warn', LOG_TYPE.BROWSER_CONSOLE_WARN, CONSTANTS.SEVERITY.WARNING);
    }
    if (config.collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_ERROR)) {
      createWrapper('error', LOG_TYPE.BROWSER_CONSOLE_ERROR, CONSTANTS.SEVERITY.ERROR);
    }
    if (config.collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_INFO)) {
      createWrapper('info', LOG_TYPE.BROWSER_CONSOLE_INFO);
    }
    if (config.collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_DEBUG)) {
      createWrapper('debug', LOG_TYPE.BROWSER_CONSOLE_DEBUG);
    }
    if (config.collectTypes.includes(LOG_TYPE.BROWSER_CONSOLE_LOG)) {
      createWrapper('log', LOG_TYPE.BROWSER_CONSOLE_LOG);
    }
  });
}

function collectCypressLogCommand(logCollectorState) {
  Cypress.Commands.overwrite('log', (subject, ...args) => {
    logCollectorState.addLog([LOG_TYPE.CYPRESS_LOG, args.join(' ')]);
    subject(...args);
  });
}

function collectCypressXhrLog(logCollectorState) {
  const formatXhr = (options) => options.message +
    (options.consoleProps.Stubbed === 'Yes' ? 'STUBBED ' : '') +
    options.consoleProps.Method + ' ' + options.consoleProps.URL;

  const formatDuration = (durationInMs) =>
    durationInMs < 1000 ? `${durationInMs} ms` : `${durationInMs / 1000} s`;

  Cypress.on('log:added', (options) => {
    if (options.instrument === 'command' && options.consoleProps && options.name === 'xhr') {
      const log = formatXhr(options);
      const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.WARNING : '';
      logCollectorState.addLog([LOG_TYPE.CYPRESS_XHR, log, severity], options.id);
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
      if (!isSuccess && !logCollectorState.hasXhrResponseBeenLogged(options.consoleProps.XHR.id)) {
        log += `\nResponse body: ${await xhrPartParse(options.consoleProps.Response.body)}`;
      }
      logCollectorState.updateLog(log, severity, options.id);
    }
  });
}

function collectCypressRequestCommand(logCollectorState, config) {
  const logFormat = new LogFormat(config);
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
    if (typeof args === 'object' && args !== null && args[0]['log'] === false){
      return originalFn(...args);
    }

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
          logFormat.formatXhrLog({
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
          logFormat.formatXhrLog({
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

      logCollectorState.addLog([LOG_TYPE.CYPRESS_REQUEST, log, CONSTANTS.SEVERITY.ERROR]);
      throw e;
    });

    log +=
      `\n` +
      logFormat.formatXhrLog({
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

    logCollectorState.addLog([LOG_TYPE.CYPRESS_REQUEST, log]);
    return response;
  });
}

function collectCypressRouteCommand(logCollectorState, config) {
  const logFormat = new LogFormat(config);

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
      logMessage += logFormat.formatXhrLog({
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

      logCollectorState.addLog([LOG_TYPE.CYPRESS_ROUTE, logMessage, severity], null, xhr.id);
    };
    originalFn(options);
  });
}

function collectCypressGeneralCommandLog(logCollectorState) {
  Cypress.on('log:added', (options) => {
    if (
      options.instrument === 'command' &&
      options.consoleProps &&
      !['xhr', 'log', 'request'].includes(options.name) &&
      !(options.name === 'task' && options.message.match(/ctrLogMessages/))
    ) {
      const log = options.name + '\t' + options.message;
      const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : '';
      logCollectorState.addLog([LOG_TYPE.CYPRESS_COMMAND, log, severity], options.id);
    }
  });
}

module.exports = installLogsCollector;
