var helpers = require('../helpers');
var _data = require('../data');
var config = require('../config');

var checksRoutes = {};
checksRoutes._checks = {};


checksRoutes._checks.get = function(data, cb) {
    var tokenId = typeof data.queryString.id === 'string' && data.queryString.id.trim().length === 20 ? data.queryString.id : false;
    if (tokenId) {
        _data.read('checks', tokenId, function(err, checkData) {
            if (!err && checkData) {
                var tokenRequest = helpers.createTokenRequest(data.headers.token, checkData.userPhone);
                helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
                    if (tokenIsValid) {
                        cb(200, checkData);
                    } else {
                        cb(403);
                    }
                });
            } else {
                cb(404);
            }
        });


    } else {
        cb(400, { 'Error': 'Missing id.' });
    }
};

checksRoutes._checks.post = function(data, cb) {
    var protocol = typeof(data.payload.protocol) === 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof data.payload.url === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) === 'string' && ['get','put','post','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof data.payload.successCodes === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof data.payload.timeoutSeconds === 'number' && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        var tokenId = helpers.getTokenFromHeader(data);

        _data.read('tokens', tokenId, function(err, tokenData) {
            if (!err && tokenData) {
                var userPhone = tokenData.phone;

                _data.read('users', userPhone, function(err, userData) {
                    if (!err && userData) {
                        var userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];
                        if (userChecks.length < config.maxChecks) {
                            var checkId = helpers.createRandomString(20);
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            _data.create('checks', checkId, checkObject, function(err) {
                                if (!err) {
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    _data.update('users', userPhone, userData, function(err) {
                                        if (!err) {
                                            cb(200, checkObject);
                                        } else {
                                            cb(500, { 'Error': 'Could not update the user with the new check.' });
                                        }
                                    });
                                } else {
                                    cb(500, { 'Error': 'Could not create the new check.' });
                                }
                            });
                        } else {
                            cb(400, { 'Error': `Maximum number of check reached for this user. (${config.maxChecks})`})
                        }
                    } else {
                        cb(403);
                    }
                });
            } else {
                cb(403);
            }
        });
    } else {
        cb(400, { 'Error': 'Missing required inputs or inputs are invalid.' });
    }
};

checksRoutes._checks.put = function(data, cb) {
    var tokenId = typeof data.payload.id === 'string' && data.payload.id.trim().length === 20 ? data.payload.id : false;
    var protocol = typeof(data.payload.protocol) === 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof data.payload.url === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) === 'string' && ['get','put','post','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof data.payload.successCodes === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof data.payload.timeoutSeconds === 'number' && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (tokenId) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            _data.read('checks', tokenId, function(err, checkData) {
                if (!err && checkData) {
                    var tokenRequest = helpers.createTokenRequest(data.headers.token, checkData.userPhone);
                    helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
                        if (tokenIsValid) {
                            if (protocol) { checkData.protocol = protocol; }
                            if (url) { checkData.url = url; }
                            if (method) { checkData.method = method; }
                            if (successCodes) { checkData.successCodes = successCodes; }
                            if (timeoutSeconds) { checkData.timeoutSeconds = timeoutSeconds; }

                            _data.update('checks', tokenId, checkData, function(err) {
                                if (!err) {
                                    cb(200);
                                } else {
                                    cb(400, { 'Error': 'Could not upddate the check.' });
                                }
                            });
                        } else {
                            cb(403);
                        }
                    });
                } else {
                    cb(404);
                }
            });
        } else {
            cb(400, { 'Error': 'Missing required inputs or inputs are invalid.' });
        }
    } else {
        cb(400, { 'Error': 'Missing id.' });
    }
};

checksRoutes._checks.delete = function(data, cb) {
    var checkId = typeof data.queryString.id === 'string' && data.queryString.id.trim().length === 20 ? data.queryString.id : false;
    if (checkId) {
        _data.read('checks', checkId, function(err, checkData) {
            if (!err && checkData) {
                var tokenRequest = helpers.createTokenRequest(data.headers.token, checkData.userPhone);
                helpers.verifyToken(tokenRequest, _data, function(tokenIsValid) {
                    if (tokenIsValid) {
                        _data.delete('checks', checkId, function(err) {
                            if (!err) {
                                _data.read('users', checkData.userPhone, function(err, userData) {
                                    if (!err && userData) {
                                        var userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];
                                        var checkPosition = userChecks.indexOf(checkId);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);
                                            _data.update('users', checkData.userPhone, userData, function(err) {
                                                if (!err) {
                                                    cb(200);
                                                } else {
                                                    cb(500, { 'Error': 'Could not update the user.' });
                                                }
                                            });
                                        } else {
                                            cb(500, { 'Error': 'Could not find the check to delete.' });
                                        }
                                    } else {
                                        cb(400, { 'Error': 'Could not find the user.' });
                                    }
                                });
                            } else {
                                cb(500, { 'Error': 'Could not delete the check.' });
                            }
                        });
                    } else {
                        cb(403);
                    }
                });
            } else {
                cb(400, { 'Error': 'The check id does not exist.' });
            }
        });
    } else {
        cb(403);
    }
};

checksRoutes.checks = function(data, cb) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        checksRoutes._checks[data.method](data, cb);
    } else {
      cb(405);
    }
};

module.exports = checksRoutes;


