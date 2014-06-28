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

/*
 * Sockets part of code
 */

// Draw game namespace //
io.of('/game').on('connection', function (socket) {

  var images = ['https://dl.dropboxusercontent.com/u/259394896/kanji/1.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/2.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/3.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/4.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/5.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/6.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/7.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/8.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/9.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/10.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/11.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/12.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/13.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/14.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/15.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/16.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/17.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/18.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/19.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/20.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/21.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/22.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/23.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/24.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/25.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/26.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/27.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/28.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/29.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/30.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/31.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/32.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/33.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/34.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/35.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/36.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/37.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/38.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/39.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/40.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/41.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/42.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/43.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/44.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/45.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/46.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/47.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/48.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/49.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/50.jpg'];

  socket.on('set bg', function () {
    rC.get('bg', function (err, reply) {
      var basicBg = reply.toString();
      // console.log('Get: ' + basicBg);
      socket.emit('bg set', basicBg);
    });
  });

  socket.on('change bg', function() {
    var randomBg = images[Math.floor(Math.random()*images.length)];
    rC.set('bg', randomBg, function (err, reply) {
      if(err) {
        console.log('Error occured: ' + err);
      }
      console.log(reply.toString());
    });
    rC.get('bg', function (err, reply) {
      if(err) {
        console.log('Error: ' + err);
      }
      var changedBg = reply.toString();
      // console.log('Changed to: ' + changedBg);
      io.of('/game').emit('bg set', changedBg);
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
      for(var i=0; i < imgs.length; i++) {
         //console.log('I am in loop ' + imgs[i]);
        rFile(imgs[i]);
      }
    });
  });
});

server.listen(port, function () {
  console.log('Server on port: ' + port);
});
