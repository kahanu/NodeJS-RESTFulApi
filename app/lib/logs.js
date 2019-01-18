var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var lib = {};

lib.baseDir = path.join(__dirname, '/../.logs/');

lib._directoryExists = function(dir, cb) {
    fs.stat(lib.baseDir + dir, function(err) {
        if (!err) {
            cb();
        } else {
            fs.mkdir(lib.baseDir + dir, cb);
        }
    });
};

lib.append = function(file, str, cb) {
    var dir = lib.baseDir + file + '.log';
    lib._directoryExists(dir, function() {
        fs.open(dir, 'a', function(err, fileDescriptor) {
            if (!err && fileDescriptor) {
                fs.appendFile(fileDescriptor, str + '\n', function(err) {
                    if (!err) {
                        fs.close(fileDescriptor, function(err) {
                            if (!err) {
                                cb(false);
                            } else {
                                cb('Error closing the file that was being appended.');
                            }
                        });
                    } else {
                        cb('Error appending to file.');
                    }
                });
            } else {
                cb('Could not open file for appending.');
            }
        });
    });
};

lib.list = function(includeCompressedLogsInList, cb) {
    fs.readdir(lib.baseDir, function(err, data) {
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(fileName => {
                if (fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log', ''));
                } 

                if (fileName.indexOf('.gz.b64') > -1) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''));
                }
            });
            cb(false, trimmedFileNames);
        } else {
            cb(err, data);
        }
    });
};

// compress the log files
lib.compress = function(logId, newFileId, cb) {
    var sourceFile = logId + '.log';
    var destFile = newFileId + '.gz.b64';

    fs.readFile(lib.baseDir + sourceFile, 'utf8', function(err, inputString) {
        if (!err && inputString) {
            // Compress the data using gzip
            zlib.gzip(inputString, function(err, buffer) {
                if (!err && buffer) {
                    fs.open(lib.baseDir + destFile, 'wx', function(err, fileDescriptor) {
                        if (!err && fileDescriptor) {
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err) {
                                if (!err) {
                                    fs.close(fileDescriptor, function(err) {
                                        if (!err) {
                                            cb(false);
                                        } else {
                                            cb(err);
                                        }
                                    });
                                } else {
                                    cb(err);
                                }
                            });
                        } else {
                            cb(err);
                        }
                    });
                } else {
                    cb(err);
                }
            });
        } else {
            cb(err);
        }
    });
};

lib.decompress = function(fileId, cb) {
    var fileName = fileId + '.gz.b64';
    fs.readFile(fileName, function(err, str) {
        if (!err && str) {
            var inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, function(err, outputBuffer) {
                if (!err && outputBuffer) {
                    var newString = outputBuffer.toString();
                    cb(false, newString);
                } else {
                    cb(err);
                }
            });
        } else {
            cb(err);
        }
    });
};

lib.truncate = function(logId, cb) {
    fs.truncate(lib.baseDir + logId + '.log', 0, function(err) {
        if (!err) {
            cb(false);
        } else {
            cb(err);
        }
    });
};

module.exports = lib;
