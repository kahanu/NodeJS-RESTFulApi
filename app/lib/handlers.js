var _data = require("./data");
var helpers = require("./helpers");

var handlers = {};

//#region Users Routes
/**
 * Users private container
 */
handlers._users = {};

handlers._users.get = function(data, cb) {};

handlers._users.post = function(data, cb) {
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
            password: hashedPassword,
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

handlers._users.put = function(data, cb) {};

handlers._users.delete = function(data, cb) {};

handlers.users = function(data, cb) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, cb);
  } else {
    cb(405);
  }
};

//#endregion

//#region Hello route

handlers.hello = function(data, cb) {
  var message = "Pirple";

  if (data.method === "post") {
    var payload = JSON.parse(data.payload);
    if (payload.name) {
      message = payload.name;
    } else {
      message =
        "Pirple! (Hint: create a name property with your name on the request object.)";
    }
  }

  var qs = JSON.parse(JSON.stringify(data.queryString));
  if (data.method === "get" && qs.name) {
    message = qs.name;
  }

  var response = {
    message: `Hello ${message}!`
  };
  cb(200, response);
};

//#endregion

//#region Default routes

handlers.ping = function(data, cb) {
  cb(200, { message: "Still alive!" });
};

handlers.notFound = function(data, cb) {
  cb(404);
};

//#endregion

module.exports = handlers;
