const parseQuery = require('./parseQuery');

module.exports = function parseRequestUrl(url) {
  const [path, querystring] = url.split('?');
  const query = parseQuery(querystring);
  const [resource, id] = path.split('/').filter(pathComponent => pathComponent.length > 0);
  return {
    resource,
    id,
    query,
  };
};
