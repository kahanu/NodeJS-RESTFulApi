var _data = require("../../data");
var helpers = require("../../helpers");

var menuRoutes = {};
menuRoutes._menus = {};

menuRoutes._menus.get = function(data, cb) {
    var tokenRequest = helpers.createTokenRequest(data.headers.token, data.queryString.email);
  helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
    if (tokenIsValid) {
      _data.read("pizza/menu", "menu", function(err, menuData) {
        if (!err && menuData) {
          cb(200, menuData);
        } else {
          cb(404);
        }
      });
    } else {
      cb(403);
    }
  });
};

menuRoutes.menus = function(data, cb) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    menuRoutes._menus[data.method](data, cb);
  } else {
    cb(405);
  }
};

module.exports = menuRoutes;
