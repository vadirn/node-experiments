const formatError = require('./formatError');

module.exports = function send(res, statusCode = 200, body = '') {
  res.statusCode = statusCode;
  let str = '';

  try {
    str = JSON.stringify(body);
  } catch (err) {
    console.log(err);

    const { status, body } = formatError(err);
    str = JSON.stringify(body);

    res.status = status;
  }

  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  res.setHeader('Content-Length', Buffer.byteLength(str));
  res.end(str);
};
