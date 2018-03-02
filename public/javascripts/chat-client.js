$(function() {
    // io-client
    // Connecting client to server using Socket.io
    var socket = io(); 

    // Click the input box to add a login name, press Enter button to access the chat room 
    $('#loginName').keyup((ev)=> {
      if(ev.which == 13) {
        inputName();
      }
    });
    $('#loginNameBtn').click(inputName);
    // Successfully login, hidden interface layer
    socket.on('loginSuc', ()=> { 
      $('.interface').hide(); 
    })
    socket.on('loginError', ()=> {
      alert('Username already exists, please try another one！');
      $('#loginName').val('');
    }); 

    function inputName() {
      var imgNumber = Math.floor(Math.random()*5)+1; // Randomly assign avatars
      if($('#loginName').val().trim()!=='')
          socket.emit('login', { 
            name: $('#loginName').val(),
            img: 'images/user' + imgNumber + '.png'
          });  // Trigger login event
      return false; 
    }

    // System prompt message
    socket.on('system', (user)=> { 
      var data = new Date().toTimeString().substr(0, 8);
      $('#messages').append(`<p class='system'><span>${data}</span><br /><span>${user.name}  ${user.status} the chat room<span></p>`);
      // Make sure the scroll bar is always at the bottom
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    // Display online user
    socket.on('displayUser', (usersInfo)=> {
      displayUser(usersInfo);
    });

    // Sending message
    $('#submit').click(sendMsg);
    $('#message').keyup((ev)=> {
      if(ev.which == 13) {  // Detect pressing Enter on keyboard using jQuery
        sendMsg();
      }
    });

    // Receiving message
    socket.on('receiveMsg', (obj)=> { 
      // Sending image
      if(obj.type == 'img') {
        $('#messages').append(`
          <li class='${obj.side}'>
            <img src="${obj.img}">
            <div>
              <span>${obj.name}</span>
              <p style="padding: 0;">${obj.msg}</p>
            </div>
          </li>
        `); 
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
        return;
      }

      // Extract the emoji in the text and re-render
      var msg = obj.msg;
      var content = '';
      while(msg.indexOf('[') > -1) {  // A silly way to extract the message
        var start = msg.indexOf('[');
        var end = msg.indexOf(']');

        content += '<span>'+msg.substr(0, start)+'</span>';
        content += '<img src="images/emoji/emoji%20('+msg.substr(start+6, end-start-6)+').png">';
        msg = msg.substr(end+1, msg.length);
      }
      content += '<span>'+msg+'</span>';
      
      $('#messages').append(`
        <li class='${obj.side}'>
          <img src="${obj.img}">
          <div>
            <span>${obj.name}</span>
            <p style="color: ${obj.color};">${content}</p>
          </div>
        </li>
      `);
      // Make sure the scroll bar is always at the bottom
      $('#messages').scrollTop($('#messages')[0].scrollHeight);
    }); 


    // Sending message
    var color = '#000000'; 
    function sendMsg() { 
      if($('#message').val() == '') {
        alert('Please enter the content !');
        return false;
      }
      color = $('#color').val(); 
      socket.emit('sendMsg', {
        msg: $('#message').val(),
        color: color,
        type: 'text'
      });
      $('#message').val(''); 
      return false; 
    }

    // Display online user
    function displayUser(users) {
      $('#users').text(''); // re-render
      if(!users.length) {
        $('.contacts p').show();
      } else {
        $('.contacts p').hide();
      }
      $('#total').text(users.length);
      for(var i = 0; i < users.length; i++) {
        var $html = `<li>
          <img src="${users[i].img}">
          <span>${users[i].name}</span>
        </li>`;
        $('#users').append($html);
      }
    }

    // Clean histoy
    $('#clean').click(()=> {
      $('#messages').text('');
      socket.emit('disconnect');
    });
 
    // Render emoji
    init();
    function init() {
      for(var i = 0; i < 141; i++) {
        $('.emoji').append('<li id='+i+'><img src="images/emoji/emoji ('+(i+1)+').png"></li>');
      }
    }

    // Display emoji
    $('#smile').click(()=> {
      $('.selectBox').css('display', "block");
    });
    $('#smile').dblclick((ev)=> { 
      $('.selectBox').css('display', "none");
    });  
    $('#message').click(()=> {
      $('.selectBox').css('display', "none");
    }); 

    // Click to send emoji
    $('.emoji li img').click((ev)=> {
        ev = ev || window.event;
        var src = ev.target.src;
        var emoji = src.replace(/\D*/g,'').substr(6, 8); // remove all non-numeric characters in a given string
        var old = $('#message').val();
        $('#message').val(old+'[emoji'+emoji+']');
        $('.selectBox').css('display', "none");
    });

    // Sending image
    $('#file').change(function() {
      var file = this.files[0];  
      // upload single image
      var reader = new FileReader();
      // Error message for failed to select image
      reader.onerror = function(){
          console.log('Failed to read the file, please try again!'); 
      };
      // Successfully selecting image
      reader.onload = function() {
        var src = reader.result;  
        var img = '<img class="sendImg" src="'+src+'">';
        socket.emit('sendMsg', {  // sending image
          msg: img,
          color: color,
          type: 'img'
        }); 
      };
      reader.readAsDataURL(file); 
    });
});