import { AllMessages } from "../installLogsPrinter";
import BaseOutputProcessor  from "./BaseOutputProcessor";

/**
 * Custom output processor. [More details](https://github.com/archfz/cypress-terminal-report#custom-output-log-processor).
 * 
 * @example
 * ```
 * import CustomOutputProcessor from 'cypress-terminal-report/src/outputProcessor/CustomOutputProcessor'
 *
 * const processor = new CustomOutputProcessor('output.html', 
 *     function outputProcessor(this: BaseOutputProcessor, messages: AllMessages){ 
 *         <custom output processor function> 
 *     }
 * )
 * processor.initialize()
 * processor.write( <all messages> )
 * ```
 */
declare class CustomOutputProcessor extends BaseOutputProcessor {
    constructor(file: string, processorCallback: ((allMessages: AllMessages) => void));

    /**
     * Calls `this.processorCallback`
     */
    write(allMessages: AllMessages): void;
}  

export = CustomOutputProcessor;
  
  
  