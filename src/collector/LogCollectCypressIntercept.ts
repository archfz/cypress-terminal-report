import CONSTANTS from '../constants';
import LogFormat from './LogFormat';
import LogCollectorState from './LogCollectorState';
import type {ExtendedSupportOptions} from '../installLogsCollector.types';
import LogCollectBase from './LogCollectBase';

Object.defineProperty(RegExp.prototype, 'toJSON', {
  value: RegExp.prototype.toString,
});

export default class LogCollectCypressIntercept extends LogCollectBase {
  register() {
    Cypress.Commands.overwrite('intercept', (originalFn, ...args) => {
      let message = '';

      if (typeof args[0] === 'string' && CONSTANTS.HTTP_METHODS.includes(args[0].toUpperCase())) {
        message += `Method: ${args[0]}\nMatcher: ${JSON.stringify(args[1])}`;
        if (args[2]) {
          message += `\nMocked Response: ${typeof args[2] === 'object' ? JSON.stringify(args[2]) : args[2]}`;
        }
      } else {
        message += `Matcher: ${JSON.stringify(args[0])}`;
        if (args[1]) {
          message += `\nMocked Response: ${typeof args[1] === 'object' ? JSON.stringify(args[1]) : args[1]}`;
        }
      }

      this.collectorState.addLog([
        CONSTANTS.LOG_TYPES.CYPRESS_INTERCEPT,
        message,
        CONSTANTS.SEVERITY.SUCCESS,
      ]);
      return originalFn(...args);
    });
  }
}
