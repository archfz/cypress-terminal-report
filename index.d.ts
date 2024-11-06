declare namespace Cypress {
  import {Log as CtrLog} from "./src/installLogsCollector";

  interface Cypress {
    TerminalReport: {
      getLogs(format: 'txt'): string | null;
      getLogs(format: 'json'): string | null;
      getLogs(format?: 'none' = 'none'):  CtrLog[] | null;
    }

    onSpecReady(...args: any[]): void;
  }
}
