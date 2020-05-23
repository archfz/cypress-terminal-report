module.exports = async (body) => {
  if (!body) {
    return '<EMPTY>';
  } else if (typeof body === 'string') {
    return body;
  } else if (typeof body === 'object') {
    if (typeof body.text === 'function') {
      return await body.text();
    }
    return `${JSON.stringify(body, null, 2)}`;
  }
  return '<UNKNOWN>';
};
