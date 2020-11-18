type Severity = '' | 'error' | 'warning';

interface SupportOptions {
  /**
   * What types of logs to collect and print.
   * By default all types are enabled.
   * The 'cy:command' is the general type that contain all types of commands that are not specially treated.
   * @default ['cons:log','cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:xhr', 'cy:request', 'cy:route', 'cy:command']
   */
  collectTypes?: readonly string[];

  /**
   * Callback to filter logs manually. The type is from the same list as for the collectTypes option.
   * Severity can be of ['', 'error', 'warning'].
   * @default undefined
   */
  filterLog?:
    | null
    | NonNullable<SupportOptions['collectTypes']>[number]
    | ((args: [/* type: */ Severity, /* message: */ string, /* severity: */ Severity]) => boolean);

  /**
   * Callback to collect each test case's logs after its run.
   * @default undefined
   */
  collectTestLogs?: (mochaInstance: any, messages: [/* type: */ Severity, /* message: */ string, /* severity: */ Severity][]) => void;

  xhr?: {
    /**
     * Whether to print header data for XHR requests.
     * @default false
     */
    printHeaderData?: boolean;

    /**
     * Whether to print request data for XHR requests besides response data.
     * @default false
     */
    printRequestData?: boolean;
  };
}

declare function installLogsCollector(config?: SupportOptions): void;
export = installLogsCollector;
