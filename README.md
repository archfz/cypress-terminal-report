# Cypress terminal report [![Build Status](https://circleci.com/gh/archfz/cypress-terminal-report/tree/master.svg?style=svg)](https://app.circleci.com/pipelines/github/archfz/cypress-terminal-report) [![Downloads](https://badgen.net/npm/dw/cypress-terminal-report)](https://www.npmjs.com/package/cypress-terminal-report) [![Version](https://badgen.net/npm/v/cypress-terminal-report)](https://www.npmjs.com/package/cypress-terminal-report)

> This documentation is for cypress >= 12.0.0. For older versions see [4.x.x](https://github.com/archfz/cypress-terminal-report/tree/4.x.x) or [3.x.x branch](https://github.com/archfz/cypress-terminal-report/tree/3.x.x).

<div align="center">

[Limitations](#limitations-and-notes)
• [Install](#install)
• [Options](#options)
• [Integrations](#integrations)
• [After/before all](#logging-after-all-and-before-all-hooks)
• [Logging to files](#logging-to-files)
• [Development](#development)
• [Release Notes](./RELEASE_NOTES.md)

</div>

Plugin for cypress that adds better terminal output for easier debugging.
Prints cy commands, browser console logs, cy.request and cy.intercept data. Great for your pipelines.

- looks pretty in console
- logs all commands, requests and browser console logs
- supports logging to files
- option between logging only on failure (default) or always
- options for trimming and compacting logs
- support for multiple and nested mocha contexts
- log commands from before all and after all hooks ([with a catch\*](#logging-after-all-and-before-all-hooks))

Try it out by cloning [cypress-terminal-report-demo](https://github.com/archfz/cypress-terminal-report-demo).

![demo](https://raw.githubusercontent.com/archfz/cypress-terminal-report/master/demo.png?sanitize=true#gh-light-mode-only)
![demo](https://raw.githubusercontent.com/archfz/cypress-terminal-report/master/demo_dark.png?sanitize=true#gh-dark-mode-only)

## Limitations and notes

- By default logs are not printed for successful tests. Please see [option](#optionsprintlogstoconsole) to change this.
- `console.log` usage was never meant to be used in the cypress test code. Using it will
  not log anything with this plugin. Using it also goes against the queue nature of
  cypress. Use `cy.log` instead. [See here for more details](https://github.com/archfz/cypress-terminal-report/issues/67).

## Install

### Requirements

- `>=4.0.0` requires cypress `>=10.0.0` and node `>=12`
- `>=3.0.0` requires cypress `>=4.10.0`
- `<3.0.0` requires cypress `>=3.8.0`

1. Install npm package.
   ```bash
   npm i --save-dev cypress-terminal-report
   ```
2. If using typescript and es6 imports ensure `esModuleInterop` is enabled.
3. Register the output plugin in `cypress.config.{js|ts}`
   ```js
   module.exports = defineConfig({
     e2e: {
       setupNodeEvents(on, config) {
         require('cypress-terminal-report/src/installLogsPrinter')(on)
       }
     }
   })
   ```
4. Register the log collector support in `cypress/support/e2e.{js|ts}`
   ```js
   require('cypress-terminal-report/src/installLogsCollector')()
   ```

## Options

<br/>

### _Options for the plugin install_

> require('cypress-terminal-report/src/installLogsPrinter')(on, options)

#### `options.defaultTrimLength`

integer; default: 800; Max length of cy.log and console.warn/console.error.

#### `options.commandTrimLength`

integer; default: 800; Max length of cy commands.

#### `options.routeTrimLength`

integer; default: 5000; Max length cy.request and XHR data.

#### `options.compactLogs`

integer?; default: null; If it is set to a number greater or equal to 0, this amount of logs
will be printed only around failing commands. Use this to have shorter output especially
for when there are a lot of commands in tests. When used with `options.printLogsToConsole=always`
for tests that don't have any `severity=error` logs nothing will be printed.

#### `options.outputCompactLogs`

integer? | false; default: null; Overrides `options.compactLogs` for the file log output specifically,
when `options.outputTarget` is specified. Allows compacting of the terminal and the file output logs to different levels.  
If `options.outputCompactLogs` is unspecified, file output will use `options.compactLogs`.
If set to `false`, output file logs will not compact even if `options.compactLogs` is set.

#### `options.outputRoot`

string; default: null; Required if `options.outputTarget` provided. [More details](#logging-to-files).

#### `options.specRoot`

string; default: null; Cypress specs root relative to package json. [More details](#log-specs-in-separate-files).

#### `options.outputTarget`

object; default: null; Output logs to files. [More details](#logging-to-files).

#### `options.printLogsToConsole`

string; Default: 'onFail'. When to print logs to console, possible values: 'always', 'onFail', 'never' - When set to always
logs will be printed to console for successful tests as well as failing ones.

#### `options.printLogsToFile`

string; Default: 'onFail'. When to print logs to file(s), possible values: 'always', 'onFail', 'never' - When set to always
logs will be printed to file(s) for successful tests as well as failing ones.

#### `options.includeSuccessfulHookLogs`

boolean; Default: false. Commands from before all and after all hooks by default get logged only if
a command from them failed. This default is in accordance with the defaults on `options.printLogsTo*` to
avoid printing too many, possibly irrelevant, information. However you can set this to `true` if you
need more extensive logging, but be aware that commands will be logged to terminal from these hooks
regardless whether there were failing tests in the suite. This is because we can't know for sure in
advanced if a test fails or not.

#### `options.outputVerbose`

boolean; default: true; Toggles verbose output. Currently just writes out additional file write information, if any.

#### `options.debug`

boolean; default: false; Toggles debug output. Useful in cases of difficult to reproduce issues with the plugin.

#### `options.collectTestLogs` \*1

([spec, test, state], {type, message, severity}[]) => void; default: undefined;
Callback to collect each test case's logs after its run.
The first argument contains information about the test: the `spec` (test file), `test` (test title) and `state` (test state) fields.
The second argument contains the test logs. 'type' is from the same list as for the `collectTypes` support install option (see below). Severity can be of ['', 'error', 'warning'].

#### `options.logToFilesOnAfterRun`

boolean; default: false;
When set to true it enables additional log write pass to files using the cypress [`after:run`](https://docs.cypress.io/api/plugins/after-run-api) plugin
hook. This option can only be used with cypress 6.2.0 onwards, and with the additional
`experimentalRunEvents` configuration on versions smaller than 6.7.0.

<br/>

### _Options for the support install_

> require('cypress-terminal-report/src/installLogsCollector')(options);

#### `options.collectTypes`

array; default: ['cons:log','cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:xhr', 'cy:request', 'cy:intercept', 'cy:command']
What types of logs to collect and print. By default all types are enabled. The 'cy:command' is the general type that
contain all types of commands that are not specially treated.

#### `options.commandTimings`

null | 'timestamp' | 'seconds'; default: null;
Record and log the time when the logs were generated.
'timestamp' is the epoch timestamp in milliseconds.
'seconds' is the number of seconds since the test start, displaying the milliseconds as decimals.

#### `options.filterLog`

null | ({type, message, severity}) => boolean; default: undefined;
Callback to filter logs manually.
The type is from the same list as for the `collectTypes` option. Severity can be of ['', 'error', 'warning'].

#### `options.processLog`

null | ({type, message, severity}) => {type, message, severity}; default: undefined;
Callback to process logs manually.
The type is from the same list as for the `collectTypes` option. Severity can be of ['', 'error', 'warning'].

#### `options.collectTestLogs` \*2

(mochaRunnable, {type, message, severity}[]) => void; default: undefined;
Callback to collect each test case's logs after its run.
The `mochaRunnable` is of type `Test | Hook` from the mocha library.
The type is from the same list as for the `collectTypes` option. Severity can be of ['', 'error', 'warning'].

#### `options.xhr.printBody`

boolean; default true; Whether to print response data. Controls request body as well when `printRequestData` is
enabled. Note that currently response body is logged only on failing requests and when this config is enabled.

#### `options.xhr.printHeaderData`

boolean; default false; Whether to print header data for XHR requests.

#### `options.xhr.printRequestData`

boolean; default false; Whether to print request data for XHR requests besides response data.

#### `options.enableExtendedCollector`

boolean; default false; Enables an extended collector which will also collect command logs from
before all and after all hooks.

#### `options.enableContinuousLogging`

boolean; default false; Enables logging logs to terminal continuously / immediately as they are registered.
This feature is unstable and has an impact on pipeline performance. This option has no effect for extended
collector, only works for the simple collector. Use only for debugging purposes in case the pipelines /
tests are timing out.

> NOTE: In case of this option enabled, logs will come before the actual title of the test. Also the
> `printLogsToConsole` option will be ignored. Logging to files might also get impacted.

#### _Example for options for the support install_

```js
// ...
// Options for log collector
const options = {
  // Log console output only
  collectTypes: ['cons:log', 'cons:info', 'cons:warn', 'cons:error']
}

// Register the log collector
require('cypress-terminal-report/src/installLogsCollector')(options)
// ...
```

## Integrations

### `cypress-fail-fast`

Logging to files does not work out of the box. To enable support use the
[`logToFilesOnAfterRun`](#optionslogtofilesonafterrun) option.

### `cypress-mochawesome-reporter`

The following example demonstrates adding logs to context for all tests (snippet from `e2e.js`):

```js
import 'cypress-mochawesome-reporter/register'

afterEach(() => {
  cy.wait(50, {log: false}).then(() => cy.addTestContext(Cypress.TerminalReport.getLogs('txt')))
})

// Ensure that after plugin installation is after the afterEach handling the integration.
require('cypress-terminal-report/src/installLogsCollector')()
```

For typescript support add to your tsconfig **types** `cypress-terminal-report`.

## Logging after all and before all hooks

Commands from before all and after all hooks are not logged by default. A new experimental feature introduces
support for logging commands from these hooks: [`enableExtendedCollector`](#optionsenableextendedcollector).
This feature is by default disabled as it relies much more heavily on internals of cypress and
mocha, thus **there is a higher chance of something breaking, especially with cypress upgrades**.

Once the feature enabled, logs from these hooks will only appear in console if:

- a command from the hook fails
- hook passes and [`printLogsToConsole`](#optionsprintlogstoconsole) == `always`
- hook passes and [`printLogsToConsole`](#optionsprintlogstoconsole) ==`onFail`
  and [`includeSuccessfulHookLogs`](#optionsprintlogstoconsole) == `true`

Global `after all` hooks need to be registered before the registration of the `support install`, otherwise
they will not be added to file outputs, if such is configured. Example `e2e.js`:

```js
after(() => cy.log('this log will appear in the output files'))
require('cypress-terminal-report/src/installLogsCollector')(config)
after(() => cy.log('this log will NOT appear in the files'))
```

## Logging to files

To enable logging to file you must add the following configuration options to the
plugin install.

```js
setupNodeEvents(on, config) {
  // ...
  const options = {
    outputRoot: config.projectRoot + '/logs/',
    outputTarget: {
      'out.txt': 'txt',
      'out.json': 'json',
      'out.html': 'html',
    }
  };

  require('cypress-terminal-report/src/installLogsPrinter')(on, options);
  // ...
}
```

The `outputTarget` needs to be an object where the key is the relative path of the
file from `outputRoot` and the value is the **type** of format to output.

Supported types: `txt`, `json`, `html`.

### Log specs in separate files

To create log output files per spec file instead of one single file change the
key in the `outputTarget` to the format `{directory}|{extension}`, where
`{directory}` the root directory where to generate the files and `{extension}`
is the file extension for the log files. The generated output will have the
same structure as in the cypress specs root directory.

```js
setupNodeEvents(on, config) {
  const options = {
    outputRoot: config.projectRoot + '/logs/',
    // Used to trim the base path of specs and reduce nesting in the generated output directory.
    specRoot: 'cypress/e2e',
    outputTarget: {
      'cypress-logs|json': 'json',
    }
  };
}
```

### Custom output log processor

If you need to output in a custom format you can pass a function instead of a string
to the `outputTarget` value. This function will be called with the list of messages
per spec per test. It is called right after one spec finishes, which means on each
iteration it will receive for one spec the messages. See for example below.

> NOTE: The chunks have to be written in a way that after every write the file is
> in a valid format. This has to be like this since we cannot detect when cypress
> runs the last test. This way we also make the process faster because otherwise the
> more tests would execute the more RAM and processor time it would take to rewrite
> all the logs to the file.

Inside the function you will have access to the following API:

- `this.size` - Current char size of the output file.
- `this.atChunk` - The count of the chunk to be written.
- `this.initialContent` - The initial content of the file. Defaults to `''`. Set this
  before the first chunk write in order for it to work.
- `this.chunkSeparator` - Chunk separator string. Defaults to `''`. This string will
  be written between each chunk. If you need a special separator between chunks use this
  as it is internally handled to properly write and replace the chunks.
- `this.writeSpecChunk(specPath, dataString, positionInFile?)` - Writes a chunk of
  data in the output file.

```js
// ...
const options = {
  outputTarget: {
    'custom.output': function (allMessages, options) {
      // allMessages= {[specPath: string]: {[testTitle: string]: [type: string, message: string, severity: string][]}}

      Object.entries(allMessages).forEach(([spec, tests]) => {
        let text = `${spec}:\n`
        Object.entries(tests).forEach(([test, messages]) => {
          text += `    ${test}\n`
          messages.forEach(({type, message, severity}) => {
            text += `        ${type} (${severity}): ${message}\n`
          })
        })

        // .. Process the tests object into desired format ..
        // Insert chunk into file, by default at the end.
        this.writeSpecChunk(spec, text)
        // Or before the last two characters.
        this.writeSpecChunk(spec, text, -2)
      })
    }
  }
}
// ...
```

See [JsonOutputProcessor](./src/outputProcessor/JsonOutputProcessor.js) implementation as a
good example demonstrating both conversion of data into string and chunk write position
alternation.

### HTML output log processor

The HTML output processor has default styles:

```css
body {
  font-family: monospace;
}
p {
  margin: 0;
  padding: 0;
}
pre {
  display: inline;
  margin: 0;
}
h2 {
  margin: 0;
  font-size: 1.2em;
}
```

To pass custom CSS styles:

```js
const HtmlOutputProcessor = require('cypress-terminal-report/src/outputProcessor/HtmlOutputProcessor')
// ...
setupNodeEvents(on, config) {
  const options = {
    // ...
    outputTarget: {
      'html': function (this) {
        return new HtmlOutputProcessor(
          this.file,
          this.options,
          `
          /* Custom CSS */
          `
        )
      },
  };
}
```

## Development

### Testing

Tests can be found under `/test`. The primary expectations are run with mocha and these tests in fact
start cypress run instances and assert on their output. So that means there is a cypress suite that
is used to emulate the usage of the plugin, and a mocha suite to assert on those emulations.

To add tests you need to first add a case to existing cypress spec or create a new one and then
add the case as well in the `/test/test.js`. To run the tests you can use `npm test` in the test \
directory. You should add `it.only` to the test case you are working on to speed up development.
