var _data = require("../../data");

var menuRoutes = {};
menuRoutes._menus = {};

menuRoutes._menus.get = function(data, cb) {
    _data.read('pizza/menu', 'menu', function(err, data) {
        if (!err && data) {
            cb(200, data);
        } else {
            cb(404);
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