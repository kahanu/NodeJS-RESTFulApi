var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

/**
 * Check if the directory exists, otherwise create it and run the callback.
 */
lib._directoryExists = function(dir, cb) {
    fs.stat(lib.baseDir + dir, function(err) {
        if (!err) {
            cb();
        } else {
            fs.mkdir(lib.baseDir + dir, cb);
        }
    });
};

lib.create = function(dir, file, data, cb) {
    lib._directoryExists(dir, function() {
        fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor) {
            if (!err && fileDescriptor) {
                var stringData = JSON.stringify(data);
    
                fs.writeFile(fileDescriptor, stringData, function(err) {
                    if (!err) {
                        fs.close(fileDescriptor, function(err) {
                            if (!err) {
                                cb(false);
                            } else {
                                cb('Error closing file.');
                            }
                        });
                    } else {
                        cb('Error writing to new file.');
                    }
                });
            } else {
                cb('Could not create file, it may already exist.', err);
            }
        });        
    });
};

lib.read = function(dir, file, cb) {
    var path = lib.baseDir + dir + '/' + file + '.json';
    fs.readFile(path, 'utf8', function(err, data) {
        if (!err && data) {
            var parsedData = helpers.parseJsonToObject(data);
            cb(false, parsedData);
        } else {
            cb(err, data);    
        }
    });
};

lib.update = function(dir, file, data, cb) {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            var stringData = JSON.stringify(data);

            fs.ftruncate(fileDescriptor, function(err) {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if (!err) {
                            fs.close(fileDescriptor, function(err) {
                                if (!err) {
                                    cb(false);
                                } else {
                                    cb('Error closing file.');
                                }
                            });
                        } else {
                            cb('Error writing to new file.');
                        }
                    });
                } else {
                    cb('Error truncating file.');
                }
            });
        } else {
            cb('Could not open the file for updating, it may not exist.');
        }
    });
};

lib.delete = function(dir, file, cb) {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err) {
        if (!err) {
            cb(false);
        } else {
            cb('Error deleting file.');
        }
    });
};

lib.list = function(dir, cb) {
    fs.readdir(lib.baseDir + dir + '/', function(err, data) {
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(file => {
                trimmedFileNames.push(file.replace('.json', ''));
            });
            cb(false, trimmedFileNames);
        } else {
            cb(err, data);
        }
    });
};

module.exports = lib;