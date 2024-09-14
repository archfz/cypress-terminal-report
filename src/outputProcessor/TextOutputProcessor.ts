import BaseOutputProcessor from './BaseOutputProcessor';
import logsTxtFormatter from './logsTxtFormatter';
import { EOL } from 'os';

const PADDING = '    ';

export default class TextOutputProcessor extends BaseOutputProcessor {
  chunkSeparator: any;
  writeSpecChunk: any;

  constructor(file: any) {
    super(file);
    this.chunkSeparator = EOL + EOL;
  }

  write(/** @type {import('../installLogsPrinter').AllMessages} */ allMessages: any) {
    Object.entries(allMessages).forEach(([spec, tests]) => {
      let text = `${spec}:${EOL}`;
      // @ts-expect-error TS(2550): Property 'entries' does not exist on type 'ObjectC... Remove this comment to see the full error message
      Object.entries(tests).forEach(([test, messages]) => {
        text += `${PADDING}${test}${EOL}`;
        text += logsTxtFormatter(messages, EOL);
        text += EOL;
      });

      this.writeSpecChunk(spec, text);
    });
  }
};
