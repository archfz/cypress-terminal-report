const BaseOutputProcessor = require('./BaseOutputProcessor');

module.exports = class CustomOutputProcessor extends BaseOutputProcessor {

  constructor(file, 
    /** @type {import('../installLogsPrinter').CustomOutputProcessorCallback} */  
    processorCallback) {
    super(file);
    this.processorCallback = processorCallback;
  }

  write(/** @type {import('../installLogsPrinter').AllMessages} */ allMessages) {
    this.processorCallback.call(this, allMessages);
  }

};
