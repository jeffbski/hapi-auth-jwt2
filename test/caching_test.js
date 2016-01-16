var test   = require('tape');
var Hapi   = require('hapi');
var JWT    = require('jsonwebtoken');
// var secret = 'NeverShareYourSecret';

var server = require('./caching_server'); // test server which in turn loads our module

test("caching - invalid config - checkCache but not setInCache", function (t) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function (err) {
    t.ifError(err, 'No error registering hapi-auth-jwt2 plugin');

    t.throws(function () {
      server.auth.strategy('jwt', 'jwt', {
        key: 'secret',
        validateFunc: function (decoded, request, callback) { },
        verifyOptions: {algorithms: ['HS256']},
        checkCache: function (token) { }
      });
    },
    /both/,
    'errors when both are not defined');

    t.end();
  });
});

test("caching - invalid config - setInCache but not checkCache", function (t) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function (err) {
    t.ifError(err, 'No error registering hapi-auth-jwt2 plugin');

    t.throws(function () {
      server.auth.strategy('jwt', 'jwt', {
        key: 'secret',
        validateFunc: function (decoded, request, callback) { },
        verifyOptions: {algorithms: ['HS256']},
        setInCache: function (token, value) { }
      });
    },
    /both/,
    'errors when both are not defined');

    t.end();
  });

});

test("caching - simulate error condition", function(t) {
  var payload = { id: 123, "name": "Charlie", error: true }
  var token = JWT.sign(payload, 'SecretDoesNOTGetVerified');
  var options = {
    method: "GET",
    url: "/required",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.statusCode, 500, "customVerify force error");
    t.end();
  });
});

test("caching - with fail condition", function(t) {
  var payload = { id: 123, "name": "Charlie", some_property: false }
  var token = JWT.sign(payload, 'SecretDoesNOTGetVerified');
  var options = {
    method: "GET",
    url: "/required",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.statusCode, 401, "GET /required with customVerify rejected");
    t.end();
  });
});

test("caching - Verification in 'try' mode ", function(t) {
  var payload = { id: 123, "name": "Charlie", some_property: true }
  var token = JWT.sign(payload, 'SecretDoesNOTGetVerified');
  var options = {
    method: "GET",
    url: "/try",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.result.id, payload.id, 'Decoded JWT returned by handler');
    t.equal(response.statusCode, 200, "GET /try bypasses verification");
    t.end();
  });
});

test("caching - Verification in 'optional' mode ", function(t) {
  var payload = { id: 234, "name": "Oscar", some_property: true  }
  var token = JWT.sign(payload, 'SecretDoesNOTGetVerified');
  var options = {
    method: "GET",
    url: "/optional",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.result.id, payload.id, 'Decoded JWT returned by handler');
    t.equal(response.statusCode, 200, "GET /optional bypasses verification");
    t.end();
  });
});

test("caching - Verification in 'required' mode ", function(t) {
  var payload = { id: 345, "name": "Romeo", some_property: true }
  var token = JWT.sign(payload, 'AnyStringWillDo');
  var options = {
    method: "GET",
    url: "/required",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    // console.log(response.result);
    var credentials = JSON.parse(JSON.stringify(response.result));
    t.equal(credentials.id, payload.id, 'Decoded JWT is available in handler');
    t.equal(response.statusCode, 200, "GET /required bypasses verification");
    t.end();
  });
});

/* second pass cached responses */


test("caching 2nd pass - simulate error condition", function(t) {
  var payload = { id: 123, "name": "Charlie", error: true }
  var token = JWT.sign(payload, 'SecretDoesNOTGetVerified');
  var options = {
    method: "GET",
    url: "/required",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.statusCode, 500, "customVerify force error");
    t.end();
  });
});

test("caching 2nd pass - with fail condition", function(t) {
  var payload = { id: 123, "name": "Charlie", some_property: false }
  var token = JWT.sign(payload, 'SecretDoesNOTGetVerified');
  var options = {
    method: "GET",
    url: "/required",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.statusCode, 401, "GET /required with customVerify rejected");
    t.end();
  });
});

test("caching 2nd pass - Verification in 'try' mode ", function(t) {
  var payload = { id: 123, "name": "Charlie", some_property: true }
  var token = JWT.sign(payload, 'SecretDoesNOTGetVerified');
  var options = {
    method: "GET",
    url: "/try",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.result.id, payload.id, 'Decoded JWT returned by handler');
    t.equal(response.statusCode, 200, "GET /try bypasses verification");
    t.end();
  });
});

test("caching 2nd pass - Verification in 'optional' mode ", function(t) {
  var payload = { id: 234, "name": "Oscar", some_property: true  }
  var token = JWT.sign(payload, 'SecretDoesNOTGetVerified');
  var options = {
    method: "GET",
    url: "/optional",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.result.id, payload.id, 'Decoded JWT returned by handler');
    t.equal(response.statusCode, 200, "GET /optional bypasses verification");
    t.end();
  });
});

test("caching 2nd pass - Verification in 'required' mode ", function(t) {
  var payload = { id: 345, "name": "Romeo", some_property: true }
  var token = JWT.sign(payload, 'AnyStringWillDo');
  var options = {
    method: "GET",
    url: "/required",
    headers: { authorization: "Bearer " + token  }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    // console.log(response.result);
    var credentials = JSON.parse(JSON.stringify(response.result));
    t.equal(credentials.id, payload.id, 'Decoded JWT is available in handler');
    t.equal(response.statusCode, 200, "GET /required bypasses verification");
    t.end();
  });
});
