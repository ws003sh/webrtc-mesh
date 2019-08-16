'use strict';

var isChannelReady = false; //  是否接入信令通道
var isInitiator = false; // 是否为创建者
var isStarted = false; // p2p连接是否已经开始
var isAnswer = false // 是否为回答者
var localStream;
var pc;
var remoteStream;
var turnReady;
var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};
// Set up audio and video regardless of what devices are present.

/////////////////////////////////////////////

var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

socket.on('created', function(room) {
  console.log('Created room ' + room);
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

////////////////////////////////////////////////
// 发送信息到信令服务端
function sendMessage(message) {
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
  if(message.type) {
    console.log('message.type === ', message.type);
  }
  if (message === 'got user media') {
    if(!isAnswer) {
      maybeStart();
    }
    // maybeStart();
  } else if (message.type === 'offer') {
    // 用户通过 setRemoteDescription，设置远端的描述信息
    // 主播通过 setRemoteDescription，设置远端的描述信息。
    if (!isInitiator && !isStarted && !isAnswer) {
      maybeStart();
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    } else if (!isInitiator && !isStarted && isAnswer){
      // 接收端
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    }
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  } 
});

////////////////////////////////////////////////////
var localVideo = ''
let url = location.href
var remoteVideo = document.querySelector('#remoteVideo');
var text = document.getElementById('text');

if (url.indexOf('appkey') === -1) {
  localVideo = document.querySelector('#localVideo')
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
  text.innerText = '这里是发送端'
} else {
  isAnswer = true
  text.innerText = '这里是接收端'
  // 连上信令，进入房间
  // 准备SPD、存储SPD、回答主播
  sendSPDMsg()
}

///////////////////
function sendSPDMsg() {
  // receive offetSPD
  // 即是offer也是answer
  console.log('answer SPD Creat start')
  sendMessage('got user media');

  pc = new RTCPeerConnection(null);
  pc.onicecandidate = handleIceCandidate;
  pc.onaddstream = handleRemoteStreamAdded;
  pc.onremovestream = handleRemoteStreamRemoved;

  console.log('Created RTCPeerConnnection' + pc);
  console.log(pc)
  sendMessage(pc);
  
}

///////////////////////

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

var constraints = {
  video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
    // 'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
    'https://108.108.108.27:3478'
  );
}

function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  } else if (!isStarted && isChannelReady) {
    doCall();
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};
/////////////////////////////////////////////////////////
// 产生音视频流 RTCPeerConnection
function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    // console.log('Created RTCPeerConnnection' + pc);
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    if(!isAnswer) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    }
    
  } else {
    console.log('End of candidates.');
  
  }
}


function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  // 主播端通过 createOffer 生成 SDP 描述
  if (isAnswer) { // 是直播接收端 产生自己的SPD，并发送出去

  } else {// 主播端 发送自己的offer SPD
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
  }
}

function doAnswer() {
  console.log('Sending answer to peer.');
  // 用户通过 createAnswer 创建出自己的 SDP 描述
  pc.createAnswer().then(
    setLocalAndSendMessage, // 用户通过 setLocalDescription，设置本地的描述信息
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  // 主播通过 setLocalDescription，设置本地的描述信息
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  // 主播将 offer SDP 发送给用户
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  console.trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    // console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    // xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  console.log(event)
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

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
