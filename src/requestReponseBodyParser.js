const PADDING = require('./constants').PADDING;

module.exports = async (body) => {
  if (!body) {
    return 'EMPTY_BODY';
  } else if (typeof body === 'string') {
    return body;
  } else if (typeof body === 'object') {
    if (typeof body.text === 'function') {
      return await body.text();
    }
    const padding = `\n${PADDING.LOG}`;
    return `${JSON.stringify(body, null, 2).replace(/\n/g, padding)}`;
  }
  return 'UNKNOWN_BODY';
};
