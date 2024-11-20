import CONSTANTS from '../constants';
import type {Colors, Log, LogSymbols, LogType, MessageData} from '../types';
import utils from '../utils';
import type {PluginOptions} from '../installLogsPrinter.types';
import chalk from 'chalk';

const {LOG_TYPES, COLORS} = CONSTANTS;
const KNOWN_LOG_TYPES = Object.values(LOG_TYPES);

const LOG_SYMBOLS = (() =>
  process.platform !== 'win32' || process.env.CI || process.env.TERM === 'xterm-256color'
    ? CONSTANTS.LOG_SYMBOLS
    : CONSTANTS.LOG_SYMBOLS_BASIC)();

const BOLD_COLORS: Colors[] = [COLORS.RED, COLORS.YELLOW];

const TYPE_COMPUTE: Record<
  LogType,
  (options: PluginOptions) => {
    icon: LogSymbols;
    color: Colors;
    trim?: number;
  }
> = {
  [LOG_TYPES.PLUGIN_LOG_TYPE]: () => ({
    color: COLORS.WHITE,
    icon: '-',
  }),
  [LOG_TYPES.BROWSER_CONSOLE_WARN]: () => ({
    color: COLORS.YELLOW,
    icon: LOG_SYMBOLS.WARNING,
  }),
  [LOG_TYPES.BROWSER_CONSOLE_ERROR]: () => ({
    color: COLORS.RED,
    icon: LOG_SYMBOLS.WARNING,
  }),
  [LOG_TYPES.BROWSER_CONSOLE_DEBUG]: () => ({
    color: COLORS.BLUE,
    icon: LOG_SYMBOLS.DEBUG,
  }),
  [LOG_TYPES.BROWSER_CONSOLE_LOG]: () => ({
    color: COLORS.WHITE,
    icon: LOG_SYMBOLS.INFO,
  }),
  [LOG_TYPES.BROWSER_CONSOLE_INFO]: () => ({
    color: COLORS.WHITE,
    icon: LOG_SYMBOLS.INFO,
  }),
  [LOG_TYPES.CYPRESS_LOG]: () => ({
    color: COLORS.GREEN,
    icon: LOG_SYMBOLS.INFO,
  }),
  [LOG_TYPES.CYPRESS_XHR]: (options) => ({
    color: COLORS.GREEN,
    icon: LOG_SYMBOLS.ROUTE,
    trim: options.routeTrimLength,
  }),
  [LOG_TYPES.CYPRESS_FETCH]: (options) => ({
    color: COLORS.GREEN,
    icon: LOG_SYMBOLS.ROUTE,
    trim: options.routeTrimLength,
  }),
  [LOG_TYPES.CYPRESS_INTERCEPT]: (options) => ({
    color: COLORS.GREEN,
    icon: LOG_SYMBOLS.ROUTE,
    trim: options.routeTrimLength,
  }),
  [LOG_TYPES.CYPRESS_REQUEST]: (options) => ({
    color: COLORS.GREEN,
    icon: LOG_SYMBOLS.SUCCESS,
    trim: options.routeTrimLength,
  }),
  [LOG_TYPES.CYPRESS_COMMAND]: (options) => ({
    color: COLORS.GREEN,
    icon: LOG_SYMBOLS.SUCCESS,
    trim: options.routeTrimLength,
  }),
};

const TYPE_STRING_CACHE: Record<string, string> = {};

const padType = (type: string, padding: string) =>
  ' '.repeat(Math.max(padding.length - type.length - 4, 0)) + type + ' ';

const getTypeString = (type: LogType, icon: LogSymbols, color: Colors, padding: string) => {
  const key = `${type}:${icon}:${color}:${padding}`;

  if (TYPE_STRING_CACHE[key]) {
    return TYPE_STRING_CACHE[key];
  }

  const typeString = padType(KNOWN_LOG_TYPES.includes(type) ? type : '[unknown]', padding);
  const fullString = typeString + icon + ' ';
  const coloredTypeString = BOLD_COLORS.includes(color)
    ? chalk[color].bold(fullString)
    : chalk[color](fullString);

  TYPE_STRING_CACHE[key] = coloredTypeString;
  return coloredTypeString;
};

function consoleProcessor(messages: Log[], options: PluginOptions, data: MessageData) {
  const tabLevel = data.level || 0;
  const levelPadding = '  '.repeat(Math.max(0, tabLevel - 1));
  const padding = CONSTANTS.PADDING.LOG + levelPadding;
  let output = '';

  if (data.consoleTitle) {
    output += ' '.repeat(4) + levelPadding + chalk.gray(data.consoleTitle) + '\n';
  }

  messages.forEach(({type, message, severity, timeString}) => {
    let processedMessage = message;
    let {color, icon, trim = options.defaultTrimLength} = TYPE_COMPUTE[type](options);

    if (severity === CONSTANTS.SEVERITY.ERROR) {
      color = COLORS.RED;
      icon = LOG_SYMBOLS.ERROR;
    } else if (severity === CONSTANTS.SEVERITY.WARNING) {
      color = COLORS.YELLOW;
      icon = LOG_SYMBOLS.WARNING;
    }

    const maybeTrimLength = (msg: string) =>
      trim && msg.length > trim ? msg.substring(0, trim) + ' ...' : msg;

    if (type == 'cy:log') {
      processedMessage = utils.applyMessageMarkdown(processedMessage, {
        bold: chalk.bold,
        italic: chalk.italic,
        processContents: maybeTrimLength,
      });
    } else {
      processedMessage = maybeTrimLength(processedMessage);
    }

    if (timeString) {
      output += chalk.gray(`${padding}Time: ${timeString}`) + '\n';
    }

    output +=
      getTypeString(type, icon, color, padding) +
      ' ' +
      processedMessage.replace(/\n/g, '\n' + padding) +
      '\n';
  });

  if (messages.length !== 0 && !data.continuous) {
    console.log(output + '\n');
  } else if (output !== '') {
    console.log(output.substring(-1));
  }
}

export default consoleProcessor;
