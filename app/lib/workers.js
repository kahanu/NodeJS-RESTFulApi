var path = require('path');
var fs = require('fs');
var _data = require('./data');
var https = require('https');
var http = require('http');
var helpers = require('./helpers');
var url = require('url');
var _logs = require('./logs');
var util = require('util');
var debug = util.debuglog('workers');

var workers = {};

workers.validateCheckData = function(checkData) {
    checkData = typeof checkData === 'object' && checkData !== null ? checkData : {};
    checkData.id = typeof checkData.id === 'string' && checkData.id.trim().length === 20 ? checkData.id.trim() : false;
    checkData.userPhone = typeof checkData.userPhone === 'string' && checkData.userPhone.trim().length === 10 ? checkData.userPhone.trim() : false;
    checkData.protocol = typeof checkData.protocol === 'string' && ['http','https'].indexOf(checkData.protocol) > -1 ? checkData.protocol : false;
    checkData.url = typeof checkData.url === 'string' && checkData.url.trim().length > 0 ? checkData.url.trim() : false;
    checkData.method = typeof checkData.method === 'string' && ['get','post','put','delete'].indexOf(checkData.method) > -1 ? checkData.method : false;
    checkData.successCodes = typeof checkData.successCodes === 'object' && checkData.successCodes instanceof Array && checkData.successCodes.length > 0 ? checkData.successCodes : false;
    checkData.timeoutSeconds = typeof checkData.timeoutSeconds === 'number' && checkData.timeoutSeconds % 1 === 0 && checkData.timeoutSeconds >= 1 && checkData.timeoutSeconds <= 5 ? checkData.timeoutSeconds : false;

    checkData.state = typeof checkData.state === 'string' && ['up','down'].indexOf(checkData.state) > -1 ? checkData.state : 'down';
    checkData.lastChecked = typeof checkData.lastChecked === 'number' && checkData.lastChecked > 0 ? checkData.lastChecked : false;

    if (checkData.id && checkData.userPhone && checkData.protocol && checkData.url && checkData.method && checkData.successCodes && checkData.timeoutSeconds) {
        workers.performCheck(checkData);
    } else {
        debug('Error, one of the checks is not properly formattted.  Skipping it.');
    }
};

workers.performCheck = function(checkData) {
    var checkOutcome = {
        'error': false,
        'responseCode': false
    };

    var outcomeSent = false;

    var parsedUrl = url.parse(checkData.protocol + '://' + checkData.url, true);
    var hostName = parsedUrl.hostname;
    var path = parsedUrl.path;

    var requestDetails = {
        'protocol': checkData.protocol + ':',
        'hostname': hostName,
        'method': checkData.method.toUpperCase(),
        'path': path,
        'timeout': checkData.timeoutSeconds * 1000
    };

    var _moduleToUse = checkData.protocol === 'http' ? http : https;
    var req = _moduleToUse.request(requestDetails, function(res) {
        var status = res.statusCode;
        checkOutcome.responseCode = status;

        if (!outcomeSent) {
            workers.processcheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('error', function(e) {
        checkOutcome.error = {
            'error': true,
            'value': e
        };
        if (!outcomeSent) {
            workers.processcheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', function(e) {
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        };
        if (!outcomeSent) {
            workers.processcheckOutcome(checkData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
};

workers.processcheckOutcome = function(checkData, outcome) {
    var state = !outcome.error && outcome.responseCode && checkData.successCodes.indexOf(outcome.responseCode) > -1 ? 'up' : 'down';
    var alertWarranted = checkData.lastChecked && checkData.state !== state ? true : false;
    var timeOfCheck = Date.now();
    workers.log(checkData, outcome, state, alertWarranted, timeOfCheck);
    var newCheckData = checkData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    _data.update('checks', newCheckData.id, newCheckData, function(err) {
        if (!err) {
            if (alertWarranted) {
                workers.alertUserToStatusChanged(newCheckData);
            } else {
                debug('Check has not changed, not alert needed.');
            }
        } else {
            debug('Error trying to update a check.');
        }
    });
};

workers.alertUserToStatusChanged = function(checkData) {
    var message = `Alert, Your check for ${checkData.method} of ${checkData.protocol}://${checkData.url} is currently ${checkData.state}.`;
    helpers.sendTwilioSms(checkData.userPhone, message, function(err) {
        if (!err) {
            debug('Success sending alert.');
        } else {
            debug('Error sending SMS alert.');
        }
    });
};

workers.gatherAllChecks = function() {
    _data.list('checks', function(err, checks) {
        if (!err && checks && checks.length > 0) {
            checks.forEach(check => {
                _data.read('checks', check, function(err, originalCheckData) {
                    if (!err && originalCheckData) {
                        workers.validateCheckData(originalCheckData);
                    } else {
                        debug('Error reading a check.');
                    }
                });
            });
        } else {
            debug('Error - could not find any checks to process.');
        }
    });
};

workers.log = function(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) {
    var logData = {
        'check': originalCheckData,
        'outcome': checkOutcome,
        'state': state,
        'alert': alertWarranted,
        'time': timeOfCheck
    };

    var logString = JSON.stringify(logData);
    var logFileName = originalCheckData.id;
    _logs.append(logFileName, logString, function(err) {
        if (!err) {
            debug('Logging succeeded!');
        } else {
            debug('Logging failed.');
        }
    });
};

workers.loop = function() {
    setInterval(function() {
        workers.gatherAllChecks();
    }, 1000 * 60);
};

// compress the logs
workers.rotateLogs = function() {
    _logs.list(false, function(err, logs) {
        if (!err && logs && logs.length > 0) {
            logs.forEach(logName => {
                var logId = logName.replace('.log', '');
                var newFileId = logId + '-' + Date.now();
                _logs.compress(logId, newFileId, function(err) {
                    if (!err) {
                        // Truncate the log
                        _logs.truncate(logId, function(err) {
                            if (!err) {
                                debug('Log file truncated successfully!');
                            } else {
                                debug('Log file truncation failure!');
                            }
                        });
                    } else {
                        debug('Error compressing a log file: ', err);
                    }
                });
            });
        } else {
            debug('Could not find any logs to rotate.');
        }
    });
};

workers.logRotationLoop = function() {
    setInterval(() => {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
};

workers.init = function() {
    // Console log to yellow
    console.log('\x1b[33m%s\x1b[0m', 'Background workers are running.');

    // Execute all checks immediately
    workers.gatherAllChecks();

    // Call the loop so the checks will execute later on
    workers.loop();

    // Compress all logs immediately
    workers.rotateLogs();

    // Call the compression loop so logs will be compressed later on
    workers.logRotationLoop();

};

module.exports = workers;