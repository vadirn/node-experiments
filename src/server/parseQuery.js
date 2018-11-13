module.exports = function parseQuery(querystring = '') {
  const accum = {};
  const keyValuePairs = querystring.split('&').filter(pair => pair.length > 0);
  for (const pair of keyValuePairs) {
    const [key, value] = pair.split('=');
    accum[key] = decodeURIComponent(value) || key;
  }
  return accum;
};
