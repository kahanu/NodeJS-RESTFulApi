var _data = require("../../data");
var helpers = require("../../helpers");

var userRoutes = {};
userRoutes._users = {};
var _dir = 'pizza/users';

userRoutes._users.get = function(data, cb) {
  var email = typeof data.queryString.email === 'string' && data.queryString.email.trim().length > 0 ? data.queryString.email.trim() : false;
  if (email) {
    var tokenRequest = helpers.createTokenRequest(data.headers.token, data.queryString.email.trim());
        helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
            if (tokenIsValid) {

                _data.read(_dir, email, function(err, response) {
                    if (!err && response) {
                        delete response.hashedPassword;
                        cb(200, response);
                    } else {
                        cb(404);
                    }
                });        
            } else {
                cb(403);
            }
        });
  } else {
    cb(400, { Error: 'Email address is missing.' });
  }
};

userRoutes._users.post = function(data, cb) {
  var firstName = typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var email = typeof data.payload.email === "string" && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var address = typeof data.payload.address === "string" && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof data.payload.tosAgreement === "boolean" && data.payload.tosAgreement === true ? true : false;

  if (firstName && lastName && email && address && password && tosAgreement) {
    _data.read(_dir, email, function(err, response) {
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
          _data.create(_dir, email, userObject, function(err) {
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
        email
      );
      helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
        if (tokenIsValid) {
          _data.read(_dir, email, function(err, userData) {
            if (!err && userData) {
              if (firstName) { userData.firstName = firstName; }
              if (lastName) { userData.lastName = lastName; }
              if (address) { userData.address = address; }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }

              _data.update(_dir, email, userData, function(err) {
                if (!err) {
                  cb(200);
                } else {
                  cb(500, { Error: 'Could not update the pizza user.' });
                }
              });
            } else {
              cb(400, { Error: 'Pizza user does not exist.' });
            }
          });
        } else {
          cb(403);
        }
      });
    } else {
      cb(400, { Error: "Missing optional fields to update." });
    }
  } else {
    cb(400, { Error: "Missing required field (email)." });
  }
};

userRoutes._users.delete = function(data, cb) {
  var email = typeof data.queryString.email === 'string' && data.queryString.email.trim().length > 0 ? data.queryString.email : false;
  if (email) {
    var tokenRequest = helpers.createTokenRequest(data.headers.token, email);
    helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.read(_dir, email, function(err, userData) {
          if (!err && userData) {
            _data.delete(_dir, email, function(err) {
              if (!err) {
                // TODO: delete the orders for the user
                cb(200);
              } else {
                cb(500, { Error: 'Could not delete the pizza user.' });
              }
            });
          } else {
            cb(400, { Error: 'Could not find the pizza user.' });
          }
        });
      } else {
        cb(403);
      }
    });
  } else {
    cb(400, { Error: 'Email address is missing.' });
  }
};

userRoutes.users = function(data, cb) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    userRoutes._users[data.method](data, cb);
  } else {
    cb(405);
  }
};

module.exports = userRoutes;
