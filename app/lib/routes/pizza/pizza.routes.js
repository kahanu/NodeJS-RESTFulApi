var userRoutes = require("./user.routes");
var menuRoutes = require('./menu.routes');
var orderRoutes = require('./orders.routes');
var cartRoutes = require('./cart.routes');

var pizzaRoutes = {};
// pizzaRoutes.users = {};
// pizzaRoutes.menu = {};
// pizzaRoutes.orders = {};

pizzaRoutes.users = function(data, cb) {
  userRoutes.users(data, cb);
};

pizzaRoutes.menu = function(data, cb) {
    menuRoutes.menus(data, cb);
};

pizzaRoutes.orders = function(data, cb) {
    orderRoutes.orders(data, cb);
};

pizzaRoutes.cart = function(data, cb) {
    cartRoutes.cart(data, cb);
}

module.exports = pizzaRoutes;
