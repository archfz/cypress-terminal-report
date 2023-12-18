/**
 * Base output processor class that the actual output processors extend.
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
   * Writes a chunk of data in the output file.
   */
  writeSpecChunk(spec: string, chunk: string, pos?: number | null): void;
}

export = BaseOutputProcessor;