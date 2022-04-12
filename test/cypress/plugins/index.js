const path = require('path');
const cucumber = require('cypress-cucumber-preprocessor').default;

module.exports = (on, config) => {
  let options = {
    defaultTrimLength: 800,
  };

  if (config.env.breaking) {
    config.retries = {
      "runMode": 2,
      "openMode": 0
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
    options.specRoot = path.relative(config.fileServerFolder, config.integrationFolder);
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
    on('file:preprocessor', cucumber());
    config.ignoreTestFiles = '*.js';
    config.testFiles = '**/*.{feature,features}';
  }

  if (config.env.failFast) {
    require("cypress-fail-fast/plugin")(on, config);
  }

  require('../../../src/installLogsPrinter')(on, options);

  return config;
};
