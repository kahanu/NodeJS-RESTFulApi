var _data = require("../../data");
var helpers = require("../../helpers");

var userRoutes = {};
userRoutes._users = {};

userRoutes._users.get = function(data, cb) {
    cb(200, { 'message': 'Users work!' });
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
