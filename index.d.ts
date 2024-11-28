declare namespace Cypress {
  import type {Log} from './src/installLogsCollector';

  interface Cypress {
    TerminalReport: {
      getLogs(format: 'txt' | 'json'): string | null;
      getLogs(format?: 'none' = 'none'): Log[] | null;
    };
  }
}
