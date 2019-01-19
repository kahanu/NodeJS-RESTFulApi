

var cartRoutes = {};
cartRoutes._cart = {};

cartRoutes._cart.get = function(data, cb) {

};

cartRoutes._cart.post = function(data, cb) {

};

cartRoutes._cart.put = function(data, cb) {

};

cartRoutes._cart.delete = function(data, cb) {

};

cartRoutes.cart = function(data, cb) {
    var acceptableMethods = ["post", "get", "put", "delete"];
    if (acceptableMethods.indexOf(data.method) > -1) {
        cartRoutes._cart[data.method](data, cb);
    } else {
      cb(405);
    }
};

module.exports = cartRoutes;