var crypto = require('crypto');
var config = require('./config');
var querystring = require('querystring');
var https = require('https');

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

/**
 * Create the Verify Token request that contains the necessary data, tokenId and phone.
 * @param token The object with the tokenId
 * @param phone The object with the phone number
 * @example Token: { token: 'usfafuh9o0759x4xwtoh' }
 * @example Phone: { phone: '8185552222' }
 */
helpers.createTokenRequest = function(token, phone) {
    var request = {};

    request.tokenId = token;
    request.phone = phone;

    return request;
};

/**
 * Deprecated. Public helper method to get the token from the header.
 */
helpers.getTokenFromHeader = function(data) {
    return typeof(data.headers.token) === 'string' ? data.headers.token : false;
};

/**
 * Encapsulate the verify token method.
 * @param tokenRequest Any object containing the tokenId and user phone.
 * @param dataService The global file system _data service.
 * @param cb The callback.
 */
helpers.verifyToken = function (tokenRequest, dataService, cb) {
    // console.log('token request: ', tokenRequest);
    dataService.read('tokens', tokenRequest.tokenId, function (err, tokenData) {
        console.log('token is expired: ', tokenData.expires < Date.now());
        if (!err && tokenData) {
            if (tokenData.phone === tokenRequest.phone && tokenData.expires > Date.now()) {
                cb(true);
            } else {
                cb(false);
            }
        } else {
            cb(false);
        }
    });
};

/**
 * Send SMS text messages via Twilio.
 */
helpers.sendTwilioSms = function(phone, msg, cb) {
    var sanitizedPhone = helpers.sanitizePhone(phone);
    var newphone = typeof sanitizedPhone === 'string' && sanitizedPhone.length === 10 ? sanitizedPhone : false;
    msg = typeof msg === 'string' && msg.trim().length > 0 ? msg.trim() : false;
    if (newphone && msg) {
        var payload = {
            'From': config.twilio.fromPhone,
            'To': '+1' + newphone,
            'Body': msg
        };
        var stringPayload = querystring.stringify(payload);
        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
            'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        var req = https.request(requestDetails, function(res) {
            var status = res.statusCode;
            if (status === 200 || status === 201) {
                cb(false);
            } else {
                cb(`Status code was ${status}.`);
            }
        });

        req.on('error', function(e) {
            cb(e);
        });

        req.write(stringPayload);

        req.end();

    } else {
        cb('Given parameters are missing or invalid.');
    }
};


module.exports = helpers;