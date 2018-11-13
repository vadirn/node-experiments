const path = require('path');
// require path shorthands
global.__api = path.join(__dirname, 'api');
global.__hooks = path.join(__dirname, 'hooks');
global.__server = path.join(__dirname, 'server');

const PORT = process.env.PORT || 5000;

const { createServer } = require('http');
const app = require('./app');

const server = createServer(app);

server.listen(PORT);
