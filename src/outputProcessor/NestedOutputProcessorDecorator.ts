import * as path from 'path';
import type {IOutputProcecessor} from './BaseOutputProcessor';
import type {AllMessages} from '../installLogsPrinter.types';

export default class NestedOutputProcessorDecorator implements IOutputProcecessor {
  protected decoratedFactory: (directory: string) => IOutputProcecessor;
  protected processors: Record<string, IOutputProcecessor>;
  protected pattern: string;
  protected target: string;
  protected specRoot: string;
  protected dateTimeInfos?: Record<string, string>;

  constructor(
    filePattern: string,
    specRoot: string,
    decoratedFactory: (directory: string) => IOutputProcecessor
  ) {
    const parts = filePattern.split('|');
    const isPattern = parts[0] === '*';
    this.pattern = isPattern
      ? filePattern.substring(2).replace(/\|/g, '')
      : `${parts[0]}/[relpath]/[basename].${parts[1]}`;
    this.target = isPattern ? this.pattern : parts[0];
    this.specRoot = specRoot;
    this.decoratedFactory = decoratedFactory;

    this.processors = {};
  }

  initialize() {
    /* noop */
  }

  getProcessor(spec: string) {
    if (this.processors[spec]) {
      return this.processors[spec];
    }

    const relativeSpec = path.relative(this.specRoot, spec);
    const parsedSpec = path.parse(relativeSpec);
    const outPath = this.pattern.replace(/\[([^\]]+)\]/g, (_, token: string) => {
      if (token === 'relpath') {
        return parsedSpec.dir;
      }
      if (token === 'basename') {
        return parsedSpec.name;
      }
      return this.getDateTimeInfo(token);
    });
    const processor = this.decoratedFactory(outPath);

    processor.initialize();
    this.processors[spec] = processor;

    return processor;
  }

  protected getDateTimeInfo(token: string) {
    const defaults: Record<string, string> = {
      H: '0',
      HH: '00',
      M: '0',
      MM: '00',
      S: '0',
      SS: '00',
      d: '1',
      dd: '01',
      m: '1',
      mm: '01',
      yy: '70',
      yyyy: '1970',
    };

    if (!Object.prototype.hasOwnProperty.call(defaults, token)) {
      return '-';
    }

    if (!this.dateTimeInfos) {
      const date = new Date();
      this.dateTimeInfos = {
        H: String(date.getHours()),
        M: String(date.getMinutes()),
        S: String(date.getSeconds()),
        d: String(date.getDate()),
        m: String(date.getMonth() + 1),
        yyyy: String(date.getFullYear()),
      };
      this.dateTimeInfos.HH = this.dateTimeInfos.H.padStart(2, '0');
      this.dateTimeInfos.MM = this.dateTimeInfos.M.padStart(2, '0');
      this.dateTimeInfos.SS = this.dateTimeInfos.S.padStart(2, '0');
      this.dateTimeInfos.dd = this.dateTimeInfos.d.padStart(2, '0');
      this.dateTimeInfos.mm = this.dateTimeInfos.m.padStart(2, '0');
      this.dateTimeInfos.yy = this.dateTimeInfos.yyyy.slice(-2);
    }

    return this.dateTimeInfos[token];
  }

  write(allMessages: AllMessages) {
    Object.entries(allMessages).forEach(([spec, messages]) => {
      this.getProcessor(spec).write({[spec]: messages});
    });
    // Clear cache.
    this.processors = {};
  }

  getTarget() {
    return this.target;
  }

  getSpentTime() {
    return Object.values(this.processors).reduce(
      (count: number, processor: IOutputProcecessor) => count + processor.getSpentTime(),
      0
    );
  }
}
