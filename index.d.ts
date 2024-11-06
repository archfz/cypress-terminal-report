/**
 * This file used for adding types to package interfaces that are not documented
 * by the package (not included in the package's types).
 */

declare namespace Cypress {
  import {Log} from "./src/installLogsCollector";
  import {BuiltinOutputProcessorsTypes} from "./src/types";

  interface Cypress {
    TerminalReport: {
      getLogs(format: BuiltinOutputProcessorsTypes): string | null;
      getLogs(format?: 'none' = 'none'): Log[] | null;
    }

    onSpecReady(...args: any[]): void;

    mocha: {
      getRunner(): Mocha.Runner
      getRootSuite(): Mocha.Suite
    }
  }

  interface Chainable {
    catch: Promise<any>['catch']
  }
}

declare namespace Mocha {
  interface InvocationDetails {
    relativeFile?: string
    fileUrl?: string
  }

  interface Hook {
    hookName: string
    _ctr_hook: boolean
  }

  interface Runnable {
    hookName: string
    invocationDetails: InvocationDetails
    id: string
    order: unknown
    wallClockStartedAt: unknown
    timings: unknown
  }

  interface Suite {
    invocationDetails: InvocationDetails
  }

  interface Test {
    failedFromHookId?: unknown
  }
}
