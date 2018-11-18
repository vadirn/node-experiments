const crypto = require('crypto');
const Boom = require('boom');
const parseDate = require('date-fns/parse');
const differenceInMilliseconds = require('date-fns/difference_in_milliseconds');

const TOKEN_TYPES = {
  PERSISTENT: 0,
  DISPOSABLE: 1,
};

const TOKEN_TTLS = {
  PERSISTENT: 30 * 24 * 60 * 60 * 1000, // 30 days
  // PERSISTENT: 30 * 1000, // 30 sec
  DISPOSABLE: 30 * 60 * 1000, // 30 minutes
  // DISPOSABLE: 30 * 1000, // 30 sec
};

function tokenTypeToString(number) {
  switch (number) {
    case 0:
      return 'PERSISTENT';
    case 1:
      return 'DISPOSABLE';
    default:
      throw new Error(`No such token type [${number}]`);
  }
}

async function generateToken() {
  const buffer = await new Promise((resolve, reject) => {
    crypto.randomBytes(48, (ex, buffer) => {
      if (ex) {
        reject('error generating token');
      }
      resolve(buffer);
    });
  });
  const token = buffer.toString('hex');
  return token;
}

async function get(options = {}) {
  const { id } = options;
  if (!id) {
    throw Boom.badRequest();
  }
  // get the client
  const client = await this.pool.connect();
  try {
    const tokenQuery = await client.query(
      'SELECT authentication.*, users.email FROM authentication INNER JOIN users ON authentication.created_by = users.id WHERE authentication.token = $1',
      [id]
    );
    const token = tokenQuery.rows[0];
    if (!token) {
      throw Boom.forbidden();
    }
    // check validity
    // figure out TTL
    const tokenType = tokenTypeToString(token.type);
    const ttl = TOKEN_TTLS[tokenType];
    // figure out if token expired or not
    const sinceCreatedAt = differenceInMilliseconds(new Date(), parseDate(token.created_at));
    if (sinceCreatedAt > ttl) {
      throw Boom.forbidden();
    }
    // if not yet expired, update token value, its type and created_at
    const tokenValue = await generateToken();
    const updateTokenQuery = await client.query(
      'UPDATE authentication SET token = $1, type = $2, created_at = $3 WHERE id = $4 RETURNING token',
      [tokenValue, TOKEN_TYPES.PERSISTENT, new Date(), token.id]
    );
    return { ...updateTokenQuery.rows[0], email: token.email };
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}

async function create(options = {}) {
  const { data = {} } = options;
  if (!data.email) {
    throw Boom.badRequest();
  }
  // get the client
  const client = await this.pool.connect();
  try {
    // try to find a user, create if not found
    const insertUsersQuery = await client.query(
      'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email=$1 RETURNING id;',
      [data.email]
    );
    const userId = insertUsersQuery.rows[0].id;
    // create a new login token
    const tokenValue = await generateToken();
    // remove pending tokens
    await client.query('DELETE FROM authentication WHERE type = $1 AND created_by = $2', [
      TOKEN_TYPES.DISPOSABLE,
      userId,
    ]);
    // crate a new one
    const insertTokenQuery = await client.query(
      'INSERT INTO authentication (token, type, created_by) VALUES ($1, $2, $3) RETURNING id, token, created_by',
      [tokenValue, TOKEN_TYPES.DISPOSABLE, userId]
    );
    const token = insertTokenQuery.rows[0];
    return { token: token.token };
  } catch (err) {
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  get,
  create,
};
