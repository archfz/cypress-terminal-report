import CONSTANTS from '../constants';
import type {Log} from '../types';

const PADDING = '    ';
const PADDING_LOGS = `${PADDING}`.repeat(6);
const SEVERITY_ICON = {
  [CONSTANTS.SEVERITY.ERROR]: 'X',
  [CONSTANTS.SEVERITY.WARNING]: '!',
  [CONSTANTS.SEVERITY.SUCCESS]: 'K',
};

const padTypeText = (text: string) => {
  return ' '.repeat(Math.max(PADDING_LOGS.length - text.length, 0)) + text;
};

const padTimeText = (text: string) => {
  return PADDING_LOGS + text;
};

function logsTxtFormatter(logs: Log[], EOL = '\n') {
  return logs
    .map(({type, message, severity, timeString}) => {
      let formattedLog = (
        padTypeText(`${type} (${SEVERITY_ICON[severity]}): `) +
        message.replace(/\n/g, `${EOL}${PADDING_LOGS}`) +
        EOL
      ).replace(/\s+\n/, '\n');
      if (timeString) {
        formattedLog = padTimeText(`Time: ${timeString}`) + `\n` + formattedLog;
      }
      return formattedLog;
    })
    .join('');
}

export default logsTxtFormatter;
