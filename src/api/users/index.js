// const Boom = require('boom');

async function find() {
  try {
    const usersQuery = await this.query('SELECT * FROM users');
    return usersQuery.rows;
  } catch (err) {
    throw err;
  }
}

module.exports = { find };
