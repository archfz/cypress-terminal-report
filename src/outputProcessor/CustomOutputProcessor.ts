import BaseOutputProcessor, {IOutputProcecessor} from './BaseOutputProcessor';
import type {
  AllMessages,
  CustomOutputProcessorCallback,
  PluginOptions,
} from '../installLogsPrinter.types';

export default class CustomOutputProcessor
  extends BaseOutputProcessor
  implements IOutputProcecessor
{
  constructor(
    file: string,
    options: PluginOptions,
    protected processorCallback: CustomOutputProcessorCallback
  ) {
    super(file, options);
  }

  write(allMessages: AllMessages) {
    this.processorCallback.call(this, allMessages);
  }
}
