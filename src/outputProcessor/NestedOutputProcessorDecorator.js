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
	
	// default/example date time info - also to know which keys are available
	const DefaultTimeInfos = {
		H: "0",			// Hour of day
		HH: "00",		// Hour of day - with leading zero
		M: "0",			// Minute of hour
		MM: "00",		// Minute of hour - with leading zero
		S: "0",			// Second of minute
		SS: "00",		// Second of minute - with leading zero
		d: "1",			// day of month
		dd: "01",		// day of month - with leading zero
		m: "1",			// month of year
		mm: "01",		// month of year - with leading zero
		yy: "70",		// last 2 digits of current year
		yyyy: "1970",	// current year
	};
	var dateTimeInfos = DefaultTimeInfos;
	// lazy init dateTime info only on demand
	var initDate = function() {
		if (dateTimeInfos === DefaultTimeInfos) {
			var d = new Date();
			dateTimeInfos = {
				m: d.getMonth() + 1,
				d: d.getDate(),
				H: d.getHours(),
				M: d.getMinutes(),
				S: d.getSeconds(),
			};
			// convert to string and prepend 0
			Object.keys(dateTimeInfos).forEach(function(key) {
				dateTimeInfos[key] = ""+dateTimeInfos[key];
				dateTimeInfos[key+key] = (dateTimeInfos[key].length < 2 ? "0" : "")+dateTimeInfos[key];
			});
			// year
			dateTimeInfos.yyyy = ""+d.getFullYear();
			dateTimeInfos.yy = dateTimeInfos.yyyy.slice(-2);
		}
		return dateTimeInfos;
	}

	// replace [*] tokens in pattern to build output filepath
	var outPath = this.pattern.replace(/\[([^\]]+)\]/g, function(m, cap1) {
		if (cap1 === "relpath") return relpath;
		if (cap1 === "basename") return basename;
		if (Object.hasOwn(dateTimeInfos, cap1)) return initDate()[cap1];
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
