const path = require('path');

module.exports = class NestedOutputProcessorDecorator {

  constructor(root, specRoot, ext, decoratedFactory) {
    this.root = root;
    this.ext = ext;
    this.specRoot = specRoot || '';
    this.decoratedFactory = decoratedFactory;

    this.processors = [];
  }

  initialize() {
    /* noop */
  }

  getProcessor(spec) {
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

  write(allMessages) {
    Object.entries(allMessages).forEach(([spec, messages]) => {
      this.getProcessor(spec).write({[spec]: messages});
    });
  }

  getTarget() {
    return this.root;
  }

  getSpentTime() {
    return Object.values(this.processors).reduce((count, processor) => count + processor.getSpentTime(), 0);
  }
};
