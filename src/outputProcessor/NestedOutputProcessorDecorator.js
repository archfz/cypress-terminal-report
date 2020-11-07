const path = require('path');
const fs = require('fs-extra');

module.exports = class NestedOutputProcessorDecorator {

  constructor(root, specRoot, ext, decoratedFactory) {
    this.root = root;
    this.ext = ext;
    this.specRoot = specRoot || '';
    this.decoratedFactory = decoratedFactory;

    this.decoratedProcessors = [];
  }

  initialize() {
    if (fs.existsSync(this.root)) {
      fs.removeSync(this.root);
    }
  }

  write(allMessages) {
    Object.entries(allMessages).forEach(([spec, messages]) => {
      const relativeSpec = path.relative(this.specRoot, spec);
      const outPath = path.join(this.root, relativeSpec.replace(/\..+$/, `.${this.ext}`));
      const processor = this.decoratedFactory(outPath);

      this.decoratedProcessors.push(processor);
      processor.write({[spec]: messages});
    });
  }

  getTarget() {
    return this.root;
  }

  getSpentTime() {
    return this.decoratedProcessors.reduce((count, processor) => count + processor.getSpentTime(), 0);
  }
};
