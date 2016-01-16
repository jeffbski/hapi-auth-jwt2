var Hapi   = require('hapi');
var secret = 'NeverShareYourSecret';

// would normally use a lru-cache, but for testing simple object will do

var cache = {};

function checkCache(token) {
  return cache[token];
}

function setInCache(token, value) {
  cache[token] = value;
}

// for debug options see: http://hapijs.com/tutorials/logging
var debug;
// debug = { debug: { 'request': ['error', 'uncaught'] } };
debug = { debug: false };
var server = new Hapi.Server(debug);
server.connection();

var sendToken = function(req, reply) {
  return reply(req.auth.token);
};

var privado = function(req, reply) {
  return reply(req.auth.credentials);
};

// defining our own validate function lets us do something
// useful/custom with the decodedToken before reply(ing)
var customVerifyFunc = function (decoded, request, callback) {
  if(decoded.error) {
    return callback(new Error('customVerify fails!'));
  }
  else if (decoded.some_property) {
    return callback(null, true, decoded);
  }
  else {
    return callback(null, false, decoded);
  }
};

server.register(require('../'), function () {

  server.auth.strategy('jwt', 'jwt', {
    checkCache: checkCache,
    setInCache: setInCache,
    verifyFunc: customVerifyFunc // no validateFunc or key required.
  });

  server.route([
    { method: 'GET',  path: '/', handler: sendToken, config: { auth: false } },
    { method: 'GET', path: '/required', handler: privado, config: { auth: { mode: 'required', strategy: 'jwt' } } },
    { method: 'GET', path: '/optional', handler: privado, config: { auth: { mode: 'optional', strategy: 'jwt' } } },
    { method: 'GET', path: '/try', handler: privado, config: { auth: { mode: 'try', strategy: 'jwt' } } }
  ]);

});

module.exports = server;
