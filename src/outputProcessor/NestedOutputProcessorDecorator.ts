import * as path from 'path';

export default class NestedOutputProcessorDecorator {
  decoratedFactory: any;
  ext: any;
  processors: any;
  root: any;
  specRoot: any;

  constructor(root: any, specRoot: any, ext: any, decoratedFactory: any) {
    this.root = root;
    this.ext = ext;
    this.specRoot = specRoot || '';
    this.decoratedFactory = decoratedFactory;

    this.processors = [];
  }

  initialize() {
    /* noop */
  }

  getProcessor(spec: any) {
    if (this.processors[spec]) {
      return this.processors[spec];
    }

    const relativeSpec = path.relative(this.specRoot, spec);
    const outPath = path.join(this.root, relativeSpec.replace(new RegExp(path.extname(relativeSpec) + '$'), `.${this.ext}`));
    const processor = this.decoratedFactory(outPath);

    processor.initialize();
    this.processors[spec] = processor;

    return processor;
  }

  write(/** @type {import('../installLogsPrinter').AllMessages} */ allMessages: any) {
    Object.entries(allMessages).forEach(([spec, messages]) => {
      this.getProcessor(spec).write({[spec]: messages});
    });
  }

  getTarget() {
    return this.root;
  }

  getSpentTime() {
    return Object.values(this.processors).reduce((count: any, processor: any) => count + processor.getSpentTime(), 0);
  }
};
