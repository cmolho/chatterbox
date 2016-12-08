var os = require('os');
var nodeStatic = require('node-static');
var https = require('https');
var socketIO = require('socket.io');
var fs = require('fs');
var express = require('express');
var path = require('path');
var now = require('performance-now');

var creds = {
    key: fs.readFileSync('samCodyKey.pem'),
    cert: fs.readFileSync('samCodyCert.pem')
};

//var fileServer = new(nodeStatic.Server)();

//var app = https.createServer(options, function(req, res) {
//    fileServer.serve(req, res);
//}).listen(4242);
var app = express();
app.use(express.static(__dirname + '/public'));

httpsServer = https.createServer(creds, app);

app.get('/', function(req, res) {
    console.log(path.join(__dirname + '/public/index.html'));
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

httpsServer.listen(4242);

app.get('/new_room', function(req, res) {
    res.end(make_new_room_hash());
});



var io = socketIO.listen(httpsServer);

function make_new_room_hash() {
    // Build out the unique url
    var share_URL = 'https://';

    // Get the external IP address
    var net_ifaces = os.networkInterfaces();
    for (var dev in net_ifaces) {
        for (var i=0; i<net_ifaces[dev].length; i++) {
            if (net_ifaces[dev][i].family === 'IPv4' && net_ifaces[dev][i].internal === false) {
                share_URL += net_ifaces[dev][i].address;
                break;
            }
        }
    }

    // Append the port
    share_URL += ':4242/';

    // Grab a unique number for the private room name
    var room_name = now();

    // Append to URL and pass the room name to socket
    share_URL += room_name;
    console.log(share_URL);
    return room_name.toString();
    //TODO: pass room name to socket

}

var io = socketIO.listen(httpsServer);

io.sockets.on('connection', function(socket) {
	
	function log() {
		var array = ['Message from server:'];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}

	socket.on('message', function(message) {
		log('Client said: ', message);
		socket.broadcast.emit('message', message);
	});
});
