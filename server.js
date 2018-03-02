var express = require('express');
var app = express();
var http = require('http').Server(app);
// io-server
var io = require("socket.io")(http);

var users = []; // store login user
var usersInfo = [];  // store login username and profile 

// default routing static /public folder 
app.use('/', express.static(__dirname + '/public'));
 
// Every connected user has a proprietary socket
/* 
   io.emit(foo); //sending to all clients, include sender
   socket.emit(foo); //sending to sender-client only
   socket.broadcast.emit(foo); //send to all connected clients except the one that sent the message
*/
io.on('connection', (socket)=> {
    // Render online user
    io.emit('displayUser', usersInfo);

    //event listener, can be called on client to execute on server; login and check the user name
    socket.on('login', (user)=> {
        if(users.indexOf(user.name) > -1) { 
            socket.emit('loginError');
        } else {
            users.push(user.name);
            usersInfo.push(user);

            socket.emit('loginSuc');
            socket.nickname = user.name;
            io.emit('system', {
                name: user.name,
                status: 'enter'
            });
            io.emit('displayUser', usersInfo);
            console.log(users.length + ' user connect.');
        }
    });

    // Sending and getting data
    socket.on('sendMsg', (data)=> {
        var img = '';
        for(var i = 0; i < usersInfo.length; i++) {
            if(usersInfo[i].name == socket.nickname) {
                img = usersInfo[i].img;
            }
        }
        socket.broadcast.emit('receiveMsg', {
            name: socket.nickname,
            img: img,
            msg: data.msg,
            color: data.color,
            type: data.type,
            side: 'left'
        });
        socket.emit('receiveMsg', {
            name: socket.nickname,
            img: img,
            msg: data.msg,
            color: data.color,
            type: data.type,
            side: 'right'
        });
    });  

    // When disconnect
    socket.on('disconnect', ()=> {
        var index = users.indexOf(socket.nickname); 
        if(index > -1 ) {  //avoid undefined
            users.splice(index, 1);  // delete login user info
            usersInfo.splice(index, 1);  // delete login user info

            io.emit('system', {  // notification from system
                name: socket.nickname,
                status: 'left'
            });
            
            io.emit('displayUser', usersInfo);  // re-rendering
            console.log('a user left.');
        }
    });
});

http.listen(3000, function() {
    console.log('listen 3000 port.');
});