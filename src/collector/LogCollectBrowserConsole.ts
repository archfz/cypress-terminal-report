import CONSTANTS from '../constants';
import utils from '../utils';

export default class LogCollectBrowserConsole {
  collectorState: any;
  config: any;

  constructor(collectorState: any, config: any) {
    this.config = config;
    this.collectorState = collectorState;
  }

  register() {
    const oldConsoleMethods = {};
    const event = Cypress.testingType === 'component'
      ? 'test:before:run'
      : 'window:before:load';

    Cypress.on(event, () => {
      const docIframe = window.parent.document.querySelector("[id*='Your project: ']") ||
        window.parent.document.querySelector("[id*='Your App']");
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      const appWindow = docIframe.contentWindow;

      // In case of component tests the even will be called multiple times. Prevent registering multiple times.
      if (appWindow._ctr_registered) {
        return;
      }
      appWindow._ctr_registered = true;

      const processArg = (arg: any) => {
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

        return utils.jsonStringify(arg);
      };

      const createWrapper = (method: any, logType: any, type = CONSTANTS.SEVERITY.SUCCESS) => {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        oldConsoleMethods[method] = appWindow.console[method];

        appWindow.console[method] = (...args: any[]) => {
          this.collectorState.addLog([logType, args.map(processArg).join(`,\n`), type]);
          // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          oldConsoleMethods[method](...args);
        };
      };

      if (this.config.collectTypes.includes(CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_WARN)) {
        createWrapper('warn', CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_WARN, CONSTANTS.SEVERITY.WARNING);
      }
      if (this.config.collectTypes.includes(CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_ERROR)) {
        createWrapper('error', CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_ERROR, CONSTANTS.SEVERITY.ERROR);
      }
      if (this.config.collectTypes.includes(CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_INFO)) {
        createWrapper('info', CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_INFO);
      }
      if (this.config.collectTypes.includes(CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_DEBUG)) {
        createWrapper('debug', CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_DEBUG);
      }
      if (this.config.collectTypes.includes(CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_LOG)) {
        createWrapper('log', CONSTANTS.LOG_TYPES.BROWSER_CONSOLE_LOG);
      }
    });
  }
}
