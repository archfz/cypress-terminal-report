const tv4 = require('tv4');
const schema = require('./installLogsCollector.schema.json');
const CtrError = require('./CtrError');
const LOG_TYPE = require('./constants').LOG_TYPES;
const CONSTANTS = require('./constants');
const tv4ErrorTransformer = require('./tv4ErrorTransformer');

const LogCollectorState = require("./collector/LogCollectorState");
const LogCollectBrowserConsole = require("./collector/LogCollectBrowserConsole");
const LogCollectCypressCommand = require("./collector/LogCollectCypressCommand");
const LogCollectCypressRequest = require("./collector/LogCollectCypressRequest");
const LogCollectCypressRoute = require("./collector/LogCollectCypressRoute");
const LogCollectCypressXhr = require("./collector/LogCollectCypressXhr");
const LogCollectCypressLog = require("./collector/LogCollectCypressLog");


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

  let logCollectorState = new LogCollectorState(config);

  (new LogCollectBrowserConsole(logCollectorState, config)).register()

  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_LOG)) {
    (new LogCollectCypressLog(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_XHR)) {
    (new LogCollectCypressXhr(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_REQUEST)) {
    (new LogCollectCypressRequest(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_ROUTE)) {
    (new LogCollectCypressRoute(logCollectorState, config)).register();
  }
  if (config.collectTypes.includes(LOG_TYPE.CYPRESS_COMMAND)) {
    (new LogCollectCypressCommand(logCollectorState, config)).register();
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

module.exports = installLogsCollector;
