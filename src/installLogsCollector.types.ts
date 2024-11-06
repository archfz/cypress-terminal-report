import type {Log, LogType, TestData} from "./types";

export interface SupportOptions {
  /**
   * What types of logs to collect and print.
   * By default all types are enabled.
   * The 'cy:command' is the general type that contain all types of commands that are not specially treated.
   * @default ['cons:log', 'cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:xhr', 'cy:fetch', 'cy:request', 'cy:intercept', 'cy:command']
   */
  collectTypes?: LogType[];

  /**
   * Callback to filter logs manually. The type is from the same list as for the collectTypes option.
   * Severity can be of ['', 'error', 'warning'].
   * @default undefined
   */
  filterLog?: null | ((args: Log) => boolean);

  /**
   * Callback to process logs manually. The type is from the same list as for the collectTypes option.
   * Severity can be of ['', 'error', 'warning'].
   * @default undefined
   */
  processLog?: null | ((args: Log) => Log);

  /**
   * Callback to collect each test case's logs after its run.
   * @default undefined
   */
  collectTestLogs?: (
    context: TestData,
    messages: Log[]
  ) => void;

  xhr?: {
    /**
     * Whether to print body for XHR requests. Controls request body printing as well when request data logging is
     * enabled.
     * @default true
     */
    printBody?: boolean;

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
   * Adds time information to logs.
   * @default null
   */
  commandTimings?: null | 'timestamp' | 'seconds'

  /**
   * Enabled debug logging.
   * @default false
   */
  debug?: boolean;
}

export interface ExtendedSupportOptions extends SupportOptions {
  collectTypes: LogType[];
  collectBody?: boolean;
  collectRequestData?: boolean;
  collectHeaderData?: boolean;
}
