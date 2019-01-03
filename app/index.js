var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');
var greetingRoutes = require('./lib/routes/greeting.routes');
var userRoutes = require('./lib/routes/user.routes');
var tokenRoutes = require('./lib/routes/token.routes');

var httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function() {
    console.log(`Http server listening on port ${config.httpPort}.`);
});

var httpServerOptions = {
    'key': fs.readFileSync('./ssl/server.key'),
    'cert': fs.readFileSync('./ssl/server.crt')
};
var httpsServer = https.createServer(httpServerOptions, function(req, res) {
    unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, function() {
    console.log(`Https server listening on port ${config.httpsPort}.`);
});


var unifiedServer = function(req, res) {
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    var method = req.method.toLowerCase();
    var queryString = parsedUrl.query;
    var headers = req.headers;
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function() {
        buffer += decoder.end();
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        var data = {
            'path': trimmedPath,
            'method': method,
            'queryString': queryString,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        chosenHandler(data, function(statusCode, payload) {
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;
            payload = typeof(payload) === 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            console.log('Returning response: ', statusCode, payloadString);
        });
    }); 
};

/**
 * Extracted routes to individual files for ease of maintenance.
 */
var router = {
    'ping': handlers.ping,
    'hello': greetingRoutes.hello,
    'users': userRoutes.users,
    'token': tokenRoutes.tokens
};

