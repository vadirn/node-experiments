module.exports = function setSafetyHeaders(req, res) {
  // https://helmetjs.github.io/docs/dns-prefetch-control/
  // "X-DNS-Prefetch-Control: off"
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // https://helmetjs.github.io/docs/frameguard/
  // "X-Frame-Options: DENY"
  res.setHeader('X-Frame-Options', 'DENY');

  // https://helmetjs.github.io/docs/dont-sniff-mimetype/
  // "X-Content-Type-Options: nosniff"
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // https://helmetjs.github.io/docs/xss-filter/
  // "X-XSS-Protection: 1; mode=block"
  res.setHeader('X-XSS-Protection', '1; mode=block');
};
