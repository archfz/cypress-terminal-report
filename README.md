# Cypress terminal report

[![Build Status](https://travis-ci.com/archfz/cypress-terminal-report.svg?branch=master)](https://travis-ci.com/archfz/cypress-terminal-report)

Plugin for cypress that adds better terminal output when tests fail
on the terminal for better debugging. Prints cy commands, console.warn, 
console.error and request data captured with cy.route. 

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

The plugin install can receive some options: `.installPlugin(on, options)`:
- `options.defaultTrimLength` - default: 200; max length of cy.log and console.warn/console.error.
- `options.commandTrimLength` - default: 600; max length of cy commands.
- `options.routeTrimLength` - default: 5000; max length of cy.route request data.

To print logs for all tests add `{printLogs: true}` to `installSupport`:
    
    require('cypress-terminal-report').installSupport({printLogs: true});
    
## Release notes

#### Next (unreleased)

- Added tests and CI to repository.
- Added support for showing logs even for successful tests. in [issue](https://github.com/archfz/cypress-terminal-report/issues/3) by [@zhex900](https://github.com/zhex900)
- Fixed issue with incorrectly labeled failed commands. in [issue](https://github.com/archfz/cypress-terminal-report/issues/3) by [@zhex900](https://github.com/zhex900)
- Fixed issue with logs from cy.route breaking tests on XHR API type of requests. [merge-request](https://github.com/archfz/cypress-terminal-report/pull/1) by [@zhex900](https://github.com/zhex900)
