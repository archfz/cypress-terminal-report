import BaseOutputProcessor, {IOutputProcecessor} from './BaseOutputProcessor';
import type {AllMessages, CustomOutputProcessorCallback} from "../installLogsPrinter.types";

export default class CustomOutputProcessor extends BaseOutputProcessor implements IOutputProcecessor {
  constructor(file: string, protected processorCallback: CustomOutputProcessorCallback) {
    super(file);
  }

  write(allMessages: AllMessages) {
    this.processorCallback.call(this, allMessages);
  }
}
