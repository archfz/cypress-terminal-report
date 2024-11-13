declare namespace Cypress {
  import type {Log} from "./src/installLogsCollector";
  import type {BuiltinOutputProcessorsTypes} from "./src/types";

  interface Cypress {
    TerminalReport: {
      getLogs(format: BuiltinOutputProcessorsTypes): string | null;
      getLogs(format?: 'none' = 'none'): Log[] | null;
    }
  }
}
