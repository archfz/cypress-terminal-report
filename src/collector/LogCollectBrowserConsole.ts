import CONSTANTS from '../constants';
import utils from '../utils';
import type {LogType, Severity} from "../types";
import LogCollectBase from "./LogCollectBase";

type Methods = 'warn' | 'error' | 'debug' | 'info' | 'log';

export default class LogCollectBrowserConsole extends LogCollectBase {
  register() {
    const oldConsoleMethods: { [k in Methods]?: Console[k] } = {};
    const event = Cypress.testingType === 'component'
      ? 'test:before:run'
      : 'window:before:load';

    Cypress.on(event, () => {
      const docIframe = (window.parent.document.querySelector("[id*='Your project: ']") ||
        window.parent.document.querySelector("[id*='Your App']")) as HTMLIFrameElement;
      const appWindow = docIframe.contentWindow as Window & typeof globalThis & {_ctr_registered: boolean};

      // In case of component tests the even will be called multiple times. Prevent registering multiple times.
      if (!appWindow || appWindow._ctr_registered) {
        return;
      }
      appWindow._ctr_registered = true;

      const stringableTypes = ['string', 'number', 'undefined', 'function'];
      const processArg = (arg: any) => {
        if (stringableTypes.includes(typeof arg)) {
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

      const createWrapper = (
        method: Methods,
        logType: LogType,
        type: Severity = CONSTANTS.SEVERITY.SUCCESS
      ) => {
        oldConsoleMethods[method] = appWindow.console[method];

        appWindow.console[method] = (...args: any[]) => {
          this.collectorState.addLog([logType, args.map(processArg).join(`,\n`), type]);
          if (oldConsoleMethods[method]) {
            oldConsoleMethods[method](...args);
          }
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
