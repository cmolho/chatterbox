console.log("hello!");

var room = window.location.pathname.split('/').slice(-1)[0];
console.log(room);

var socket = io.connect();

// log messages sent from server socket
socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.emit('create or join', room);