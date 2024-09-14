import BaseOutputProcessor from './BaseOutputProcessor';

export default class CustomOutputProcessor extends BaseOutputProcessor {
  processorCallback: any;

  constructor(file: any, 
    /** @type {import('../installLogsPrinter').CustomOutputProcessorCallback} */  
    processorCallback: any) {
    super(file);
    this.processorCallback = processorCallback;
  }

  write(/** @type {import('../installLogsPrinter').AllMessages} */ allMessages: any) {
    this.processorCallback.call(this, allMessages);
  }
};
