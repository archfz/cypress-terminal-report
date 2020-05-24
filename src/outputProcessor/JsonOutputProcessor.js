const BaseOutputProcessor = require('./BaseOutputProcessor');

module.exports = class JsonOutputProcessor extends BaseOutputProcessor {

  write(allMessages) {
    let data = {};

    Object.entries(allMessages).forEach(([spec, tests]) => {
      Object.entries(tests).forEach(([test, messages]) => {
        data[spec] = data[spec] || {};
        data[spec][test] = messages.map(([type, message, severity]) => ({
          type: type,
          severity: severity,
          message: message,
        }))
      });
    });

    let chunk = JSON.stringify(data, null, 2);

    if (this.atChunk > 0) {
      chunk = ',\n' + chunk.slice(2, -2);
      this.writeChunk(chunk, -2);
    } else {
      this.writeChunk(chunk);
    }
  }

};
