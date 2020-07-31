# Cypress terminal report

[![Build Status](https://travis-ci.com/archfz/cypress-terminal-report.svg?branch=master)](https://travis-ci.com/archfz/cypress-terminal-report)
[![Downloads](https://badgen.net/npm/dw/cypress-terminal-report)](https://www.npmjs.com/package/cypress-terminal-report)
[![Version](https://badgen.net/npm/v/cypress-terminal-report)](https://www.npmjs.com/package/cypress-terminal-report)

Plugin for cypress that adds better terminal output for easier debugging. 
Prints cy commands, browser console logs, cy.request and cy.route data. By default
outputs to terminal only, but can be configured to write to files as well. 

Try it out by cloning [cypress-terminal-report-demo](https://github.com/archfz/cypress-terminal-report-demo).

> Note: If you want to display the logs when test succeed as well then check the
[options](#options) for the support install.

> Note: Currently logs do not appear in the dashboard. If you want to see them go
to your CI runner and check the pipeline logs there.

- [Install](#install)
- [Options](#options)
- [Logging to files](#logging-to-files)
- [Development](#development)
- [Release Notes](#release-notes)


![demo](https://raw.githubusercontent.com/archfz/cypress-terminal-report/master/demo.png)

## Install

1. Install npm package.
    ```bash
    npm i --save-dev cypress-terminal-report
    ```
2. Register the output plugin in `cypress/plugins/index.js`
    ```js
    module.exports = (on) => {
       require('cypress-terminal-report/src/installLogsPrinter')(on);
    };
    ```
3. Register the log collector support in `cypress/support/index.js`
    ```js
    require('cypress-terminal-report/src/installLogsCollector')();
    ```

## Options

### Options for the plugin install

> require('cypress-terminal-report/src/installLogsPrinter')(on, options)

#### `options.defaultTrimLength`
integer; default: 800; Max length of cy.log and console.warn/console.error.

#### `options.commandTrimLength` 
integer; default: 800; Max length of cy commands.

#### `options.routeTrimLength`
integer; default: 5000; Max length of cy.route request data.

#### `options.compactLogs` 
integer?; default: null; If it is set to a number greater or equal to 0, this amount of logs 
will be printed only around failing commands. Use this to have shorter output especially 
for when there are a lot of commands in tests. When used with `options.printLogs=always` 
for tests that don't have any `severity=error` logs nothing will be printed.

#### `options.outputRoot` 
string; default: null; Required if `options.outputTarget` provided. [More details](#logging-to-files).

#### `options.outputTarget`
object; default: null; Output logs to files. [More details](#logging-to-files).

### Options for the support install

> require('cypress-terminal-report/src/installLogsCollector')(options);

#### `options.printLogs`
string; default: 'onFail'; possible values: 'onFail', 'always' - When set to always
logs will be printed for successful test as well as failing ones.

#### `options.collectTypes` 
array; default: ['cons:log','cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:xhr', 'cy:request', 'cy:route', 'cy:command']
What types of logs to collect and print. By default all types are enabled. The 'cy:command' is the general type that
contain all types of commands that are not specially treated.

#### `options.filterLog` 
null | ([type, message, severity]) => boolean; default: undefined; 
Callback to filter logs manually.
The type is from the same list as for the `collectTypes` option. Severity can be of ['', 'error', 'warning'].

#### `options.xhr.printHeaderData` 
boolean; default false; Whether to print header data for XHR requests.

#### `options.xhr.printRequestData`
boolean; default false; Whether to print request data for XHR requests besides response data.

## Logging to files

To enable logging to file you must add the following configuration options to the
plugin install.

```js
module.exports = (on, config) => {
  // ...
  const options = {
    outputRoot: config.projectRoot + '/logs/',
    outputTarget: {
      'out.txt': 'txt',
      'out.json': 'json',
    }
  };

  require('cypress-terminal-report/src/installLogsPrinter')(on, options);
  // ...
};
```

The `outputTarget` needs to be an object where the key is the relative path of the
file from `outputRoot` and the value is the __type__ of format to output. 

Supported types: `txt`, `json`.

### Custom output log processor

If you need to output in a custom format you can pass a function instead of a string
to the `outputTarget` value. This function will be called with the list of messages
per spec per test. Currently it is called right after one spec finishes, which means
at one iteration will receive only for one spec the messages. See for example below.

NOTE: The chunks have to be written in a way that after every write the file is 
in a valid format. This has to be like this since we cannot detect when cypress
runs the last test. This way we also make the process faster because otherwise the
more tests would execute the more RAM and processor time it would take to rewrite 
all the logs to the file.

```js
  // ...
  const options = {
    outputTarget: {
      'custom.output': function (messages) {
        // Process the messages object into your required output string.
        // messages= {[specPath: string]: {[testTitle: string]: [type: string, message: string, severity: string][]}
        let dataString = '';
      
        // this.size // Current char size of the output file.
        // this.atChunk // The count of the chunk to be written.

        // Insert chunk into file, by default at the end.
        this.writeChunk(dataString);
        // Or if you want to write into a different position.
        let pos = 100; // If negative then this.size - pos will be the write position.
        this.writeChunk(dataString, pos);
      }
    }
  };
  // ...
```

See [JsonOutputProcessor](./src/outputProcessor/JsonOutputProcessor.js) implementation as a
good example demonstrating both conversion of data into string and chunk write position
alternation.

## Development

### Testing

Tests can be found under `/test`. The primary expectations are run with mocha and these tests in fact
start cypress run instances and assert on their output. So that means there is a cypress suite that
is used to emulate the usage of the plugin, and a mocha suite to assert on those emulations.

To add tests you need to first add a case to existing cypress spec or create a new one and then
add the case as well in the `/test/test.js`. To run the tests you can use `npm test` in the test \
directory. You should add `it.only` to the test case you are working on to speed up development.

## Release Notes

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
- Bumping default trim lengths for cy:command and cons:* log types.
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
