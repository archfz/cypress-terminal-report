declare namespace Cypress {
  // @ts-ignore
  import type {Log} from "./src/installLogsCollector";

  interface Cypress {
    TerminalReport: {
      getLogs<T extends 'txt' | 'json' | 'none' = 'none'>(format?: T): {
        txt: string,
        json: string,
        none: Log[],
      }[T];
    }
  }
}
