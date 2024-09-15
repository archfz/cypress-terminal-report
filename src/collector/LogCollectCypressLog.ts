import CONSTANTS from '../constants';
import LogCollectorState from "./LogCollectorState";
import type {ExtendedSupportOptions} from "../installLogsCollector.types";

export default class LogCollectCypressLog {
  constructor(protected collectorState: LogCollectorState, protected config: ExtendedSupportOptions) {}

  register() {
    Cypress.Commands.overwrite('log', (subject, ...args) => {
      this.collectorState.addLog([CONSTANTS.LOG_TYPES.CYPRESS_LOG, args.join(' '), CONSTANTS.SEVERITY.SUCCESS]);
      subject(...args);
    });
  }
}
