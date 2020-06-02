const BaseOutputProcessor = require('./BaseOutputProcessor');

const CONSTANTS = require('../constants');
const PADDING = '    ';
const PADDING_LOGS = `${PADDING}`.repeat(6);
const {EOL} = require('os');

module.exports = class TextOutputProcessor extends BaseOutputProcessor {

  severityToFont(severity) {
    return {
      [CONSTANTS.SEVERITY.ERROR]: 'X',
      [CONSTANTS.SEVERITY.WARNING]: '!',
      [CONSTANTS.SEVERITY.SUCCESS]: 'K',
    }[severity];
  }

  padTypeText(text) {
    return Array(Math.max(PADDING_LOGS.length - text.length + 1, 0)).join(' ')
      + text;
  }

  write(allMessages) {
    let text = '';

    Object.entries(allMessages).forEach(([spec, tests]) => {
      text += `${spec}:${EOL}`;
      Object.entries(tests).forEach(([test, messages]) => {
        text += `${PADDING}${test}${EOL}`;
        messages.forEach(([type, message, severity]) => {
          text += this.padTypeText(`${type} (${this.severityToFont(severity)}): `) +
            message.replace(/\n/g, `${EOL}${PADDING_LOGS}`) + EOL;
        });
        text += EOL;
      });
      text += EOL + EOL;
    });

    this.writeChunk(text);
  }

};
