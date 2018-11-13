const contentType = require('content-type');
const getRawBody = require('raw-body');

module.exports = async function json(req, options = {}) {
  let { limit, encoding } = options;

  const requestType = req.headers['content-type'] || 'text/plain';
  const requestLength = req.headers['content-length'];

  if (encoding === undefined) {
    encoding = contentType.parse(requestType).parameters.charset;
  }

  return getRawBody(req, { limit, length: requestLength, encoding })
    .then(buf => {
      const data = buf.toString(encoding);
      if (data) {
        return JSON.parse(data);
      }
      return data;
    })
    .catch(err => {
      throw err;
    });
};
