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

/**
 * Parse a JSON string to an object.
 */
helpers.parseJsonToObject = function(input) {
    try {
        return JSON.parse(input);
    } catch (e) {
        return {};
    }
};

/**
 * Create random string.
 */
helpers.createRandomString = function(strLength) {
    var len = typeof(strLength) === 'number' && strLength > 0 ? +strLength : false;
    if (len) {
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var result = '';

        for (let i = 0; i < len; i++) {
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            result += randomCharacter;
        }

        return result;
    } else {
        return false;   
    }
};


module.exports = helpers;