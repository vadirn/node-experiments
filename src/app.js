const send = require('./server/send');
const formatError = require('./server/formatError');
const parseRequestUrl = require('./server/parseRequestUrl');
const json = require('./server/json');
const ResourceProvider = require('./server/ResourceProvider');
const setSafetyHeaders = require('./hooks/setSafetyHeaders');
const { Pool } = require('pg');

const DEV = process.env.NODE_ENV === 'development';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
});
pool.on('error', err => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const resourceProvider = new ResourceProvider({ pool });

resourceProvider.addResource('authentication', require('./api/authentication'));
resourceProvider.addResource('users', require('./api/users'));
resourceProvider.addResource('visits', require('./api/visits'));

resourceProvider.addBeforeHook('users', 'all', require('./hooks/checkAuthentication'));

module.exports = async function app(req, res) {
  const { url, method } = req;
  const { resource, id, query } = parseRequestUrl(url);

  let hooks = [...resourceProvider.getHooks({ method, resource, id }), setSafetyHeaders];
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

  if (DEV) {
    console.group(req.method, req.url);
    console.log(JSON.stringify({ id, query, data, body }, null, 2));
    console.group();
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

  if (DEV) {
    console.groupEnd();
    console.groupEnd();
    console.log('Response', statusCode);
  }

  send(res, statusCode, body);
};
