var isChannelReady = false;
var isInitiator = false;
var isStarted = false;

var room = window.location.pathname.split('/').slice(-1)[0];
console.log(room);

var socket = io.connect();

// log messages sent from server socket
socket.on('log', function(array) {
    console.log.apply(console, array);
});

socket.emit('create or join', room);

socket.on('created', function(room) {
    console.log('created room ' + room);
    // TODO give user link to share, indicate to user that we are waiting for second person to join
    isInitiator = true;
});

socket.on('ready', function() {
    console.log('Second user has connected, ready to start');
    isChannelReady = true;
});

socket.on('full', function(room) {
    console.log('Room ' + room + ' is full.');
});

socket.on('share_url', function(share_URL) {
    console.log('Share URL is: ' + share_URL);
    $("#share_URL").text('Share URL is: ' + share_URL);
});

socket.on('left', function(room) {
    console.log('A user has left this room');
    // TODO indicate to user that other person has left
});

$(window).on('unload', function() {
    socket.emit('bye', room);
});


//////////////////////
// Socket communication between users in this room
//////////////////////

function sendMessage(message) {
    socket.emit('message', room, message);
}

socket.on('message', function(message) {
    console.log('Client received message:', message);
    // TODO handle different types of messages (this is where we trigger functions to start the call once we get user media)
})

//////////////////////
// Video Handling
//////////////////////

var localVideo = document.querySelector('#local');
var remoteVideo = document.querySelector('#remote');

navigator.mediaDevices.getUserMedia({video: true, audio: false})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localVideo.src = window.URL.createObjectURL(stream);
}

