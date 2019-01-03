var crypto = require('crypto');
var config = require('./config');

var helpers = {};

/**
 * Sanitize the phone number to strip away non-numeric characters, 
 * like ().-, for numbers formatted like: (800) 333-2222
 */
helpers.sanitizePhone = function(input) {
    if (typeof(input) === 'string' && input.length > 0) {
        return input.replace(/\W/g, '');
    } else {
        return false;
    }
};

/**
 * Hash the password.
 */
helpers.hash = function(input) {
    if (typeof(input) === 'string' && input.length > 0) {
        return crypto.createHmac('sha256', config.hashingSecret).update(input).digest('hex');
    } else {
        return false;
    }
};

helpers.parseJsonToObject = function(input) {
    try {
        return JSON.parse(input);
    } catch (e) {
        return {};
    }
};


module.exports = helpers;