import type { CustomOutputProcessorCallback } from "../installLogsPrinter";
import type BaseOutputProcessor  from "./BaseOutputProcessor";

/**
 * Gives the functions and variables available for use when specifying a custom output processor. [More details](https://github.com/archfz/cypress-terminal-report#custom-output-log-processor).
 * 
 * i.e. Allows use of `this.writeSpecChunk` without ts warning/error.
 * 
 * @example
 * ```
 * import type { AllMessages } from 'cypress-terminal-report/src/installLogsPrinter'
 * import type CustomOutputProcessor from 'cypress-terminal-report/src/outputProcessor/CustomOutputProcessor'
 * 
 * ...
 *
 * outputTarget: {
 *     'custom|cts': function outputProcessor(this: CustomOutputProcessor, allMessages: AllMessages){ <custom output processor function> }                
 * }
 * ```
 */
declare class CustomOutputProcessor extends BaseOutputProcessor {
    constructor(file: string, processorCallback: CustomOutputProcessorCallback);
}  

export = CustomOutputProcessor;