const { defineConfig } = require('cypress')
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");

module.exports = defineConfig({
  e2e: {
    "baseUrl": "https://example.cypress.io",
    "video": false,
    "screenshotOnRunFailure": false,
    reporter: 'cypress-mochawesome-reporter',
    specPattern: 'cypress/integration/**/*.spec.{js,jsx,ts,tsx}',
    async setupNodeEvents(on, config) {
      let options = {
        defaultTrimLength: 800,
      };

      if (config.env.breaking) {
        config.retries = {
          "runMode": 2,
          "openMode": 2
        };
      }
      if (config.env.generateOutput == "1") {
        options.outputRoot = config.projectRoot + '/output/';
        options.outputTarget = {
          'not/existing/path/out.txt': 'txt',
          'out.txt': 'txt',
          'out.json': 'json',
          'out.cst': function (allMessages) {
            this.initialContent = 'Specs:\n';
            this.chunkSeparator = '\n';
            Object.keys(allMessages).forEach((specPath) => {
              this.writeSpecChunk(specPath, specPath);
            });
          },
        };
      }
      if (config.env.generateNestedOutput == "1") {
        options.outputRoot = config.projectRoot + '/output_nested/';
        options.specRoot = 'cypress/integration';
        options.outputTarget = {
          'txt|txt': 'txt',
          'json|json': 'json',
          'custom|cst': function (allMessages) {
            this.initialContent = 'Specs:\n';
            this.chunkSeparator = '\n';
            Object.keys(allMessages).forEach((specPath) => {
              this.writeSpecChunk(specPath, specPath);
            });
          },
        };
      }
      if (config.env.disableVerbose == "1"){
        options.outputVerbose = false;
      }
      if (config.env.debug == "1"){
        options.debug = true;
      }
      if (config.env.generateSimpleOutput == "1") {
        options.outputRoot = config.projectRoot + '/output/';
        options.outputTarget = {'out.txt': 'txt'};
      }
      if (config.env.compactLogs == "1") {
        options.compactLogs = 1;
      }
      if (config.env.outputCompactLogs == "1") {
        options.compactLogs = 1;
        options.outputCompactLogs = 5;
        options.outputRoot = config.projectRoot + '/output/';
        options.outputTarget = { 'out.txt': 'txt', };
      }
      if (config.env.outputCompactLogs == "2") {
        options.outputCompactLogs = 5;
        options.outputRoot = config.projectRoot + '/output/';
        options.outputTarget = { 'out.txt': 'txt', };
      }
      if (config.env.outputCompactLogs == "3") {
        options.compactLogs = 5;
        options.outputCompactLogs = false;
        options.outputRoot = config.projectRoot + '/output/';
        options.outputTarget = { 'out.txt': 'txt', };
      }
      if (config.env.pluginBadConfig == '1') {
        options = {
          outputRoot: 0,
          outputTarget: {
            any: 100
          },
          outputVerbose: "false",
          compactLogs: false,
          printLogsToConsole: true,
          printLogsToFile: true,
          shouldNotBeHere: "",
          collectTestLogs: "",
        };
      }
      if (config.env.printLogsToConsoleAlways == '1') {
        options.printLogsToConsole = 'always';
      }
      if (config.env.printLogsToConsoleNever == '1') {
        options.printLogsToConsole = 'never';
      }
      if (config.env.printLogsToFileAlways == '1') {
        options.printLogsToFile = 'always';
      }
      if (config.env.printLogsToFileNever == '1') {
        options.printLogsToFile = 'never';
      }
      if (config.env.printSuccessfulHookLogs == '1') {
        options.includeSuccessfulHookLogs = true;
      }
      if (config.env.collectTestLogsPlugin == '1') {
        options.collectTestLogs = (context, logs) =>
          console.log(`Collected ${logs.length} logs for test "${context.test}", last log: ${logs[logs.length - 1]}`);
      }
      if (config.env.logToFilesOnAfterRun == '1') {
        options.logToFilesOnAfterRun = true;
      }

      if (config.env.enableCucumber) {
        const preprocessor = require("@badeball/cypress-cucumber-preprocessor");
        const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");

        await preprocessor.addCucumberPreprocessorPlugin(on, config);
        on(
          "file:preprocessor",
          createBundler({
            plugins: [createEsbuildPlugin.default(config)],
          })
        );
        config.excludeSpecPattern = '*.js';
        config.specPattern = 'cypress/integration/**/*.feature';
      }

      if (config.env.cypressGrep == '1') {
        config.env.grep = "run only this"
      }

      if (config.env.failFast) {
        require("cypress-fail-fast/plugin")(on, config);
      }

      if (config.env.mochawesome == '1') {
        require('cypress-mochawesome-reporter/plugin')(on);
      }

      if (config.env.disabled != '1') {
        require('../src/installLogsPrinter')(on, options);
      }

      return config;
    }
  },
  component: {
    devServer: {
      bundler: 'webpack',
    },
    setupNodeEvents(on, config) {
      require('../src/installLogsPrinter')(on, {});
      return config;
    }
  },
})
