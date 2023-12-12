/**
 * Gives the functions and variables available for use when specifying a custom output processor.
 * i.e. Allows use of `this.writeSpecChunk` without ts warning/error.
 * 
 * @example
 * ```
 * import { type AllMessages } from 'cypress-terminal-report/src/installLogsPrinter'
 * import type BaseOutputProcessor from 'cypress-terminal-report/src/outputProcessor/BaseOutputProcessor'
 * 
 * ...
 *
 * outputTarget: {
 *     'custom|cts': function outputProcessor(this: BaseOutputProcessor, messages: AllMessages){ <custom output processor function> }                
 * }
 * ```
 */
 declare class BaseOutputProcessor {
  constructor(file: string);

  /**
   * Current char size of the output file.
   */
  size: number;
  /**
   * The count of the chunk to be written.
   */
  atChunk: number;
  /**
   * The initial content of the file. Defaults to `''`. Set this before the first chunk write in order for it to work.
   */
  initialContent: string;
  /**
   * Chunk separator string. Defaults to `''`. This string will be written between each chunk.
   * If you need a special separator between chunks, use this as it is internally handled to properly write and replace the chunks.
   */
  chunkSeparator: string;

  /**
   * Unlinks file to initialize. This is required for custom output processors provided as config to be able to define custom initial content.
   */
  initialize(): void;
  /**
   * Writes a chunk of data in the output file.
   */
  writeSpecChunk(spec: string, chunk: string, pos?: number): void;
}

export = BaseOutputProcessor;



