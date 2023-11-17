declare function installLogsCollector(config?: installLogsCollector.SupportOptions): void;
declare namespace installLogsCollector {
  enum Severity {
    NONE = '',
    ERROR = 'error',
    WARNING = 'warning'
  }

  enum LogType {
    CONSOLE_LOG = 'cons:log',
    CONSOLE_INFO = 'cons:info',
    CONSOLE_WARN = 'cons:warn',
    CONSOLE_ERROR = 'cons:error',
    CONSOLE_DEBUG = 'cons:debug',
    CY_LOG = 'cy:log',
    CY_XHR = 'cy:xhr',
    CY_FETCH = 'cy:fetch',
    CY_REQUEST = 'cy:request' ,
    CY_INTERCEPT = 'cy:intercept',
    CY_COMMAND = 'cy:command',
    CTR_INFO = 'ctr:info'
  }

  type Log = [type: LogType, message: string, severity: Severity];

  interface SupportOptions {
    /**
     * What types of logs to collect and print.
     * By default all types are enabled.
     * The 'cy:command' is the general type that contain all types of commands that are not specially treated.
     * @default ['cons:log', 'cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:xhr', 'cy:fetch', 'cy:request', 'cy:route', 'cy:command']
     */
    collectTypes?: readonly LogType[];

    /**
     * Callback to filter logs manually. The type is from the same list as for the collectTypes option.
     * Severity can be of ['', 'error', 'warning'].
     * @default undefined
     */
    filterLog?:
      | null
      | NonNullable<SupportOptions['collectTypes']>[number]
      | ((args: Log) => boolean);

    /**
     * Callback to process logs manually. The type is from the same list as for the collectTypes option.
     * Severity can be of ['', 'error', 'warning'].
     * @default undefined
     */
    processLog?:
        | null
        | NonNullable<SupportOptions['collectTypes']>[number]
        | ((args: Log) => Log);

    /**
     * Callback to collect each test case's logs after its run.
     * @default undefined
     */
    collectTestLogs?: (
      context: {mochaRunnable: any, testState: string, testTitle: string, testLevel: number},
      messages: Log[]
    ) => void;

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

    /**
     * Enables extended log collection: including after all and before all hooks.
     * @unstable
     * @default false
     */
    enableExtendedCollector?: boolean;

    /**
     * Enables continuous logging of logs to terminal one by one, as they get registerd or modified.
     * @unstable
     * @default false
     */
    enableContinuousLogging?: boolean;

    /**
     * Enabled debug logging.
     * @default false
     */
    debug?: boolean;
  }
}

export = installLogsCollector;
