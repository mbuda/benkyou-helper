/*jshint globalstrict: true, devel: true, browser: true, jquery: true */
/* global io */
'use strict';

$(document).ready(function () {

    /*
     * user logged
     */
    function join(name) {
        $('#ask').hide();
        $('#channel').show();
        $('#chatters').show();
        $('input#message').focus();
        var intervalID;
        var reconnectCount = 0;

        /*
         Connect to socket.io on the server.
         */
        var host = window.location.host.split(':')[0];
        var socket = io.connect('http://' + host, {reconnect:false, 'try multiple transports':false});

        socket.on('connect', function () {
            console.log('connected');
        });
        socket.on('connecting', function () {
            console.log('connecting');
        });
        socket.on('disconnect', function () {
            console.log('disconnect');
            intervalID = setInterval(tryReconnect, 4000);
        });
        socket.on('connect_failed', function () {
            console.log('connect_failed');
        });
        socket.on('error', function (err) {
            console.log('error: ' + err);
        });
        socket.on('reconnect_failed', function () {
            console.log('reconnect_failed');
        });
        socket.on('reconnect', function () {
            console.log('reconnected ');
        });
        socket.on('reconnecting', function () {
            console.log('reconnecting');
        });

        var tryReconnect = function () {
            ++reconnectCount;
            if (reconnectCount === 5) {
                clearInterval(intervalID);
            }
            console.log('Making a dummy http call to set jsessionid (before we do socket.io reconnect)');
            $.ajax('/')
                .success(function () {
                    console.log('http request succeeded');
                    //reconnect the socket AFTER we got jsessionid set
                    socket.socket.reconnect();
                    clearInterval(intervalID);
                }).error(function () {
                    console.log('http request failed (probably server not up yet)');
                });
        };

        /*
         When the user Logs in, send a HTTP POST to server with user name.
         */
        $.post('/user', {'user':name})
            .success(function () {
                // send join message
                socket.emit('join', JSON.stringify({}));
            }).error(function () {
                console.log('error');
            });

        /*
         message comes from the server
         */
        var container = $('div#message-box');
        socket.on('chat', function (msg) {
            var message = JSON.parse(msg);

            var action = message.action;
            var struct = container.find('li.' + action + ':first');

            if (struct.length < 1) {
                console.log('Could not handle: ' + message);
                return;
            }

            // get a new message view from struct template
             var messageView = struct.clone();

            // set time
            messageView.find('.time').text((new Date()).toString('HH:mm:ss'));

            switch (action) {
                case 'message':
                    var matches;
                    // someone starts chat with /me ...
                    if (matches === message.msg.match(/^\s*[\/\\]me\s(.*)/)) {
                        messageView.find('.user').text(message.user + ' ' + matches[1]);
                        messageView.find('.user').css('font-weight', 'bold');
                        // normal chat message
                    } else {
                        messageView.find('.user').text(message.user);
                        messageView.find('.message').text(': ' + message.msg);
                    }
                    break;
                case 'control':
                    messageView.find('.user').text(message.user);
                    messageView.find('.message').text(message.msg);
                    messageView.addClass('control');
                    break;
            }

            // color own user:
            if (message.user === name) { messageView.find('.user').addClass('self'); }

            // append to container and scroll
            container.find('ul').append(messageView.show());
            container.scrollTop(container.find('ul').innerHeight());
        });

        /*
         * Display number of chatters
         */
        socket.on('update numChatters', function(num){
          $('#num').html(num + ' chatters.');
        });

        /*
         When the user creates a new chat message, send it to server via socket.emit w/ 'chat' event/channel name
         */
        $('#channel form').submit(function (event) {
            event.preventDefault();
            var input = $(this).find(':input');
            var msg = input.val();
            socket.emit('chat', JSON.stringify({action:'message', msg:msg}));
            input.val('');
        });

        /*
         * Display chatters list
         */
        var randomColor = Math.floor(Math.random()*16777215).toString(16);
        var insertChatter = function(name) {
          console.log(name + ' added to chat list.');
          var chatter = $('<li class=\'chatter\'style="color: #' + randomColor + ';">'+name+'</li>').data('name', name);
          $('#chatters').append(chatter);
        };

        /*
         * when someone join
         */
        socket.on('add chatter', insertChatter);

        var removeChatter = function(name) {
            $('chatters li').filter(function() { return $.text([this]) === name; }).remove();
        };

        /*
         * when someone leave
         */
        socket.on('remove chatter', removeChatter);

            }
    /*
     * loging user
     */
    var user = $('#user').text();
    if (user === '') {
        $('#ask').show();
        $('#ask input').focus();
    } else {
        join(user);
    }

    $('#ask input').keydown(function (event) {
        if (event.keyCode === 13) {
            $('#ask a').click();
        }
    });

    $('#ask a').click(function () {
        var name = $('#ask input').val();
        join(name);
    });
});
