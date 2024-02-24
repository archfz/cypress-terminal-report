const CONSTANTS = require("../constants");

const PADDING = '    ';
const PADDING_LOGS = `${PADDING}`.repeat(6);

const padTypeText = (text) => {
  return Array(Math.max(PADDING_LOGS.length - text.length + 1, 0)).join(' ')
    + text;
}

const padTimeText = (text) => {
  return PADDING_LOGS + text;
}

function logsTxtFormatter(logs, EOL = '\n') {
  return logs.map(({type, message, severity, timeString}) => {
    let formattedLog = (padTypeText(`${type} (${{
        [CONSTANTS.SEVERITY.ERROR]: 'X',
        [CONSTANTS.SEVERITY.WARNING]: '!',
        [CONSTANTS.SEVERITY.SUCCESS]: 'K',
      }[severity]}): `) +
      message.replace(/\n/g, `${EOL}${PADDING_LOGS}`) + EOL).replace(/\s+\n/, '\n');
    if (timeString) {
      formattedLog = padTimeText(`Time: ${timeString}`) + `\n` + formattedLog;
    }
    return formattedLog;
  }).join('');
}

module.exports = logsTxtFormatter;
