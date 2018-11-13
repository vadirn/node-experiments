const send = require('./server/send');
const formatError = require('./server/formatError');
const parseRequestUrl = require('./server/parseRequestUrl');
const json = require('./server/json');
const ResourceProvider = require('./server/ResourceProvider');

const resourceProvider = new ResourceProvider();

resourceProvider.addResource('authentication', require('./api/authentication'));

module.exports = async function app(req, res) {
  const { url, method } = req;
  const { resource, id, query } = parseRequestUrl(url);

  let hooks = resourceProvider.getHooks({ method, resource, id });
  let statusCode = 200;
  let body;
  let data;

  try {
    data = await json(req);
  } catch (err) {
    hooks = [];
    const boomError = formatError(err);
    statusCode = boomError.statusCode;
    body = boomError.body;
  }

  while (hooks.length > 0) {
    const currentHook = hooks.pop();
    try {
      body = (await currentHook(req, res, { id, query, data, body })) || body;
    } catch (err) {
      hooks = [];
      const boomError = formatError(err);
      statusCode = boomError.statusCode;
      body = boomError.body;
    }
  }

  send(res, statusCode, body);
};