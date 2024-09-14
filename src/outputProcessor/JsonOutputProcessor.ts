import BaseOutputProcessor, {IOutputProcecessor} from './BaseOutputProcessor';

export default class JsonOutputProcessor extends BaseOutputProcessor implements IOutputProcecessor {
  chunkSeparator: any;
  initialContent: any;
  writeSpecChunk: any;

  constructor(file: any) {
    super(file);
    this.initialContent = "{\n\n}";
    this.chunkSeparator = ',\n';
  }

  write(/** @type {import('../installLogsPrinter').AllMessages} */ allMessages: any) {
    Object.entries(allMessages).forEach(([spec, tests]) => {
      let data = {[spec]: {}};

      // @ts-expect-error TS(2550): Property 'entries' does not exist on type 'ObjectC... Remove this comment to see the full error message
      Object.entries(tests).forEach(([test, messages]) => {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        data[spec][test] = messages.map(({
          type,
          message,
          severity,
          timeString
        }: any) => {
          const data = {
            type: type,
            severity: severity,
            message: message,
          };

          if (timeString) {
            // @ts-expect-error TS(2339): Property 'timeString' does not exist on type '{ ty... Remove this comment to see the full error message
            data.timeString = timeString;
          }

          return data;
        });
      });

      let chunk = JSON.stringify(data, null, 2);
      chunk = chunk.slice(2, -2);

      this.writeSpecChunk(spec, chunk, -2);
    });
  }
};
