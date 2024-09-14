import BaseOutputProcessor, {IOutputProcecessor} from './BaseOutputProcessor';
import {AllMessages} from "../installLogsPrinter.types";
import {Log} from "../types";

export default class JsonOutputProcessor extends BaseOutputProcessor implements IOutputProcecessor {
  chunkSeparator: string = ',\n';
  initialContent: string = "{\n\n}";

  write(allMessages: AllMessages) {
    Object.entries(allMessages).forEach(([spec, tests]) => {
      let data: Record<string, Record<string, Log[]>> = {[spec]: {}};

      Object.entries(tests).forEach(([test, messages]) => {
        data[spec][test] = messages.map((message) => {
          const {timeString, ...data} = message;
          if (timeString) {
            (data as Log).timeString = timeString;
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
