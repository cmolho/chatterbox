var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var remoteStream;
var pc;

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
    // window.location.pathname = '/room_full';
});

socket.on('share_url', function(share_URL) {
    console.log('Share URL is: ' + share_URL);
    $("#share_URL").val(share_URL);
    $("#share_URL").click(function() {
    	$(this).select();
    });
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
	console.log('Client sending message: ', message);
    socket.emit('message', room, message);
}

socket.on('message', function(message) {
    console.log('Client received message:', message);
    if (message === 'got user media') {
        tryStarting();
    } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
            tryStarting();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
    } else if (message.type === 'answer' && isStarted) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && isStarted){
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
    } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    }
});

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}

function stop() {
    isStarted = false;
    pc.close();
    pc = null;
}

function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
    );
}

function onCreateSessionDescriptionError(error) {
    console.log('Failed to create session description: ' + error.toString());
}

//////////////////////
// Video Handling
//////////////////////

function tryStarting() {
    console.log('>>>>>>> tryStarting() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            doCall();
        }
    }
}

function createPeerConnection() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamAdded;
        console.log('Created RTCPeerConnection');
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
        console.log('End of candidates.');
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.'); 
    remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteStream = event.stream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}
    
function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
}

var localVideo = document.querySelector('#local');
localVideo.muted = true;
var remoteVideo = document.querySelector('#remote');

navigator.mediaDevices.getUserMedia({video: true, audio: true})
.then(gotStream)
.catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
    console.log('Adding local stream.');
    localVideo.src = window.URL.createObjectURL(stream);
    localStream = stream; 
    sendMessage('got user media');
    if (isInitiator) {
        tryStarting();
    }
}


//////////////////////
// Buttons
//////////////////////

$("#mic").click(function() {
	console.log("mic clicked");
});

$("#video").click(function() {
	console.log("video clicked");
});

$("#volume").click(function() {
	console.log("volume clicked");
	if (remoteVideo.muted === true) {
		remoteVideo.muted = false;
		$("#volume i").html("volume_up")
	} else {
		remoteVideo.muted = true;
		$("#volume i").html("volume_off")
	}
});

$("#hangup").click(function() {
	console.log("hangup clicked");
});
