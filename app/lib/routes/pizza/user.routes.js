var _data = require("../../data");
var helpers = require("../../helpers");

var userRoutes = {};
userRoutes._users = {};

userRoutes._users.get = function(data, cb) {
  _data.read("pizza/menu", "menu", function(err, data) {
    if (!err && data) {
      cb(200, data);
    } else {
      cb(404);
    }
  });
};

userRoutes._users.post = function(data, cb) {
  var firstName = typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var email = typeof data.payload.email === "string" && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var address = typeof data.payload.address === "string" && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof data.payload.tosAgreement === "boolean" && data.payload.tosAgreement === true ? true : false;

  if (firstName && lastName && email && address && password && tosAgreement) {
    _data.read("pizza/users", email, function(err, response) {
      if (err) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            address: address,
            hashedPassword: hashedPassword,
            tosAgreement: true
          };
          _data.create("pizza/users", email, userObject, function(err) {
            if (!err) {
              cb(200);
            } else {
              cb(500, { Error: "Could not save the pizza user object." });
            }
          });
        } else {
          cb(500, { Error: "Could not hash the password." });
        }
      } else {
        cb(400, { Error: "User already exists!" });
      }
    });
    // cb(200, data);
  } else {
    cb(400, { Error: "Missing required fields." });
  }
};

userRoutes._users.put = function(data, cb) {
  var firstName = typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var email = typeof data.payload.email === "string" && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var address = typeof data.payload.address === "string" && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email) {
    if (firstName || lastName || address || password) {
      var tokenRequest = helpers.createTokenRequest(
        data.headers.token,
        sanitizedPhone
      );
      helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
        if (tokenIsValid) {
        }
      });
    } else {
      cb(400, { Error: "Missing optional fields to update." });
    }
  } else {
    cb(400, { Error: "Missing required field (email)." });
  }
};

userRoutes._users.delete = function(data, cb) {};

userRoutes.users = function(data, cb) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    userRoutes._users[data.method](data, cb);
  } else {
    cb(405);
  }
};

module.exports = userRoutes;
