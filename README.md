# Cypress terminal report

[![Build Status](https://travis-ci.com/archfz/cypress-terminal-report.svg?branch=master)](https://travis-ci.com/archfz/cypress-terminal-report)
[![Downloads](https://badgen.net/npm/dw/cypress-terminal-report)](https://www.npmjs.com/package/cypress-terminal-report)

Plugin for cypress that adds better terminal output __when tests fail__
on the terminal for better debugging. Prints cy commands, console.warn, 
console.error and request response data captured with cy.route. 

> Note: If you want to display the logs when test succeed as well then check the
[options](#options) for the support install.

> Note: Currently logs do not appear in the dashboard. If you want to see them go
to your CI runner and check the pipeline logs there.

- [Install](#install)
- [Options](#options)
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
       require('cypress-terminal-report').installPlugin(on);
    };
    ```
3. Register the log collector support in `cypress/support/index.js`
    ```js
    require('cypress-terminal-report').installSupport();
    ```

## Options

Options for the plugin install: `.installPlugin(on, options)`:
- `options.defaultTrimLength` - integer; default: 800; max length of cy.log and console.warn/console.error.
- `options.commandTrimLength` - integer; default: 800; max length of cy commands.
- `options.routeTrimLength` - integer; default: 5000; max length of cy.route request data.

Options for the support install: `.installSupport(options)`:
- `options.printLogs` - string; default: 'onFail'; possible values: 'onFail', 'always' - When set to always
logs will be printed for successful test as well as failing ones.
- `options.collectTypes` - array; default: ['cons:log','cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:xhr', 'cy:request', 'cy:route', 'cy:command']
What types of logs to collect and print. By default all types are enabled. The 'cy:command' is the general type that
contain all types of commands that are not specially treated.
- `options.filterLog` - undefined|([type, message, severity]) => boolean; default: undefined; Callback to filter logs manually.
The type is from the same list as for the `collectTypes` option. Severity can be of ['', 'error', 'warning'].

## Development

### Testing

Tests can be found under `/test`. The primary expectations are run with mocha and these tests in fact
start cypress run instances and assert on their output. So that means there is a cypress suite that
is used to emulate the usage of the plugin, and a mocha suite to assert on those emulations.

To add tests you need to first add a case to existing cypress spec or create a new one and then
add the case as well in the `/test/test.js`. To run the tests you can use `npm test` in the test \
directory. You should add `it.only` to the test case you are working on to speed up development.

## Release Notes

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
