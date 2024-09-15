import CONSTANTS from '../constants';
import utils from '../utils';
import LogCollectBase from "./LogCollectBase";

export default class LogCollectCypressCommand extends LogCollectBase {
  ignoredCommands = ['xhr', 'log', 'request'];

  register() {
    const isOfInterest = (options: any) => options.instrument === 'command' &&
      options.consoleProps &&
      !this.ignoredCommands.includes(options.name) &&
      !(options.name === 'task' && options.message.match(/ctrLogMessages/));

    const formatLogMessage = (options: any) => {
      let message = options.name + '\t' + options.message;

      if (options.expected && options.actual) {
        message += '\nActual: \t' + utils.jsonStringify(options.actual, false);
        message += '\nExpected: \t' + utils.jsonStringify(options.expected, false);
      }

      return message;
    };

    Cypress.on('log:added', (options) => {
      if (isOfInterest(options)) {
        const log = formatLogMessage(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : CONSTANTS.SEVERITY.SUCCESS;
        this.collectorState.addLog([CONSTANTS.LOG_TYPES.CYPRESS_COMMAND, log, severity], options.id);
      }
    });

    Cypress.on('log:changed', (options) => {
      if (isOfInterest(options)) {
        const log = formatLogMessage(options);
        const severity = options.state === 'failed' ? CONSTANTS.SEVERITY.ERROR : CONSTANTS.SEVERITY.SUCCESS;
        this.collectorState.updateLog(log, severity, options.id);
      }
    });
  }
}
