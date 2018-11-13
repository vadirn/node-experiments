const boom = require('boom');

module.exports = function formatError(err) {
  console.log(err);
  // TODO: format validation errors
  const boomError = boom.boomify(err);
  const error = boomError.output;
  const data = boomError.data;
  const body = Object.assign({}, error.payload, data && { data });
  return { statusCode: error.statusCode, body };
};
