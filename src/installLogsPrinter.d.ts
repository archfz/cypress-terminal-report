/// <reference types="cypress" />

type Severity = '' | 'error' | 'warning';

interface PluginOptions {
  /**
   * Max length of cy.log and console.warn/console.error.
   * @default 800
   */
  defaultTrimLength?: number;

  /**
   * Max length of cy commands.
   * @default 800
   */
  commandTrimLength?: number;

  /**
   * Max length of cy.route request data.
   * @default 5000
   */
  routeTrimLength?: number;

  /**
   * If it is set to a number greater or equal to 0, this amount of logs will be printed only around failing commands. Use this to have shorter output especially for when there are a lot of commands in tests. When used with options.printLogs=always for tests that don't have any severity=error logs nothing will be printed.
   * @default null
   */
  compactLogs?: number | null;

  /**
   * Required if outputTarget provided. [More details](https://github.com/archfz/cypress-terminal-report#logging-to-files).
   * @default null
   */
  outputRoot?: string | null;

  /**
   * Output logs to files. [More details](https://github.com/archfz/cypress-terminal-report#logging-to-files).
   * @default null
   */
  outputTarget?: Record<
    string,
    | 'json'
    | 'txt'
    | ((messages: Record<string, Record<string, [string, string, Severity]>>) => string)
  >;
}

declare function installLogsPrinter(on: Cypress.PluginEvents, options?: PluginOptions): void;
export = installLogsPrinter;
