const BaseOutputProcessor = require('./BaseOutputProcessor');
const logsTxtFormatter = require('./logsTxtFormatter');

const PADDING = '    ';
const {EOL} = require('os');

module.exports = class TextOutputProcessor extends BaseOutputProcessor {

  constructor(file) {
    super(file);
    this.chunkSeparator = EOL + EOL;
  }

  write(allMessages) {

    Object.entries(allMessages).forEach(([spec, tests]) => {
      let text = `${spec}:${EOL}`;
      Object.entries(tests).forEach(([test, messages]) => {
        text += `${PADDING}${test}${EOL}`;
        text += logsTxtFormatter(messages, EOL);
        text += EOL;
      });

      this.writeSpecChunk(spec, text);
    });
  }

};
