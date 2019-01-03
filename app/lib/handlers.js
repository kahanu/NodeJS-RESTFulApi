
var handlers = {};


//#region Default routes

handlers.ping = function(data, cb) {
  cb(200, { message: "Still alive!" });
};

handlers.notFound = function(data, cb) {
  cb(404);
};

//#endregion

module.exports = handlers;
