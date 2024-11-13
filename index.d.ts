declare namespace Cypress {
  import {Log} from "./src/installLogsCollector";
  import {BuiltinOutputProcessorsTypes} from "./src/types";

  interface Cypress {
    TerminalReport: {
      getLogs(format: BuiltinOutputProcessorsTypes): string | null;
      getLogs(format?: 'none' = 'none'): Log[] | null;
    }
  }
}
