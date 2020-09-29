module.exports = (on, config) => {
  let options = {};

  if (config.env.generateOutput == "1") {
    options.outputRoot = config.projectRoot + '/output/';
    options.outputTarget = {
      'not/existing/path/out.txt': 'txt',
      'out.txt': 'txt',
      'out.json': 'json',
      'out.cst': function (messages) {
        this.initialContent = 'Specs:\n';
        this.chunkSeparator = '\n';
        Object.keys(messages).forEach((key) => {
          this.writeSpecChunk(key, key);
        });
      },
    };
  }
  if (config.env.compactLogs == "1") {
    options.compactLogs = 1;
  }
  if (config.env.pluginBadConfig == '1') {
    options = {
      outputRoot: 0,
      outputTarget: {
        any: 100
      },
      compactLogs: false,
      printLogsToConsole: false,
      printLogsToFile: true,
      shouldNotBeHere: "",
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

  require('../../../src/installLogsPrinter')(on, options);
};
