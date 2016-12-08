var os = require('os');
var nodeStatic = require('node-static');
var https = require('https');
var socketIO = require('socket.io');
var fs = require('fs');

var options = {
    key: fs.readFileSync('samCodyKey.pem'),
    cert: fs.readFileSync('samCodyCert.pem')
};
