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

httpsServer.listen(4242);

app.get('/', function(req, res) {
	console.log("GET /index");
    //console.log(path.join(__dirname + '/public/index.html'));
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/new_room', function(req, res) {
	console.log("GET /new_room");
    res.end(make_new_room_hash());
});

app.get('/chatbox/:room_id', function(req, res) {
	console.log("GET /chatbox/" + req.params.room_id);
    res.sendFile(path.join(__dirname + '/public/chatbox.html'));
});

var io = socketIO.listen(httpsServer);

function make_new_room_hash() {
    var room_name = now();
    return room_name.toString();
}

function make_share_URL(room) {
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
    share_URL += ':4242/chatbox/';

    // Append to URL and pass the room name to socket
    share_URL += room;
    console.log(share_URL);
    return share_URL;

}

var rooms = {};

io.sockets.on('connection', function(socket) {
	
	function log() {
		var array = ['Message from server:'];
		array.push.apply(array, arguments);
		socket.emit('log', array);
	}

	socket.on('message', function(room, message) {
		console.log('Client in room ' + room + ' said: ' + message);
		io.sockets.in(room).emit('message', message);
	});

    // New user connection creating or joining a room
    socket.on('create or join', function(room) {
        console.log('Received request to create or join room ' + room);

        // update room sizes TODO check if too big
        if (!rooms[room]) {
            rooms[room] = 1;
            socket.join(room);
            socket.emit('created', room);
            var share_URL = make_share_URL(room);
            socket.emit('share_url', share_URL);
        }
        else if (rooms[room] === 1) {
            rooms[room] = rooms[room] + 1;
            socket.join(room);
            io.sockets.in(room).emit('ready');
        } else {
            socket.emit('full', room);
        }

        console.log('Current rooms: ' + JSON.stringify(rooms));
    });

    // A user is leaving a room
    socket.on('bye', function(room) {
        console.log('A user has left room ' + room);
        //TODO room never goes above two people but if extra person tries to connect and leaves, still decrements
        rooms[room] = rooms[room] - 1;
        console.log('Current rooms: ' + JSON.stringify(rooms));
        io.sockets.in(room).emit('left');
    });
});
