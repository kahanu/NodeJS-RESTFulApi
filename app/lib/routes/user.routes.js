var _data = require('../data');
var helpers = require('../helpers');

/**
 * Users private container
 */
var userRoutes = {};
userRoutes._users = {};

// @TODO: authenticate user
userRoutes._users.get = function(data, cb) {
    var phone = typeof(data.queryString.phone) === 'string' && data.queryString.phone.trim().length === 10 ? data.queryString.phone : false;
    if (phone) {

        var tokenRequest = helpers.createTokenRequest(data.headers.token, data.queryString.phone);
        helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read('users', phone, function(err, response) {
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
        cb(400, { 'Error': 'Phone number is missing.' });
    }
};

userRoutes._users.post = function(data, cb) {
  var sanitizedPhone = helpers.sanitizePhone(data.payload.phone);
  if (!sanitizedPhone) { return cb(500, { 'Error': 'Phone number is missing.' }); }

    var firstName = typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof sanitizedPhone === "string" && sanitizedPhone.length === 10 ? sanitizedPhone : false;
    var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof data.payload.tosAgreement === "boolean" && data.payload.tosAgreement === true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read("users", phone, function(err, data) {
      if (err) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: sanitizedPhone,
            hashedPassword: hashedPassword,
            tosAgreement: true
          };
          _data.create("users", phone, userObject, function(err) {
            if (!err) {
              cb(200);
            } else {
              cb(500, { Error: "Could not save the user object." });
            }
          });
        } else {
          cb(500, { Error: "Could not hash the password." });
        }
      } else {
        cb(400, { Error: "User with that phone already exists." });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields." });
  }
};

// @TODO - authenticate user
userRoutes._users.put = function(data, cb) {
    // required
    var sanitizedPhone = helpers.sanitizePhone(data.payload.phone);
    if (!sanitizedPhone) { return cb(500, { 'Error': 'Phone number is missing.' }); }
  
    var phone = typeof sanitizedPhone === "string" && sanitizedPhone.length === 10 ? sanitizedPhone : false;

    // optional
    var firstName = typeof data.payload.firstName === "string" && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof data.payload.lastName === "string" && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        if (firstName || lastName || password) {
            var tokenRequest = helpers.createTokenRequest(data.headers.token, sanitizedPhone);
            helpers.verifyToken(tokenRequest, _data, function (tokenIsValid) {
                if (tokenIsValid) {
                    _data.read('users', phone, function (err, userData) {
                        if (!err && userData) {
                            if (firstName) { userData.firstName = firstName; }
                            if (lastName) { userData.lastName = lastName; }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }

                            _data.update('users', phone, userData, function (err) {
                                if (!err) {
                                    cb(200);
                                } else {
                                    cb(500, { 'Error': 'Could not update user.' });
                                }
                            });
                        } else {
                            cb(400, { 'Error': 'User does not exist.' });
                        }
                    });
                } else {
                    cb(403);
                }
            });
        } else {
            cb(400, { 'Error': 'Missing optional fields to update.' });
        }
    } else {
        cb(400, { 'Error': 'Missing required field (Phone).'});
    }
};

// @TODO - authenticate user
userRoutes._users.delete = function(data, cb) {
    var phone = typeof(data.queryString.phone) === 'string' && data.queryString.phone.trim().length === 10 ? data.queryString.phone : false;
    if (phone) {
        var tokenRequest = helpers.createTokenRequest(data.headers.token, phone);
        helpers.verifyToken(tokenRequest, _data, function (tokenIsValid) {
            if (tokenIsValid) {
                _data.read('users', phone, function (err, userData) {
                    if (!err && userData) {
                        _data.delete('users', phone, function (err) {
                            if (!err) {
                                var userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];
                                var checksToDelete = userChecks.length;
                                if (checksToDelete > 0) {
                                    var checksDeleted = 0;
                                    var deletionErrors = false;
                                    userChecks.forEach(item => {
                                        _data.delete('checks', item, function(err) {
                                            if(err) deletionErrors = true;
                                            checksDeleted++;
                                            if (checksDeleted === checksToDelete) {
                                                if (!deletionErrors) {
                                                    cb(200);
                                                } else {
                                                    cb(500, { 'Error': 'Errors attempting to delete user checks.' });
                                                }
                                            } 
                                        });
                                    });
                                } else {
                                    cb(200);    
                                }
                            } else {
                                cb(500, { 'Error': 'Could not delete the user.' });
                            }
                        });
                    } else {
                        cb(400, { 'Error': 'Could not find the user.' });
                    }
                });
            } else {
                cb(403);
            }
        });
    } else {
        cb(400, { 'Error': 'Phone number is missing.' });
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