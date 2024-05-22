const path = require('path');

module.exports = class NestedOutputProcessorDecorator {

  constructor(filePattern, specRoot, decoratedFactory) {
	const parts = filePattern.split('|');
    this.root = parts[0];
    this.ext = parts[1];
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

  write(/** @type {import('../installLogsPrinter').AllMessages} */ allMessages) {
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
