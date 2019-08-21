var room = 'foo';
var socket = io.connect();
var localVideo = ''

////////////////// socket //////////////////////

socket.on('join', function (room){
    console.log('------- Another peer made a request to join room ' + room + ' ---------');
    // 主播接收到别人加入的消息，广播自己的SDP
});

socket.on('joined', function(room) {
    console.log('joined: ' + room);
});

socket.on('log', function(array) {
    console.log.apply(console, array);
});

socket.emit('create or join', room);
console.log('Attempted to create or  join room', room);

socket.on('created', function(room) {
    console.log('Created room ' + room);
});
////////////////// socket //////////////////////

let pc
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;

////////////////// RTCPeerConnection //////////////////////

localVideo = document.querySelector('#localVideo')
navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
})
.then(gotStream)
.catch(function(e) {
    alert('getUserMedia() error: ' + e);
});
function gotStream(stream) {
    localVideo.srcObject = stream;
    pc.addStream(stream);
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function setLocalAndSendMessage(sessionDescription) {
    // 主播通过 setLocalDescription，设置本地的描述信息
    pc.setLocalDescription(sessionDescription);
    console.log('setLocal And SendMessage ', sessionDescription);
    sendMessage(sessionDescription);
}


    function sendMessage(message) {
        socket.emit('message', message);
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
      console.log('------ End of candidates. ------');
    }
  }

  function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    console.log(event)
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
    isConnected = true
  }

  function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }

  function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
  }