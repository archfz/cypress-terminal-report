const BaseOutputProcessor = require('./BaseOutputProcessor');

module.exports = class CustomOutputProcessor extends BaseOutputProcessor {

  constructor(file, processorCallback) {
    super(file);
    this.processorCallback = processorCallback;
  }

  write(allMessages) {
    let allMessagesWithoutState = Object.assign({}, allMessages);
    delete allMessagesWithoutState[0];
    this.processorCallback.call(this, allMessagesWithoutState);
  }

};
