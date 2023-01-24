const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');


// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// const socket = io();

// socket.on('connect',function(){ 
//   // Send ehlo event right after connect:
//   let data = {
//     userID : "0000",
//     userType : "chef"
//   }
//   console.log(username);
//   socket.emit('user', data);
// });

// socket.on('reconnect',function(){ 
//   // Send ehlo event right after connect:
//   let data = {
//     userID : "0000",
//     userType : "chef"
    
//   }
//   socket.emit('user', data);
// });
// Open Reports
// socket.emit('getReports', { schoolId : username });

// socket.emit('checkin', { schoolId : username });

// socket.on('check', (message) => {

//     console.log(message);
// });
// Get room and users
// socket.on('roomUsers', ({ room, users }) => {
//   outputRoomName(room);
//   outputUsers(users);
// });

// // Message from server
// socket.on('message', (message) => {
//   console.log(message);
//   outputMessage(message);

//   // Scroll down
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// });

// // Message submit
// chatForm.addEventListener('submit', (e) => {
//   e.preventDefault();

//   // Get message text
//   let msg = e.target.elements.msg.value;
//   msg = msg.trim();

//   if (!msg) {
//     return false;
//   }

//   // Emit message to server
//   socket.emit('chatMessage', {room: "JavaScript", message: msg});

//   // Clear input
//   e.target.elements.msg.value = '';
//   e.target.elements.msg.focus();
// });

// // Output message to DOM
// function outputMessage(message) {
//   const div = document.createElement('div');
//   div.classList.add('message');
//   const p = document.createElement('p');
//   p.classList.add('meta');
//   p.innerText = message.username;
//   p.innerHTML += ` <span>${message.time}</span>`;
//   div.appendChild(p);
//   const para = document.createElement('p');
//   para.classList.add('text');
//   para.innerText = message.text;
//   div.appendChild(para);
//   document.querySelector('.chat-messages').appendChild(div);
// }

// // Add room name to DOM
// function outputRoomName(room) {
//   roomName.innerText = room;
// }

// // Add users to DOM
// function outputUsers(users) {
//   userList.innerHTML = '';
//   users.forEach((user) => {
//     const li = document.createElement('li');
//     li.innerText = user.username;
//     userList.appendChild(li);
//   });
// }

// //Prompt the user before leave chat room
// document.getElementById('leave-btn').addEventListener('click', () => {
//   const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
//   if (leaveRoom) {
//     window.location = '../index.html';
//   } else {
    
//   }
// });

function setup() {
  socket = io(); // load the socket.io client

  // called when a 'chat' event is received, add a <p> with the message to the chat div
  socket.on('chat', function(message) {
    document.getElementById('chatContent').innerHTML += '<p>' + message + '</p>';
  });
}

function send() {
  socket.emit('chat', document.getElementById('messageInput').value);
  document.getElementById('messageInput').value = '';
}
