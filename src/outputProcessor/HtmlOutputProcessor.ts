import type {AllMessages, PluginOptions} from '../installLogsPrinter.types';
import BaseOutputProcessor from './BaseOutputProcessor';
import {Log, LogSymbols, LogType, ValueOf} from '../types';
import CONSTANTS from '../constants';
import utils from '../utils';

const {COLORS: BASE_COLORS, LOG_TYPES, LOG_SYMBOLS} = CONSTANTS;

export const TYPE_PADDING = Math.max(...Object.values(LOG_TYPES).map((l) => l.length)) + 3;

const COLORS = {
  ...BASE_COLORS,
  DARK_CYAN: 'darkcyan',
  LIGHT_GREY: 'lightgrey',
} as const;

type Colors = ValueOf<typeof COLORS>;

const MessageConfigMap: Record<
  LogType,
  (options: PluginOptions) => {
    typeColor: Colors;
    icon: LogSymbols;
    /**
     * default is no html color
     */
    messageColor?: Colors;
    /**
     * default is no trim (full message length)
     */
    trim?: number;
  }
> = {
  [LOG_TYPES.PLUGIN_LOG_TYPE]: () => ({typeColor: COLORS.DARK_CYAN, icon: LOG_SYMBOLS.INFO}),
  [LOG_TYPES.BROWSER_CONSOLE_WARN]: () => ({typeColor: COLORS.YELLOW, icon: LOG_SYMBOLS.WARNING}),
  [LOG_TYPES.BROWSER_CONSOLE_ERROR]: () => ({typeColor: COLORS.RED, icon: LOG_SYMBOLS.ERROR}),
  [LOG_TYPES.BROWSER_CONSOLE_DEBUG]: () => ({typeColor: COLORS.BLUE, icon: LOG_SYMBOLS.DEBUG}),
  [LOG_TYPES.BROWSER_CONSOLE_INFO]: () => ({typeColor: COLORS.DARK_CYAN, icon: LOG_SYMBOLS.INFO}),
  [LOG_TYPES.BROWSER_CONSOLE_LOG]: () => ({typeColor: COLORS.DARK_CYAN, icon: LOG_SYMBOLS.INFO}),
  [LOG_TYPES.CYPRESS_LOG]: () => ({typeColor: COLORS.DARK_CYAN, icon: LOG_SYMBOLS.INFO}),
  [LOG_TYPES.CYPRESS_XHR]: (options) => ({
    typeColor: COLORS.LIGHT_GREY,
    icon: LOG_SYMBOLS.ROUTE,
    messageColor: COLORS.LIGHT_GREY,
    trim: options.routeTrimLength,
  }),
  [LOG_TYPES.CYPRESS_FETCH]: (options) => ({
    typeColor: COLORS.GREEN,
    icon: LOG_SYMBOLS.ROUTE,
    trim: options.routeTrimLength,
    messageColor: COLORS.GREY,
  }),
  [LOG_TYPES.CYPRESS_INTERCEPT]: (options) => ({
    typeColor: COLORS.GREEN,
    icon: LOG_SYMBOLS.ROUTE,
    messageColor: COLORS.GREY,
    trim: options.routeTrimLength,
  }),
  [LOG_TYPES.CYPRESS_REQUEST]: (options) => ({
    typeColor: COLORS.GREEN,
    icon: LOG_SYMBOLS.SUCCESS,
    messageColor: COLORS.GREY,
    trim: options.routeTrimLength,
  }),
  [LOG_TYPES.CYPRESS_COMMAND]: () => ({
    typeColor: COLORS.GREEN,
    icon: LOG_SYMBOLS.SUCCESS,
  }),
};

// https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
export function escapeHtml(html: string) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format an individual Cypress message for HTML logging:
 * - Convert cy.log markup syntax to HTML (bold/italic).
 * - Color message depending on message type and severity.
 * - Trim long messages.
 * - Apply proper spacing, newlines, and HTML syntax.
 */
export function formatMessage({type, message, severity}: Log, options: PluginOptions) {
  const messageConfig = MessageConfigMap[type](options);

  let processedMessage = message;
  let {typeColor, icon, messageColor, trim = options.defaultTrimLength} = messageConfig;

  if (severity === 'error') {
    typeColor = COLORS.RED;
    icon = LOG_SYMBOLS.ERROR;
  } else if (severity === 'warning') {
    typeColor = COLORS.YELLOW;
    icon = LOG_SYMBOLS.WARNING;
  }

  const maybeTrimLength = (msg: string) =>
    trim && msg.length > trim
      ? msg.substring(0, trim) + ' ...\n\n... remainder of log omitted ...\n'
      : msg;

  const processMessage = (msg: string) => escapeHtml(maybeTrimLength(msg));

  if (type == 'cy:log') {
    processedMessage = utils.applyMessageMarkdown(processedMessage, {
      bold: (str) => `<b>${str}</b>`,
      italic: (str) => `<i>${str}</i>`,
      processContents: processMessage,
    });
  } else {
    processedMessage = processMessage(processedMessage);
  }

  // If the message is multilined, align non-first lines with the "message column" that's
  // to the right of the "type column"
  processedMessage = processedMessage
    .split('\n')
    .map((line, index) => (index === 0 ? line : `${' '.repeat(TYPE_PADDING + 1)}${line}`))
    .join('\n');

  processedMessage = `<pre${messageColor ? ` style="color:${messageColor};"` : ''}>${processedMessage}</pre>`;

  const typeString = `<pre style="color:${typeColor};">${
    // pad to make "type column" spacing even
    `${type}${icon}`.padStart(TYPE_PADDING, ' ')
  }</pre>`;

  return `<p>${typeString} ${processedMessage}</p>\n`;
}

export default class HtmlOutputProcessor extends BaseOutputProcessor {
  private closingContent = `
</body>
</html>`;
  private beforeClosingContentPos = -this.closingContent.length;

  constructor(
    protected file: string,
    protected options: PluginOptions,
    /**
     * Style CSS, gets placed within the `<style>` tag of the html document.
     * 
     * @default
        body { font-family: monospace; }
        p { margin: 0; padding: 0; }
        pre { display: inline; margin: 0; }
        h2 { margin: 0; font-size: 1.2em; }
     */
    protected style: string = `body { font-family: monospace; }
    p { margin: 0; padding: 0; }
    pre { display: inline; margin: 0; }
    h2 { margin: 0; font-size: 1.2em; }`
  ) {
    super(file, options);
    this.initialContent = `<html>
<head>
  <style>
${style
  .split('\n')
  .map((line) => '    ' + line.trim())
  .join('\n')}
  </style>
</head>

<body>
${this.closingContent}`;
  }

  write(allMessages: AllMessages) {
    for (const [spec, tests] of Object.entries(allMessages)) {
      let html = `\n<h1>${escapeHtml(spec)}</h1>\n`;

      for (const [test, messages] of Object.entries(tests)) {
        html += `<h2>${escapeHtml(test)}</h2>\n`;
        for (const message of messages) {
          html += formatMessage(message, this.options);
        }
        html += '<br>\n';
      }

      this.writeSpecChunk(spec, html, this.beforeClosingContentPos);
    }
  }
}
