const Boom = require('boom');

module.exports = async function checkAuthentication(req) {
  const authorizationHeader = req.headers['authorization'];
  if (!authorizationHeader) {
    throw Boom.unauthorized();
  }
  const { token, email } = authorizationHeader
    .split(', ')
    .map(keyValue => {
      const [key, value] = keyValue.split('=');
      return { [key]: value };
    })
    .reduce((accum, iter) => {
      Object.assign(accum, iter);
      return accum;
    }, {});
  try {
    const tokenQuery = await this.query(
      'SELECT authentication.*, users.email FROM authentication INNER JOIN users ON authentication.created_by = users.id WHERE authentication.token = $1',
      [token]
    );
    if (tokenQuery.rows.length === 0 || tokenQuery.rows[0].email !== email) {
      throw Boom.forbidden();
    }
  } catch (err) {
    throw err;
  }
};
