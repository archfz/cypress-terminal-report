import CONSTANTS from '../constants';
import LogCollectorState from "./LogCollectorState";
import type {ExtendedSupportOptions} from "../installLogsCollector.types";
import LogCollectBase from "./LogCollectBase";

export default class LogCollectCypressLog extends LogCollectBase {
  register() {
    Cypress.Commands.overwrite('log', (subject, ...args) => {
      this.collectorState.addLog([CONSTANTS.LOG_TYPES.CYPRESS_LOG, args.join(' '), CONSTANTS.SEVERITY.SUCCESS]);
      subject(...args);
    });
  }
}
