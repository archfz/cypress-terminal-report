import * as path from 'path';
import type {IOutputProcecessor} from './BaseOutputProcessor';
import type {AllMessages} from '../installLogsPrinter.types';

export default class NestedOutputProcessorDecorator implements IOutputProcecessor {
  protected decoratedFactory: (directory: string) => IOutputProcecessor;
  protected ext: string;
  protected processors: Record<string, IOutputProcecessor>;
  protected root: string;
  protected specRoot: string;

  constructor(
    root: string,
    specRoot: string,
    ext: string,
    decoratedFactory: (directory: string) => IOutputProcecessor
  ) {
    this.root = root;
    this.ext = ext;
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
    const outPath = path.join(
      this.root,
      relativeSpec.replace(new RegExp(path.extname(relativeSpec) + '$'), `.${this.ext}`)
    );
    const processor = this.decoratedFactory(outPath);

    processor.initialize();
    this.processors[spec] = processor;

    return processor;
  }

  write(allMessages: AllMessages) {
    Object.entries(allMessages).forEach(([spec, messages]) => {
      this.getProcessor(spec).write({[spec]: messages});
    });
    // Clear cache.
    this.processors = {};
  }

  getTarget() {
    return this.root;
  }

  getSpentTime() {
    return Object.values(this.processors).reduce(
      (count: number, processor: IOutputProcecessor) => count + processor.getSpentTime(),
      0
    );
  }
}
