const path = require('path');

module.exports = class NestedOutputProcessorDecorator {

  constructor(filePattern, specRoot, decoratedFactory) {
    const parts = filePattern.split('|');
	// for pattern matching: first part of filePattern has to start with '*|'
	if (parts[0] === "*") {
		// join all parts, but remove '|'
		this.pattern = filePattern.substring(2).split('|').join('');
	} else {
		// legacy format: path-prefix|extension
		this.pattern = parts[0]+"/[relpath]/[basename]."+parts[1];
	}

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
	
	const parsed = path.parse(relativeSpec);
	const relpath = parsed.dir;
	const basename = parsed.name;

	// replace [*] tokens in pattern to build output filepath
	var outPath = this.pattern.replace(/\[([^\]]+)\]/g, function(m, cap1) {
		if (cap1 === "relpath") return relpath;
		if (cap1 === "basename") return basename;
		return "-";
	});

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
