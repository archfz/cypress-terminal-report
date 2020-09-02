module.exports = (on, config) => {
  const options = {};

  if (config.env.generateOutput == "1") {
    options.outputRoot = config.projectRoot + '/output/';
    options.outputTarget = {
      'not/existing/path/out.txt': 'txt',
      'out.txt': 'txt',
      'out.json': 'json',
      'out.cst': function (messages) {
        this.initialContent = 'Failing specs:\n';
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

  require('../../../src/installLogsPrinter')(on, options);
};
