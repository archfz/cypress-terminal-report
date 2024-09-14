import * as fs from 'fs';
import * as path from 'path';
import CtrError from '../CtrError';
import {AllMessages} from "../installLogsPrinter.types";

export interface IOutputProcecessor {
  initialize(): void;
  getTarget(): string;
  getSpentTime(): number;
  write(allMessages: AllMessages): void;
}

export default class BaseOutputProcessor {
  protected atChunk: any;
  protected chunkSeparator: string;
  protected file: any;
  protected initialContent: any;
  protected size: any;
  protected specChunksWritten: any;
  protected writeSpendTime: any;

  constructor(file: any) {
    this.file = file;
    this.initialContent = '';
    this.chunkSeparator = '';
  }

  getTarget() {
    return this.file;
  }

  getSpentTime() {
    return this.writeSpendTime;
  }

  initialize() {
    // Unlink file on initialize to start clean. Also this is required for custom
    // output processors provided as config to be able to define custom initial
    // content.
    if (fs.existsSync(this.file)) {
      fs.unlinkSync(this.file);
    }
  }

  prepareForWrite() {
    this.atChunk = 0;
    this.specChunksWritten = {};
    this.size = this.initialContent.length;
    this.writeSpendTime = 0;

    const basePath = path.dirname(this.file);
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, {recursive: true});
    }

    fs.writeFileSync(this.file, this.initialContent);
  }

  /** @type { import('./BaseOutputProcessor')['writeSpecChunk']} */
  writeSpecChunk(spec: any, chunk: any, pos: number | null = null) {
    const startTime = new Date().getTime();

    if (typeof chunk !== 'string') {
      throw new CtrError(`cypress-terminal-report: Expected string for write chunk on log file.`);
    }

    if (!fs.existsSync(this.file)) {
      this.prepareForWrite();
    }

    if (this.hasSpecChunkWritten(spec)) {
      this.replaceSpecChunk(spec, chunk);
    } else {
      if (this.atChunk > 0) {
        this.appendSeparator(pos);
      }

      pos = this.getAbsolutePositionFromRelative(pos);
      let writtenLength = this.writeAtPosition(chunk, pos);

      this.specChunksWritten[spec] = [pos, pos + writtenLength];
      this.atChunk++;
    }

    this.writeSpendTime += new Date().getTime() - startTime;
  }

  replaceSpecChunk(spec: any, chunk: any) {
    let oldChunkStart = this.specChunksWritten[spec][0];
    let oldChunkEnd = this.specChunksWritten[spec][1];

    let fd = fs.openSync(this.file, 'r+');
    // @ts-expect-error TS(2552): Cannot find name 'Buffer'. Did you mean 'buffer'?
    let buffer = Buffer.alloc(this.size - oldChunkEnd, null, 'utf-8');
    fs.readSync(fd, buffer, 0, buffer.length, oldChunkEnd);

    let chunkBuffer = Buffer.from(chunk, 'utf8');
    let finalBuffer = Buffer.concat([chunkBuffer, buffer]);


    fs.writeSync(fd, finalBuffer, 0, finalBuffer.length, oldChunkStart);
    fs.closeSync(fd);

    this.specChunksWritten[spec] = [oldChunkStart, oldChunkStart + chunkBuffer.length];

    let sizeDiff = chunkBuffer.length - (oldChunkEnd - oldChunkStart);
    this.size += sizeDiff;

    if (0 > sizeDiff) {
      fs.truncateSync(this.file, this.size);
    }
  }

  appendSeparator(pos: any) {
    this.writeAtPosition(this.chunkSeparator, pos)
  }

  writeAtPosition(data: any, pos: any) {
    let dataBuffer = new Buffer(data, 'utf-8');
    let finalBuffer = dataBuffer;
    let fd = fs.openSync(this.file, 'r+');
    pos = this.getAbsolutePositionFromRelative(pos);

    if (pos !== this.size) {
      let buffer = Buffer.alloc(this.size - pos);
      fs.readSync(fd, buffer, 0, buffer.length, pos);
      finalBuffer = Buffer.concat([dataBuffer, buffer]);
    }

    fs.writeSync(fd, finalBuffer, 0, finalBuffer.length, pos);
    fs.closeSync(fd);
    this.size += dataBuffer.length;

    return dataBuffer.length;
  }

  getAbsolutePositionFromRelative(pos: any): number {
    if (pos === null) {
      return this.size;
    } else if (pos < 0) {
      return Math.min(this.size, Math.max(0, this.size + pos));
    }

    return Math.min(this.size, pos);
  }

  hasSpecChunkWritten(spec: any) {
    return !!this.specChunksWritten[spec];
  }
};
