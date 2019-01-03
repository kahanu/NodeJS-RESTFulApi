var helpers = require("../helpers");
var _data = require("../data");

var tokenRoutes = {};
tokenRoutes._tokens = {};

tokenRoutes._tokens.get = function(data, cb) {};

tokenRoutes._tokens.post = function(data, cb) {
  var sanitizedPhone = helpers.sanitizePhone(data.payload.phone);
  if (!sanitizedPhone) {
    return cb(500, { Error: "Phone number is missing." });
  }

    var phone = typeof sanitizedPhone === "string" && sanitizedPhone.length === 10 ? sanitizedPhone : false;
    var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone && password) {
    _data.read("users", phone, function(err, userData) {
      if (!err && userData) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // Create token
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var token = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          };

          _data.create('tokens', tokenId, token, function(err) {
            if (!err) {
                cb(200, token);
            } else {
                cb(500, { 'Error': 'Could not create token.' });
            }
          });

        } else {
          // Forbidden - better response.
          // Don't show a hacker more information than is necessary.
          cb(403);
        }
      } else {
        cb(400, { Error: "Could not find the user." });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields." });
  }
};

tokenRoutes._tokens.put = function(data, cb) {};

tokenRoutes._tokens.delete = function(data, cb) {};

tokenRoutes.tokens = function(data, cb) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    tokenRoutes._tokens[data.method](data, cb);
  } else {
    cb(405);
  }
};

module.exports = tokenRoutes;