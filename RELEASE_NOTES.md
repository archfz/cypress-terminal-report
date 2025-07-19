## Release Notes

#### 7.2.1

- Fix one issue with changing origins loosing state data and breaking tests. [issue](https://github.com/archfz/cypress-terminal-report/issues/289)
- Security: updated `cross-spawn`.
- Upgrade cypress to 14.5.2 in tests to confirm support.

#### 7.2.0

- Fix global before hooks not logged when failing. [issue](https://github.com/archfz/cypress-terminal-report/issues/282)
- Custom css support for `html` file output. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/273) by [bvandercar-vt](https://github.com/bvandercar-vt)

#### 7.1.0

- Support for md formatting in terminal output from `cy:log`. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/263) by [bvandercar-vt](https://github.com/bvandercar-vt)
- Support for `html` file output. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/269) by [bvandercar-vt](https://github.com/bvandercar-vt)
- Fix nested suite tests not printing failed before all hooks. [issue](https://github.com/archfz/cypress-terminal-report/issues/268)
- Refactors and additional types thanks to [bvandercar-vt](https://github.com/bvandercar-vt).

#### 7.0.4

- Fix incorrect `.npmignore` rule that including some ts files. [issue](https://github.com/archfz/cypress-terminal-report/issues/259)

#### 7.0.3

- Remove incorrectly installed `save` dependency.

#### 7.0.1 - 7.0.2

- Fix `d.ts` files not published.
- Fix incorrectly published files.

#### 7.0.0

- Align `xhr` and `fetch` log processing.
- Migrate `src` to typescript and refactor code for performance improvements.
- Swap internal dependencies for faster and smaller packages.

#### 6.2.0

- Add `debug` option on plugin install side for logging.

#### 6.1.3

- Fix compatibility with node 12. [issue](https://github.com/archfz/cypress-terminal-report/issues/254) by [wemcdonald](https://github.com/wemcdonald) and [yaobao1993](https://github.com/yaobao1993)
- Upgrade cypress to 13.14.1 in tests.
- Add backwards compatibility testing.

#### 6.1.2

- Fix `printBody` option no applying to `cy:request`.

#### 6.1.1

- Fix missing schema for `printBody` option. [issue](https://github.com/archfz/cypress-terminal-report/issues/248)

#### 6.1.0

- Add [`printBody`](#optionsxhrprintbody-) option to control output of http request / response body. [issue](https://github.com/archfz/cypress-terminal-report/issues/246)
- Fix attempts not logged to files due to title collision, since cypress is not including in test title the attempt anymore. [issue](https://github.com/archfz/cypress-terminal-report/issues/242)

#### 6.0.2

- Fix `never` on `printLogsToConsole` works in all cases. [issue](https://github.com/archfz/cypress-terminal-report/issues/241)
- Fix `commandTimings` failing when before hooks are logged. [issue](https://github.com/archfz/cypress-terminal-report/issues/240)
- `commandTimings` now log the time elapsed since the suite / spec start instead of the time since the test start.
- Update cypress to 13.8.1 in tests to confirm support.

#### 6.0.1

- Fix `txt` output processor not logging command timings. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/236) by [AlexGuironnetRTE](https://github.com/AlexGuironnetRTE)
- Fix `LogType` missing `timeString` type. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/237) by [bvandercar-vt](https://github.com/bvandercar-vt)

#### 6.0.0

- Add new option [`commandTimings`](#optionscommandtimings) to display the time of the logs. [issue](https://github.com/archfz/cypress-terminal-report/issues/207)
- ! Breaking change: Refactored the log type: `[type, message, severity]` is now `{type, message, severity}`.
  - If you have used any of the following options, you will have to make changes in the integration:
    `collectTestLogs`, `filterLog`, `processLog`, custom file output processor.

#### 5.3.12

- Fix type issues for `cypress-mochawesome-reporter` integration. [issue](https://github.com/archfz/cypress-terminal-report/issues/233)

#### 5.3.11

- Fix component tests failing with browser console logs due to multiple overrides. [issue](https://github.com/archfz/cypress-terminal-report/issues/232)

#### 5.3.10

- Fix component tests failing to run non queue tasks.
  Issue was reproducing with extended collector or with continuous logging enabled. [issue](https://github.com/archfz/cypress-terminal-report/issues/225)
- Fix type of function return on `outputTarget`. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/223) by [bvandercar-vt](https://github.com/bvandercar-vt)
- General types improvements. by [bvandercar-vt](https://github.com/bvandercar-vt)
- Update cypress to 13.6.1 in tests to confirm support.

#### 5.3.9

- Remove incorrectly added `debugger` statement. [issue](https://github.com/archfz/cypress-terminal-report/issues/221)

#### 5.3.8

- Fix browser logs not logging with component tests. [issue](https://github.com/archfz/cypress-terminal-report/issues/220)
- Vulnerability updates in semver. [issue](https://github.com/archfz/cypress-terminal-report/issues/218)

#### 5.3.7

- Fix retries not logged when test is in root of spec file. [issue](https://github.com/archfz/cypress-terminal-report/issues/214)

#### 5.3.6

- Experimental change of JSON stringification of logs for memory leak fix. [issue](https://github.com/archfz/cypress-terminal-report/issues/203)

#### 5.3.5

- Experimental change of `safe-json-stringify` to `stringify-object` for possible memory leak. [issue](https://github.com/archfz/cypress-terminal-report/issues/203)

#### 5.3.4

- Fix compatibility with cypress >=13. [issue](https://github.com/archfz/cypress-terminal-report/issues/209) [merge-request](https://github.com/archfz/cypress-terminal-report/pull/210) by [matmannion](https://github.com/matmannion)
- Update cypress to 13.1.0 in tests to confirm support.

#### 5.3.3

- Add support for latest format of `Cypress.backend('run:privileged')` for out of queue task running:
  Fixes command logging in certain cases for cypress >= 12.17.0.
- Update cypress to 12.17.4 in tests to confirm support.

#### 5.3.2

- Fix incorrect esm import. [issue](https://github.com/archfz/cypress-terminal-report/issues/197)

#### 5.3.1

- Fix incorrect esm export. [issue](https://github.com/archfz/cypress-terminal-report/issues/197)

#### 5.3.0

- Fix circular reference causing error with expect logging. [issue](https://github.com/archfz/cypress-terminal-report/issues/191)
- Add additional protection against logs containing objects that are non JSON serializable and also don't have `.toString()`. [issue](https://github.com/archfz/cypress-terminal-report/issues/192)
- Add support for the new format of `Cypress.backend('run:privileged')` for out of queue task running.
- Update cypress to 12.16.0 in tests to confirm support.

#### 5.2.0

- Fix `extedend control` global after hooks not being logged to files. [issue](https://github.com/archfz/cypress-terminal-report/issues/185)
- Add extra logging for `assert` of the expected and the actual object. [issue](https://github.com/archfz/cypress-terminal-report/issues/184)

#### 5.1.1

- Fix `Cypress.TerminalReport.getLogs()` types.

#### 5.1.0

- Add global support side `Cypress.TerminalReport.getLogs()`.
- Add example on how to integrate with [`mochawesome`](#cypress-mochawesome-reporter). [issue](https://github.com/archfz/cypress-terminal-report/issues/180)
- Update cypress to 12.9.0 in tests to confirm support.

#### 5.0.2

- Fix existing log message not updating later. [issue](https://github.com/archfz/cypress-terminal-report/issues/173)

#### 5.0.1

- Fix `cons:debug` missing from allowed collect option. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/171) by [josh68](https://github.com/Josh68)

#### 5.0.0

- Updated support for cypress 12.x.x.
- ! Breaking change: `cy.route` removed from supported `options.collectTypes`, as cypress 12.x.x removed deprecated `cy.route`.
  - Duration display is not supported anymore for XHR logs.
  - Status message display is not supported anymore for XHR logs (status code is still displayed).
  - Response body is not logged in certain cases anymore for XHR logs due to cypress not providing the information.

#### 4.1.3

- Typescript typing fix to support both esm and commonjs require in `installLogsCollector`. by [drebrez](https://github.com/drebrez)

#### 4.1.2

- Fix incorrectly required option props.
- Fix missing option `logToFilesOnAfterRun` in types. [issue](https://github.com/archfz/cypress-terminal-report/issues/161)
- Fix compatibility with `cypress-grep`. see [issue](https://github.com/archfz/cypress-terminal-report/issues/160)

#### 4.1.1

- Fix issue with `http` module causing `vite` issues. [issue](https://github.com/archfz/cypress-terminal-report/issues/154) by [wopian](https://github.com/wopian)
- Dependency updates. by [wopian](https://github.com/wopian)

#### 4.1.0

- Add experimental [`enableContinuousLogging`](#optionsenablecontinuouslogging) option for timeout debugging purposes. [issue](https://github.com/archfz/cypress-terminal-report/issues/150)

#### 4.0.3

- Fix issue with errors throw outside of tests overlapping real error. [issue](https://github.com/archfz/cypress-terminal-report/issues/152)
- Add additional potential source for spec file path determination.
- Update cypress in tests to 10.3.0 to confirm support.

#### 4.0.2

- Typescript typing fix to support both esm and commonjs require. [issue](https://github.com/archfz/cypress-terminal-report/issues/151)

#### 4.0.1

- Typescript typing fix and readme update. [issue](https://github.com/archfz/cypress-terminal-report/issues/148)

#### 4.0.0

- Add support for cypress ^10. [Follow cypress upgrade](https://deploy-preview-4186--cypress-docs.netlify.app/guides/references/migration-guide#Migrating-to-Cypress-version-10-0).
- ! Breaking change: `specRoot` option cannot be calculated anymore using config, as
  `integrationFolder` option was removed in cypress. [This now has to be set manually](#log-specs-in-separate-files).

#### 3.5.2

- Fix issue where top-level `.spec` files that call test functions in other files results in multiple output files being created. by [bvandercar-vt](https://github.com/bvandercar-vt)
- Security dependency updates.

#### 3.5.1

- Fix custom output processor example in README. by [bvandercar-vt](https://github.com/bvandercar-vt)
- Add more exported types to facilitate creating custom output processors in TypeScript. by [bvandercar-vt](https://github.com/bvandercar-vt)
- Security dependency updates.

#### 3.5.0

- Add new feature [`outputCompactLogs`](#optionsoutputcompactlogs) to allow for optionally overriding compactLogs for the output file specifically. by [bvandercar-vt](https://github.com/bvandercar-vt) [issue](https://github.com/archfz/cypress-terminal-report/issues/138)
- Fix typing for `processLog`. [issue](https://github.com/archfz/cypress-terminal-report/issues/132)
- Security dependency updates.
- Update cypress to 9.5.x in tests to confirm support.

#### 3.4.2

- Fix incorrectly typed message type arguments. [issue](https://github.com/archfz/cypress-terminal-report/issues/132)
- Security updates.
- Update cypress to 9.4.1 in tests to confirm support.

#### 3.4.1

- Add severity typescript types. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/128) by [tebeco](https://github.com/tebeco)
- Fix nested file logging by fallback for determining spec path. [issue](https://github.com/archfz/cypress-terminal-report/issues/124)
- Update cypress to 9.1.0 in tests to confirm support.

#### 3.4.0

- Implement `cy:fetch` logging. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/126) by [Erik-Outreach](https://github.com/Erik-Outreach)
- Update cypress to 8.7.0 in tests to confirm support.

#### 3.3.4

- Fix issue in `extedend control` where skip tests would double consume logs, and cause domain exception. [issue](https://github.com/archfz/cypress-terminal-report/issues/122)
- Update cypress to 8.6.0 in tests to confirm support.

#### 3.3.3

- Fix issue with `cy.intercept` overrides not working. [issue](https://github.com/archfz/cypress-terminal-report/issues/120)
- Update cypress to 8.5.0 in tests to confirm support.

#### 3.3.2

- Fix issue with no response on XHR breaking tests. [issue](https://github.com/archfz/cypress-terminal-report/issues/119)

#### 3.3.1

- Fix issue `cy:intercept` not between the allowed configuration options. [issue](https://github.com/archfz/cypress-terminal-report/issues/113)
- Fix issue with plugin breaking cypress with skipped tests. [issue1](https://github.com/archfz/cypress-terminal-report/issues/116) [issue2](https://github.com/archfz/cypress-terminal-report/issues/114)
- Update cypress to 8.3.0 in tests to confirm support.

#### 3.3.0

- Added support for logging command from skipped tests. [issue](https://github.com/archfz/cypress-terminal-report/issues/111)
- Update cypress to 8.1.0 in tests to confirm support.

#### 3.2.2

- Added protection against incorrect tabbing level determined from test parents breaking logging to terminal. [issue](https://github.com/archfz/cypress-terminal-report/issues/107)
- Remove peer dependency mocha.
- Update cypress to 7.4.0 in tests to confirm support.

#### 3.2.1

- Additional fix over extended control with nested mocha contexts and after each hooks failing. [issue](https://github.com/archfz/cypress-terminal-report/issues/98)

#### 3.2.0

- Introduce support for [cypress-fail-fast](https://github.com/javierbrea/cypress-fail-fast) with the [logToFilesOnAfterRun](#optionslogtofilesonafterrun) option. [issue](https://github.com/archfz/cypress-terminal-report/issues/91)

#### 3.1.2

- Fix issue with duplicated log send on extended control when parent suite has after each but current suite doesn't. [issue](https://github.com/archfz/cypress-terminal-report/issues/98)
- Fix issue with empty array of logs causing extra unnecessary new lines in console output. [issue](https://github.com/archfz/cypress-terminal-report/issues/99)
- Confirm support with cypress 7.3.0.

#### 3.1.1

- Fix compatibility with cypress < 6.0.0. [issue](https://github.com/archfz/cypress-terminal-report/issues/95)
- Confirm support with cypress 7.2.0.

#### 3.1.0

- Add support for `cy.intercept()` capturing and logging. [issue](https://github.com/archfz/cypress-terminal-report/issues/87)
- Improve `cy.request()` timeout and xhr abort error logging. [issue](https://github.com/archfz/cypress-terminal-report/issues/89)
- Update cypress in tests to 7.1.0 to confirm support.

#### 3.0.4

- Fix skipped root suites breaking extended collector. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/90) by [jmoses](https://github.com/jmoses)

#### 3.0.3

- Fix incomplete previous release.

#### 3.0.2

- Fixed issue with errors not displaying correctly for commands outside of tests. [issue](https://github.com/archfz/cypress-terminal-report/issues/85)
- Update readme with additional notes on limitations.

#### 3.0.1

- Fix issue with cucumber tests not logging properly to nested files. [issue](https://github.com/archfz/cypress-terminal-report/issues/82)
- Fix issue with `filterLog` and `processLog` options running too soon on non-final log list. [issue](https://github.com/archfz/cypress-terminal-report/issues/84)

#### 3.0.0

- ! Breaking change in [`options.collectTestLogs`](#optionscollecttestlogs-2). First parameter (previously called context) changed.
- ! Possibly breaking change: Test names in output files now contain mocha contexts.
- ! Minimum required cypress version increased to 4.10.0.
- ! Removed deprecated `printLogs` option on support install.
- Added support for [logging commands from before all and after all hooks](#logging-after-all-and-before-all-hooks). [issue](https://github.com/archfz/cypress-terminal-report/issues/55)
- Added support for multiple and nested mocha context. In console logs are tabbed according to nesting
  level of context and in output files context titles are always added. [issue](https://github.com/archfz/cypress-terminal-report/issues/70)
- Added support for [option to process logs](#optionsprocesslog). [issue](https://github.com/archfz/cypress-terminal-report/issues/74) [merge-request](https://github.com/archfz/cypress-terminal-report/pull/81) by [FLevent29](https://github.com/FLevent29)
- Added support to [disable verbose logging](#optionsoutputverbose). [issue](https://github.com/archfz/cypress-terminal-report/issues/71) [merge-request](https://github.com/archfz/cypress-terminal-report/pull/80) by [FLevent29](https://github.com/FLevent29)
- Updated unicode icons for log types on linux.
- Updated cypress to 6.6.x in tests to confirm support.

#### 2.4.0

- Improved logging of xhr with status code, response data in case of failure and duration. [issue](https://github.com/archfz/cypress-terminal-report/issues/61) [merge-request](https://github.com/archfz/cypress-terminal-report/pull/66) by [peruukki](https://github.com/peruukki)
- Added `console.debug` logging support. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/48) by [reynoldsdj](https://github.com/reynoldsdj)
- Improve config schema for trimming options to allow `number`.

#### 2.3.1

- Fixed issue in nested file output for spec file names containing multiple dots. [merge-request](https://github.com/rinero-bigpanda) by [rinero-bigpanda](https://github.com/rinero-bigpanda)
- Fixed issue in nested file output not cleaning up existing files. [issue](https://github.com/archfz/cypress-terminal-report/issues/57)
- Update to cypress 6.0.0 in tests and fix expectations.

#### 2.3.0

- Added support for custom log collector function on both [nodejs](#optionscollecttestlogs-1) and [browser](#optionscollecttestlogs-2) sides. [issue](https://github.com/archfz/cypress-terminal-report/issues/56) [merge-request](https://github.com/archfz/cypress-terminal-report/pull/59) by [peruukki](https://github.com/peruukki)
- Improved cy.request logging when log set to false and when there are network errors. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/60) by [bjowes](https://github.com/bjowes)

#### 2.2.0

- Added support for [logging each spec to its own file](#log-specs-in-separate-files). [issue](https://github.com/archfz/cypress-terminal-report/issues/49)

#### 2.1.0

- ! Separated option `printLogs` to [`printLogsToConsole`](#optionsprintlogstoconsole) and [`printLogsToFile`](#optionsprintlogstofile).
  `printLogs` won't work anymore and will print a warning in the cypress logs. Read documentation on how to
  upgrade. [issue](https://github.com/archfz/cypress-terminal-report/issues/47) [merge-request](https://github.com/archfz/cypress-terminal-report/pull/51) by [FLevent29](https://github.com/FLevent29)
- Typescript typings support added. [issue](https://github.com/archfz/cypress-terminal-report/issues/37) [merge-request](https://github.com/archfz/cypress-terminal-report/pull/52) by [bengry](https://github.com/bengry)

#### 2.0.0

- Removed deprecated exports from index.js. If you were still using require from index.js please
  see [installation](#install) for updating.
- Added JSON schema validation for options to prevent invalid options and assumptions. [issue](https://github.com/archfz/cypress-terminal-report/issues/45)
- Fixed issue where output to file would insert at incorrect position for JSON when ran from GUI.
- Reworked the file output processing code and thus the API changed as well. Custom output processors
  will have to be updated to current API when upgrading to this version. Check [readme section](#custom-output-log-processor).
- Added printing to terminal of time spent in milliseconds for output files to be written.
- Improved Error instanceof checking for console log arguments printing. [issue](https://github.com/archfz/cypress-terminal-report/issues/41)
- Update cypress to 5.0.0 in tests to confirm compatibility.

#### 1.4.2

- Fixed issue with compact logs breaking after each hook with message `undefined is not iterable`. [issue](https://github.com/archfz/cypress-terminal-report/issues/39)
- Update cypress to 4.11.0 in tests to confirm compatibility.

#### 1.4.1

- Added log to terminal of the list of generated output files. [merge-request](https://github.com/archfz/cypress-terminal-report/issues/29) by [@bjowes](https://github.com/bjowes)
- Fixed line endings for output on windows. [merge-request](https://github.com/archfz/cypress-terminal-report/issues/29) by [@bjowes](https://github.com/bjowes)
- Fixed incorrect readme with inverse installation requires for plugin and support. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/36) by [@zentby](https://github.com/zentby)

#### 1.4.0

- Added new feature to compact output of logs, [see here](#optionscompactlogs). [issue](https://github.com/archfz/cypress-terminal-report/issues/27)
- Fixed incorrect severity on cons:error and cons:warn.
- Fixed compatibility with cypress 4.8. [issue-1](https://github.com/archfz/cypress-terminal-report/issues/35)
  [issue-2](https://github.com/archfz/cypress-terminal-report/issues/34)
  [issue-3](https://github.com/archfz/cypress-terminal-report/issues/33)
- Fixed issue with webpack compatibility caused by native includes getting in compilation files. For this please revise
  the installation documentation and change the requires for the install of this plugin. Deprecated require by index. [issue](https://github.com/archfz/cypress-terminal-report/issues/32)
- Fixed issue with logsChainId not being reset and causing test failures and potentially live failures with error
  'Cannot set property '2' of undefined'. [issue](https://github.com/archfz/cypress-terminal-report/issues/31)

#### 1.3.1

- Added creation of output path for outputTarget files if directory does not exist.
- Fixed issue with ctrAfter task not being registered when outputTarget not configured. [issue](https://github.com/archfz/cypress-terminal-report/issues/26)

#### 1.3.0

- Added support for [logging to file](#writing-logs-to-files), with builtin support for json and text and possible custom processor. [issue](https://github.com/archfz/cypress-terminal-report/issues/17)
- Added support for logging XHR request body and also headers for requests and responses. [issue](https://github.com/archfz/cypress-terminal-report/issues/25)
- Reformatted the log message for route and request commands.
- Replace all tab characters with spaces on console log.

#### 1.2.1

- Fixed issue with incorrect command being marked as failing when there are additional logs after the actual failing one. [issue](https://github.com/archfz/cypress-terminal-report/issues/24)
- Fixed issue where console would receive undefined and the plugin would break: split on undefined. [issue](https://github.com/archfz/cypress-terminal-report/issues/23)
- Bumping default trim lengths for cy:command and cons:\* log types.
- Improvements on logging objects from console.
- Fix incorrect severity calculation for cy:route.
- Fix yellow output on powershell.
- Fix windows console icons with different set. [issue](https://github.com/archfz/cypress-terminal-report/issues/7)
- Update cypress version for testing to 4.3.0.
- Set peer version of cypress to >=3.8.1. [issue](https://github.com/archfz/cypress-terminal-report/issues/22)

#### 1.2.0

- Fixed issue with cy.request accepting parameters in multiple formats and the plugin not recognizing this. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/19) by [@andrew-blomquist-6](https://github.com/andrew-blomquist-6)
- Improved browser console logs for Error and other objects. [issue-1](https://github.com/archfz/cypress-terminal-report/issues/18) [issue-2](https://github.com/archfz/cypress-terminal-report/issues/16)
- Added support for filtering logs. See `collectTypes` and `filterLog` options for the support install. from [issue](https://github.com/archfz/cypress-terminal-report/issues/15).
- Removed option `printConsoleInfo` in favor of above. Also now the console.log and info are by
  default enabled.

#### 1.1.0

- Added notice for logs not appearing in dashboard. from [issue](https://github.com/archfz/cypress-terminal-report/issues/8)
- Added [support for logging](#options) console.info and console.log. in [issue](https://github.com/archfz/cypress-terminal-report/issues/12)
- Added better logging of cy.requests. in [issue](https://github.com/archfz/cypress-terminal-report/issues/12) by [@zhex900](https://github.com/zhex900)

#### 1.0.0

- Added tests and CI to repository.
- Added support for showing logs even for successful tests. in [issue](https://github.com/archfz/cypress-terminal-report/issues/3) by [@zhex900](https://github.com/zhex900)
- Fixed issue with incorrectly labeled failed commands. in [issue](https://github.com/archfz/cypress-terminal-report/issues/3) by [@zhex900](https://github.com/zhex900)
- Fixed issue with logs from cy.route breaking tests on XHR API type of requests. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/1) by [@zhex900](https://github.com/zhex900)
