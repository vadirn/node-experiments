const Boom = require('boom');

module.exports = function formatError(err) {
  console.log(err.stack);

  // TODO: format validation errors
  const boomError = Boom.boomify(err);
  const error = boomError.output;
  const data = boomError.data;
  const body = Object.assign({}, error.payload, data && { data });
  return { statusCode: error.statusCode, body };
};
