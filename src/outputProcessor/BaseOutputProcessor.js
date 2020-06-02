const fs = require('fs');
const path = require('path');

const CtrError = require('../CtrError');

module.exports = class BaseOutputProcessor {

  constructor(file) {
    this.file = file;
    this.atChunk = 0;
    this.size = 0;
  }

  prepare() {
    const basePath = path.dirname(this.file);
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    fs.writeFileSync(this.file, '');
  }

  writeChunk(chunk, pos = null) {
    if (typeof chunk !== 'string') {
      throw new CtrError(`cypress-terminal-report: Expected string for write chunk on log file.`);
    }

    let fd = fs.openSync(this.file, 'r+');
    let data = Buffer.from(chunk, 'utf8');

    if (pos === null) {
      pos = this.size;
    }
    else if (pos < 0) {
      pos = Math.min(this.size, Math.max(0, this.size + pos));
    }
    else {
      pos = Math.max(this.size, pos);
    }

    if (pos !== this.size) {
      let buffer = Buffer.alloc(this.size - pos);
      fs.readSync(fd, buffer, 0, buffer.length, pos);
      data = Buffer.concat([data, buffer]);
    }

    fs.writeSync(fd, data, 0, data.length, pos);
    fs.closeSync(fd);

    this.size += chunk.length;
    this.atChunk++;
  }

};
