import CONSTANTS from "../constants";
import type {Log, LogType, MessageData} from "../types";
import utils from "../utils";
import type {PluginOptions} from "../installLogsPrinter.types";
import chalk from "chalk";

const LOG_TYPES = CONSTANTS.LOG_TYPES;
const KNOWN_TYPES = Object.values(CONSTANTS.LOG_TYPES);

const LOG_SYMBOLS = (() => {
  if (process.platform !== 'win32' || process.env.CI || process.env.TERM === 'xterm-256color') {
    return {
      error: '✘',
      warning: '❖',
      success: '✔',
      info: '✱',
      debug: '⚈',
      route: '➟'
    }
  } else {
    return {
      error: 'x',
      warning: '!',
      success: '+',
      info: 'i',
      debug: '%',
      route: '~'
    }
  }
})();

const BOLD_COLORS = ['red', 'yellow'];

const TYPE_COMPUTE: {[key in typeof LOG_TYPES[keyof typeof LOG_TYPES]]: (options: PluginOptions) => {icon: string, color: string, trim?: number}} = {
  [LOG_TYPES.PLUGIN_LOG_TYPE]: () => ({
    color: 'white',
    icon: '-',
  }),
  [LOG_TYPES.BROWSER_CONSOLE_WARN]: () => ({
    color: 'yellow',
    icon: LOG_SYMBOLS.warning,
  }),
  [LOG_TYPES.BROWSER_CONSOLE_ERROR]: () => ({
    color: 'red',
    icon: LOG_SYMBOLS.warning,
  }),
  [LOG_TYPES.BROWSER_CONSOLE_DEBUG]: () => ({
    color: 'blue',
    icon: LOG_SYMBOLS.debug,
  }),
  [LOG_TYPES.BROWSER_CONSOLE_LOG]: () => ({
    color: 'white',
    icon: LOG_SYMBOLS.info,
  }),
  [LOG_TYPES.BROWSER_CONSOLE_INFO]: () => ({
    color: 'white',
    icon: LOG_SYMBOLS.info,
  }),
  [LOG_TYPES.CYPRESS_LOG]: () => ({
    color: 'green',
    icon: LOG_SYMBOLS.info,
  }),
  [LOG_TYPES.CYPRESS_XHR]: (options) => ({
    color: 'green',
    icon: LOG_SYMBOLS.route,
    trim: options.routeTrimLength || 5000,
  }),
  [LOG_TYPES.CYPRESS_FETCH]: (options) => ({
    color: 'green',
    icon: LOG_SYMBOLS.route,
    trim: options.routeTrimLength || 5000,
  }),
  [LOG_TYPES.CYPRESS_INTERCEPT]: (options) => ({
    color: 'green',
    icon: LOG_SYMBOLS.route,
    trim: options.routeTrimLength || 5000,
  }),
  [LOG_TYPES.CYPRESS_REQUEST]: (options) => ({
    color: 'green',
    icon: LOG_SYMBOLS.success,
    trim: options.routeTrimLength || 5000,
  }),
  [LOG_TYPES.CYPRESS_COMMAND]: (options) => ({
    color: 'green',
    icon: LOG_SYMBOLS.success,
    trim: options.routeTrimLength || 5000,
  }),
}

const TYPE_STRING_CACHE: Record<string, string> = {};

const padType = (type: string, padding: string) =>
  ' '.repeat(Math.max(padding.length - type.length - 4, 0)) + type + ' ';

const getTypeString = (type: LogType, icon: string, color: string, padding: string) => {
  const key = `${type}:${icon}:${color}:${padding}`;

  if (TYPE_STRING_CACHE[key]) {
    return TYPE_STRING_CACHE[key];
  }

  const typeString = KNOWN_TYPES.includes(type) ? padType(type, padding) : padType('[unknown]', padding)
  const coloredTypeString = BOLD_COLORS.includes(color) ?
    (chalk as any)[color].bold(typeString + icon + ' ') :
    (chalk as any)[color](typeString + icon + ' ');

  TYPE_STRING_CACHE[key] = coloredTypeString;
  return coloredTypeString;
}

function consoleProcessor(
  messages: Log[],
  options: PluginOptions,
  data: MessageData
) {
  const tabLevel = data.level || 0;
  const levelPadding = '  '.repeat(Math.max(0, tabLevel - 1));
  const padding = CONSTANTS.PADDING.LOG + levelPadding;
  let output = '';

  if (data.consoleTitle) {
    output += ' '.repeat(4) + levelPadding + chalk.gray(data.consoleTitle) + '\n';
  }

  messages.forEach(({
    type,
    message,
    severity,
    timeString
  }) => {
    let {isItalic, isBold, processedMessage} = utils.checkMessageMarkdown(message);

    let {color, icon, trim} = TYPE_COMPUTE[type](options);
    trim = trim || options.defaultTrimLength || 800;

    if (severity === CONSTANTS.SEVERITY.ERROR) {
      color = 'red';
      icon = LOG_SYMBOLS.error;
    } else if (severity === CONSTANTS.SEVERITY.WARNING) {
      color = 'yellow';
      icon = LOG_SYMBOLS.warning;
    }

    if (message.length > trim) {
      processedMessage = message.substring(0, trim) + ' ...';
    }
    if (isItalic) {
      processedMessage = chalk.italic(processedMessage)
    }
    if (isBold) {
      processedMessage = chalk.bold(processedMessage)
    }

    if (timeString) {
      output += chalk.gray(`${padding}Time: ${timeString}`) + '\n';
    }

    output += getTypeString(type, icon, color, padding) + ' ' + processedMessage.replace(/\n/g, '\n' + padding) + '\n'
  });

  if (messages.length !== 0 && !data.continuous) {
    console.log(output + '\n');
  } else if (output !== '') {
    console.log(output.substring(-1));
  }
}

export default consoleProcessor;
