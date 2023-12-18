
import type { Log } from "./src/installLogsCollector";

declare namespace Cypress {
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
