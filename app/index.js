var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

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
            'payload': buffer
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


var handlers = {};

handlers.hello = function(data, cb) {
    var message = 'Pirple';

    if (data.method === 'post') {
        var payload = JSON.parse(data.payload);
        if (payload.name) {
            message = payload.name;
        } else {
            message = 'Pirple! (Hint: create a name property with your name on the request object.)';
        }
    }

    var qs = JSON.parse(JSON.stringify(data.queryString));
    if (data.method === 'get' && qs.name) {
        message = qs.name;
    } 

    var response = {
        'message': `Hello ${message}!`
    };
    cb(200, response);
};

handlers.ping = function(data, cb) {
    cb(200, { 'message': 'Still alive!' });
};

handlers.notFound = function(data, cb) {
    cb(404);
};

var router = {
    'ping': handlers.ping,
    'hello': handlers.hello
};

