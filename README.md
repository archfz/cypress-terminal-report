# Cypress terminal report

Plugin for cypress that adds better terminal output when tests fail
on the terminal for better debugging. Prints cy commands, console.warn 
and console.error from the browser to terminal when a test fails. 

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
