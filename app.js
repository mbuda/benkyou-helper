/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

/*
 * require block
 */

var drop = require('./dropbox');
var client = drop.client;
var showError = drop.showError;

var db = require('./database');
var rC = db.rC; // redis Client

var http = require('http');
var express = require('express');

var app = express();
var server = http.createServer(app);

var port = process.env.PORT || 3000;

var socketio = require('socket.io');
var io = socketio.listen(server);

require('./config')(app);

require('./routes')(app);

var fileName = function () {
  return '_' + Math.random().toString(36).substr(2,9);
};

//write all kanji to redis bgs set
client.readdir('kanji', {removed: false }, function (error, imgs) {
  if (error) {
    return showError(error);
  }
  for(var i=0, img; (img = imgs[i++]) !== null;) {
    rC.sadd('bgs', img, function (err, reply) {
      if (err) {
        console.log('Error occured when writing bgs: ' + err);
      }
      console.log('Successfully added: ' + reply);
    });
  }
});

/*
 * Sockets part of code
 */

// Draw game namespace //
io.of('/game').on('connection', function (socket) {
  socket.on('set bg', function () {
    rC.get('bg', function (err, reply) {
      if (err) {
        console.log('Error when setting bg ' + err);
      }
      client.readFile('kanji/' + reply, {arrayBuffer: true}, function (error, data) {
        if (error) {
          return showError(error);
        }
        socket.emit('bg set', data);
      });
    });
  });

  socket.on('change bg', function() {
    rC.send_command('SRANDMEMBER', ['bgs', 1], function (err, reply) {
      if (err) {
        console.log('Something went wrong with srandmember ' + err);
      }
      console.log('Success: ' + reply);
      rC.set('bg', reply, function (err, reply) {
        if (err) {
          console.log('Error when adding bg data ' + err);
        }
        console.log('Success: ' + reply);
      });
      client.readFile('kanji/' + reply, {arrayBuffer: true}, function (error, data) {
        if (error) {
          return showError(error);
        }
        console.log(data + ' data');
        io.of('/game').emit('bg set', data);
      });
    });
  });

  socket.on('write file', function(data) {
    var file = fileName();
    client.writeFile('./gallery/' + file + '.png', data, function(error, stat) {
      if(error) {
        return console.log('Error: ' + showError(error));
      }
      console.log('Image ' + file + ' successfully write on Dropbox.');
      console.log('Stats: ' + stat);
    });
  });

  socket.on('mousemove', function (data) {
    io.of('/game').emit('moving', data);
  });
});

// Gallery namespace //
io.of('/gallery').on('connection', function (socket) {
  var rFile = function (img) {
    client.readFile('gallery/' + img, {arrayBuffer: true}, function (error, data) {
      if (error) {
        return showError(error);
      }
      socket.emit('get img', data);
      console.log('Image send');
    });
  };

  socket.on('images', function () {
    console.log('i get it');
    client.readdir('gallery', {removed: false }, function (error, imgs) {
      if (error) {
        return showError(error);
      }
      //console.log('I get your message' + imgs);
      for(var i=0, img; (img = imgs[i++]) !== null;) {
         //console.log('I am in loop ' + imgs[i]);
        rFile(imgs[i]);
      }
    });
  });
});

server.listen(port, function () {
  console.log('Server on port: ' + port);
});
