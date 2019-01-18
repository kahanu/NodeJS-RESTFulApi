var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var greetingRoutes = require('./routes/greeting.routes');
var userRoutes = require('./routes/user.routes');
var tokenRoutes = require('./routes/token.routes');
var checksRoutes = require('./routes/checks.routes');
var path = require('path');
var util = require('util');
var debug = util.debuglog('server');

var server = {};

server.httpServer = http.createServer(function(req, res) {
    server.unifiedServer(req, res);
});



server.httpServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '../ssl/server.key')),
    'cert': fs.readFileSync(path.join(__dirname, '../ssl/server.crt'))
};
server.httpsServer = https.createServer(server.httpServerOptions, function(req, res) {
    server.unifiedServer(req, res);
});




server.unifiedServer = function(req, res) {
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
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

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

            if (statusCode === 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            }
        });
    }); 
};

/**
 * Extracted routes to individual files for ease of maintenance.
 */
server.router = {
    'ping': handlers.ping,
    'hello': greetingRoutes.hello,
    'users': userRoutes.users,
    'token': tokenRoutes.tokens,
    'checks': checksRoutes.checks
};

server.init = function() {
    server.httpServer.listen(config.httpPort, function() {
        console.log('\x1b[35m%s\x1b[0m', `Http server listening on port ${config.httpPort}.`);
    });

    server.httpsServer.listen(config.httpsPort, function() {
        console.log('\x1b[36m%s\x1b[0m', `Https server listening on port ${config.httpsPort}.`);
    });
};


module.exports = server;