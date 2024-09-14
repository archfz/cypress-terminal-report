import BaseOutputProcessor, {IOutputProcecessor} from './BaseOutputProcessor';
import {AllMessages} from "../installLogsPrinter.types";

export default class CustomOutputProcessor extends BaseOutputProcessor implements IOutputProcecessor {
  processorCallback: any;

  constructor(file: any,
    /** @type {import('../installLogsPrinter').CustomOutputProcessorCallback} */
    processorCallback: any) {
    super(file);
    this.processorCallback = processorCallback;
  }

  write(allMessages: AllMessages) {
    this.processorCallback.call(this, allMessages);
  }
};
