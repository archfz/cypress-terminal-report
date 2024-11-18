/**
 * This file used for internally adding types to package interfaces that are not
 * documented by the package (not included in the package's types).
 */

declare namespace Cypress {
  interface Cypress {
    onSpecReady(...args: any[]): void;

    mocha: {
      getRunner(): Mocha.Runner;
      getRootSuite(): Mocha.Suite;
    };

    state(key: 'done', callback: (error: Error) => Promise<void>): void;
    state(key: 'error', error: Error): void;
  }

  interface Chainable<Subject = any> extends Pick<Promise<Subject>, 'catch'> {}
}

declare namespace Mocha {
  interface InvocationDetails {
    relativeFile?: string;
    fileUrl?: string;
  }

  interface Hook {
    hookName: string;
    _ctr_hook: boolean;
  }

  interface Runnable {
    hookName: string;
    invocationDetails: InvocationDetails;
    id: string;
    order: unknown;
    wallClockStartedAt: unknown;
    timings: unknown;
  }

  interface Suite {
    invocationDetails: InvocationDetails;
  }

  interface Test {
    failedFromHookId?: unknown;
  }
}
