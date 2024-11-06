import LogCollectorState from "./LogCollectorState";
import type {ExtendedSupportOptions} from "../installLogsCollector.types";
import LogFormat from "./LogFormat";

export default class LogCollectBase {
  format: LogFormat;
  constructor(protected collectorState: LogCollectorState, protected config: ExtendedSupportOptions) {
    this.format = new LogFormat(config);
  }
}
