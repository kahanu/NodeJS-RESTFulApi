var greetingRoute = {};

greetingRoute.hello = function(data, cb) {
  var message = "Pirple";

  if (data.method === "post") {
    var payload = data.payload;
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


module.exports = greetingRoute;
