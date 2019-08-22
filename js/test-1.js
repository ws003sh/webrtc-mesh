var room = 'foo';
var socket = io.connect();
var isConnected = false

// var localVideo = document.querySelector('#localVideo')
var localVideo = ''
var remoteVideo = document.querySelector('#remoteVideo');

var url = location.href
var who = ''
var isAnswer = false // 是否为回答者

var num = 0

///////////// socket start ///////////////
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);

  socket.on('created', function(room) {
    console.log('Created room ' + room);
  });

  socket.on('join', function (room){
    console.log('------- Another peer made a request to join room ' + room + ' ---------');
    if(isAnswer) {
        return
    } else {
        num++
        if (!isAnswer) {
            // 4. 当offer发现有人加入时，发送自己的offer
            doCall();
        }
    }
  });

  socket.on('joined', function(room) {
    console.log('joined: ' + room);
  });

  socket.on('log', function(array) {
    console.log.apply(console, array);
  });

  function sendMessage(message) {
    socket.emit('message', message);
  }

  // 核心逻辑....
  socket.on('message', function(message) {
    console.log(who + 'Client received message:', message);
    if(message.type) {
        console.log('message.type === ', message.type);
    }
    if (message.type === 'offer' && isAnswer) {
        if (isConnected) {
          console.log('这个页面已经连接上了！')
          return
        }
        // 通过 setRemoteDescription，设置远端的描述信息。
        if (!isAnswer) {
          
        } else if (isAnswer) {
            // answer端存储远程SDP
            if(!isConnected) {
                if(num == 91) {
                    remote2.setRemoteDescription(new RTCSessionDescription(message));
                    console.log('message.type ===  offer and setRemoteDescription 3')
                    // answer端回答offer端
                    doAnswer();
                } else {
                    remote.setRemoteDescription(new RTCSessionDescription(message));
                    console.log('message.type ===  offer and setRemoteDescription 3')
                    // answer端回答offer端
                    doAnswer();
                }
                
            }
        }
      } else if (message.type === 'answer') {
        console.log('我是 ' + who + 'message.type ===  answer and setRemoteDescription')
        if (isConnected) {
          console.log('这个页面已经连接上了！')
          return
        } 
        if (!isAnswer) {
            if(num > 1) {
                local2.setRemoteDescription(new RTCSessionDescription(message));
            } else {
                local.setRemoteDescription(new RTCSessionDescription(message));
            }
        }
        
      } else if (message.type === 'candidate') {
          if(isAnswer) {
            if(!isConnected) {
                if(num == 91) {
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate
                      });
                      remote2.addIceCandidate(candidate);
                } else {
                    var candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate
                      });
                      remote.addIceCandidate(candidate);
                }
                
            }
          } else {
            if(!isConnected) {
                var candidate = new RTCIceCandidate({
                  sdpMLineIndex: message.label,
                  candidate: message.candidate
                });
                if(num > 1) {
                    local2.addIceCandidate(candidate);
                } else {
                    local.addIceCandidate(candidate);
                }
                
            }
          }
        
      } else if (message === 'bye') {
        handleRemoteHangup();
      }
  })

//////////////// RTCPeerConnection start //////////////////

let local // NO.1 RTCPeerConnection 主播端
    local = new RTCPeerConnection(null);
    local.onicecandidate = handleIceCandidate;
    local.onaddstream = handleRemoteStreamAdded;
    local.onremovestream = handleRemoteStreamRemoved;

let local2 // NO.2 RTCPeerConnection 远程端2
    local2 = new RTCPeerConnection(null);
    local2.onicecandidate = handleIceCandidate;
    local2.onaddstream = handleRemoteStreamAdded;
    local2.onremovestream = handleRemoteStreamRemoved;

let remote // NO.2 RTCPeerConnection 远程端
    remote = new RTCPeerConnection(null);
    remote.onicecandidate = handleIceCandidate;
    remote.onaddstream = handleRemoteStreamAdded;
    remote.onremovestream = handleRemoteStreamRemoved;

let remote2 // NO.2 RTCPeerConnection 远程端
    remote2 = new RTCPeerConnection(null);
    remote2.onicecandidate = handleIceCandidate;
    remote2.onaddstream = handleRemoteStreamAdded;
    remote2.onremovestream = handleRemoteStreamRemoved;

///////////// URL&getUserMedia start ///////////////
// 1. getUserMedia

if (url.indexOf('appkey') === -1) {
    who = '发送端： '
    remote = null
    if(num > 1) {
        console.log('num > 1')
        iam2()
    } else {    
        localVideo = document.querySelector('#localVideo')
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        })
        .then(gotStream)
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });
    }
    text.innerHTML = '这里是发送端'
  } else {
    who = '接收端： '
    local = '' // 接收端使用的对象是 remote
    isAnswer = true
    text.innerHTML = '这里是接收端'
    if(url.indexOf('appkey=0') !== -1) {
        num = 91
        console.log('9191919')
    }
  }

//////////////// function //////////////////
function doAnswer() {
    console.log('Sending answer to peer.');
    // 用户通过 createAnswer 创建出自己的 SDP 描述
    // 用户通过 setLocalDescription，设置本地的描述信息
    if(num == 91) {
        remote2.createAnswer().then(
            setLocalAndSendMessage,
            onCreateSessionDescriptionError
        );
    } else {
        remote.createAnswer().then(
            setLocalAndSendMessage,
            onCreateSessionDescriptionError
        );
    }
    
  }

    function doCall() {
        // 4.1 offer由offer端发送
        if (isAnswer) {
    
        } else {
            test()
        }
    }

    function test() {
        console.log('Sending offer to peer');
        // 4.2 生成各自的SPD描述文件
        if(num > 1) {
          console.log(' use local2 ')

            local2.createOffer(setLocalAndSendMessage, handleCreateOfferError);
        } else {
            local.createOffer(setLocalAndSendMessage, handleCreateOfferError);
        }
      }

      function iam2() {
        console.log('i am 2')
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
          })
          .then(gotStream2)
          .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
          });
          function gotStream2 (stream) {
            // localVideo = document.querySelector('#localVideo')
            // localVideo.srcObject = stream;
            local2.addStream(stream);
          }
      }
    function gotStream(stream) {
        // 2. 添加视频到video元素上
        localVideo.srcObject = stream;
        
        if(num > 1) {
            // 3. 将视频流添加到RTCpeerconnection上，然后待机
            // local2.addStream(stream);
        } else {
            // 3. 将视频流添加到RTCpeerconnection上，然后待机
            local.addStream(stream);
            local2.addStream(stream);
        }
    }

    function setLocalAndSendMessage(sessionDescription) {
        // 4.3 设置本地的描述信息SDP,然后广播offer端的SDP
        if (isAnswer) {
            if(num > 1) {
                remote2.setLocalDescription(sessionDescription);
                console.log('setLocal And SendMessage ', sessionDescription);
                sendMessage(sessionDescription);
            } else {
                remote.setLocalDescription(sessionDescription);
                console.log('setLocal And SendMessage ', sessionDescription);
                sendMessage(sessionDescription);
            }
           
        } else {
            if(num > 1) {
                local2.setLocalDescription(sessionDescription);
                console.log('setLocal And SendMessage 2 ', sessionDescription);
                sendMessage(sessionDescription);
            } else {
                local.setLocalDescription(sessionDescription);
                console.log('setLocal And SendMessage ', sessionDescription);
                sendMessage(sessionDescription);
            }
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
        } else if(!event.candidate){
            console.log('------ candidates 收集失败 ------');
        } else {
            console.log('------ End of candidates. ------');
        }
    }

  function handleRemoteStreamAdded(event) {
    console.log('--------------- Remote stream added. ---------------');
    console.log(event)
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
    isConnected = true
  }

  function onCreateSessionDescriptionError(error) {
    console.trace('Failed to create session description: ' + error.toString());
  }

  function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }

  function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
  }
  function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('bye');
  }
  
  function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
  }
  
  function stop() {
    local.close();
    local = null;
  }

  function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }