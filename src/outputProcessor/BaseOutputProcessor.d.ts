/**
 * Gives the functions and variables available for use when specifying a custom output processor.
 * i.e. Allows use of `this.writeSpecChunk` without ts warning/error.
 * 
 * @example
 * ```
 * import { type AllMessages } from 'cypress-terminal-report/src/installLogsPrinter'
 * import { type BaseOutputProcessor } from 'cypress-terminal-report/src/outputProcessor/BaseOutputProcessor'
 * 
 * ...
 *
 * outputTarget: {
 *     'custom|cts': function outputProcessor(this: BaseOutputProcessor, messages: AllMessages){ <custom output processor function> }                
 * }
 * ```
 */
export class BaseOutputProcessor {
  constructor(file: string);

  size: number;
  atChunk: number;
  initialContent: string;
  chunkSeparator: string;

  /**
   * @returns `this.file`
   */
  getTarget(): string;
  /**
   * Unlink file on initialize to start clean.
   * This is required for custom output processors provided as config to be able to define custom initial content.
   */
  initialize(): void;
  prepareForWrite(): void;
  writeSpecChunk(spec: string, chunk: string, pos?: number): void;
  replaceSpecChunk(spec: string, chunk: string): void;
  appendSeparator(pos: number): void;
  /**
   * @returns data buffer length
   */
  writeAtPosition(data: string, pos: number): number;
}



