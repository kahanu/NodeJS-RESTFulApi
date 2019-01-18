var _data = require("../../data");
var helpers = require("../../helpers");

var orderRoutes = {};
orderRoutes._orders = {};

orderRoutes._orders.get = function(data, cb) {
    cb(200, { 'message': 'Orders work!' });
};

orderRoutes.orders = function(data, cb) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    orderRoutes._orders[data.method](data, cb);
  } else {
    cb(405);
  }
};

module.exports = orderRoutes;