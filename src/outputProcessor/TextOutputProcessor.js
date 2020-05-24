const BaseOutputProcessor = require('./BaseOutputProcessor');

const CONSTANTS = require('../constants');
const PADDING = '    ';
const PADDING_LOGS = `${PADDING}`.repeat(6);

module.exports = class JsonOutputProcessor extends BaseOutputProcessor {

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
      text += `${spec}:\n`;
      Object.entries(tests).forEach(([test, messages]) => {
        text += `${PADDING}${test}\n`;
        messages.forEach(([type, message, severity]) => {
          text += this.padTypeText(`${type} (${this.severityToFont(severity)}): `) +
            message.replace(/\n/g, `\n${PADDING_LOGS}`) + '\n';
        });
        text += '\n';
      });
      text += '\n\n';
    });

    this.writeChunk(text);
  }

};
