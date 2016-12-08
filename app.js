var os = require('os');
var nodeStatic = require('node-static');
var https = require('https');
var socketIO = require('socket.io');
var fs = require('fs');

var options = {
    key: fs.readFileSync('samCodyKey.pem'),
    cert: fs.readFileSync('samCodyCert.pem')
};

var fileServer = new(nodeStatic.Server)();

var app = https.createServer(options, function(req, res) {
    fileServer.serve(req, res);
}).listen(4242);

var io = socketIO.listen(app);


