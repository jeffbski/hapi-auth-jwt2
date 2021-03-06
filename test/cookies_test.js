var test   = require('tape');
var JWT    = require('jsonwebtoken');
var secret = 'NeverShareYourSecret';
var server = require('./basic_server.js');
var cookie_options = '; Max-Age=31536000;'; //' Expires=Mon, 18 Jul 2016 05:29:45 GMT; Secure; HttpOnly';

// var cookie_options = {
//   ttl: 365 * 30 * 7 * 24 * 60 * 60 * 1000, // in the distant future ...
//   encoding: 'none',    // we already used JWT to encode
//   isSecure: true,      // warm & fuzzy feelings
//   isHttpOnly: true,    // prevent client alteration
//   clearInvalid: false, // remove invalid cookies
//   strictHeader: true   // don't allow violations of RFC 6265
// }

test("Attempt to access restricted content using inVALID Cookie Token", function(t) {
  var token = JWT.sign({ id: 123, "name": "Charlie" }, 'badsecret');
  var options = {
    method: "POST",
    url: "/privado",
    headers: { cookie: "token=" + token }
  };
  console.log(options);
  server.inject(options, function(response) {
    t.equal(response.statusCode, 401, "Invalid token should error!");
    t.end();
  });
});

test("Attempt to access restricted content with VALID Token but malformed Cookie", function(t) {
  var token = JWT.sign({ id: 123, "name": "Charlie" }, secret);
  var options = {
    method: "POST",
    url: "/privado",
    headers: { cookie: token }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.statusCode, 400, "Valid Token but inVALID COOKIE should fial!");
    t.end();
  });
});

test("Access restricted content with VALID Token Cookie", function(t) {
  var token = JWT.sign({ id: 123, "name": "Charlie" }, secret);
  var options = {
    method: "POST",
    url: "/privado",
    headers: { cookie: "token=" + token }
  };
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    t.equal(response.statusCode, 200, "VALID COOKIE Token should succeed!");
    t.end();
  });
});

test("Access restricted content with VALID Token Cookie (With Options!)", function(t) {
  var token = JWT.sign({ id: 123, "name": "Charlie" }, secret);
  var options = {
    method: "POST",
    url: "/privado",
    headers: { cookie: "token=" + token + cookie_options }
  };
  // console.log(' - - - - - - - - - - - - - - - OPTIONS:')
  // console.log(options);
  // server.inject lets us similate an http request
  server.inject(options, function(response) {
    // console.log(' - - - - - - - - - - - - - - - response:')
    // console.log(response);
    t.equal(response.statusCode, 200, "VALID COOKIE Token (With Options!) should succeed!");
    t.end();
  });
});

/** Regressions Tests for https://github.com/dwyl/hapi-auth-jwt2/issues/65 **/

// supply valid Token Auth Header but invalid Cookie
// should succeed because Auth Header is first
test("Authorization Header should take precedence over any cookie", function(t) {
  var token = JWT.sign({ id: 123, "name": "Charlie" }, secret);
  var options = {
    method: "POST",
    url: "/privado",
    headers: {
      authorization: "Bearer " + token,
      cookie: "token=malformed.token" + cookie_options
    }
  };
  server.inject(options, function(response) {
    // console.log(' - - - - - - - - - - - - - - - response:')
    // console.log(response);
    t.equal(response.statusCode, 200, "Ignores cookie when Auth Header is set");
    t.end();
  });
});

// valid google analytics cookie but invalid auth header token
// see: https://github.com/dwyl/hapi-auth-jwt2/issues/65#issuecomment-124791842
test("Valid Google Analytics cookie should be ignored", function(t) {
  var GA = "gwcm=%7B%22expires%22%3Anull%2C%22clabel%22%3A%22SbNVCILRtFcQwcrE6gM%22%2C%22backoff%22%3A1437241242%7D; _ga=GA1.2.1363734468.1432273334";
  var token = JWT.sign({ id: 123, "name": "Charlie" }, secret);
  var options = {
    method: "POST",
    url: "/privado",
    headers: {
      authorization: "Bearer " + token,
      cookie: GA
    }
  };
  server.inject(options, function(response) {
    t.equal(response.statusCode, 200, "Ignores Google Analytics Cookie");
    t.end();
  });
});

test("Valid Google Analytics cookie should be ignored (BAD Header Token)", function(t) {
  var GA = "gwcm=%7B%22expires%22%3Anull%2C%22clabel%22%3A%22SbNVCILRtFcQwcrE6gM%22%2C%22backoff%22%3A1437241242%7D; _ga=GA1.2.1363734468.1432273334";
  var token = JWT.sign({ id: 123, "name": "Charlie" }, 'invalid');
  var options = {
    method: "POST",
    url: "/privado",
    headers: {
      authorization: "Bearer " + token,
      cookie: GA
    }
  };
  server.inject(options, function(response) {
    t.equal(response.statusCode, 401, "Ignores GA but Invalid Auth Header still rejected");
    t.end();
  });
});

// Supply a VALID Token in Cookie A-N-D valid GA in Cookie!!
test("Valid Google Analytics cookie should be ignored (BAD Header Token)", function(t) {
  var GA = "gwcm=%7B%22expires%22%3Anull%2C%22clabel%22%3A%22SbNVCILRtFcQwcrE6gM%22%2C%22backoff%22%3A1437241242%7D; _ga=GA1.2.1363734468.1432273334";
  var token = JWT.sign({ id: 123, "name": "Charlie" }, secret);
  var options = {
    method: "POST",
    url: "/privado",
    headers: {
      cookie: "token=" + token + '; ' + GA
    }
  };
  server.inject(options, function(response) {
    t.equal(response.statusCode, 200, "Valid Cookie Token Succeeds (Ignores GA)");
    t.end();
  });
});
