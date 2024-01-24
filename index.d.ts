declare namespace Cypress {
  import {Log as CtrLog} from "./src/installLogsCollector";

  interface Cypress {
    TerminalReport: {
      getLogs<T extends 'txt' | 'json' | 'none' = 'none'>(format?: T): {
        txt: string,
        json: string,
        none: CtrLog[],
      }[T];
    }
  }
}
