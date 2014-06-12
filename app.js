/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

/*
 * require block
 */
var fs = require('fs');
var http = require('http');
var express = require('express');
var url = require('url');
var port = process.env.PORT || 3000;
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var logfmt = require('logfmt');
var app = express();
var server = http.createServer(app);
var path = require('path');
var less = require('less-middleware');
var socketio = require('socket.io');
var io = socketio.listen(server);
var redis = require('redis');
var rC = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
rC.auth(redisURL.auth.split(':')[1]);

rC.on('error', function(err) {
  console.log('Err: ' + err);
});

/*
 *  configuration
 */

app.configure(function() {
  app.set('views', __dirname + '/views');     // set views directory
  app.set('view engine', 'jade');              // set views engine
  app.use(logfmt.requestLogger());
  app.use(express.favicon());                 // favicon load
  app.use(express.logger('dev'));             // logger on development environment
  app.use(express.bodyParser());              // bodyParser
  app.use(express.methodOverride());          // methodOverride
  app.use(less(path.join(__dirname, 'src', 'less'), {   // less-middleware config, where less is
    dest: path.join(__dirname, 'public'),               // where to write css
    preprocess: {                                       // preprocess to
      path: function(pathname) {                        // avoid css subfolder
        return pathname.replace('/css', '');
      }
    },
    compress: true                                      // compress css
  }));
  app.use(express.static(path.join(__dirname, 'public')));    //set public dir
  app.use('/img', express.static(__dirname + '/public/img'));
  app.use('/img',express.directory(__dirname + '/public/img'));
  app.use('/bower_components', express.static(path.join(__dirname, '/app/bower_components')));
});

/*
 * Error handler for development
 */

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

/*
 * Routes
*/

app.get('/', function (req, res){
  res.render('index', { title:'Benkyou Helper' });
});
app.get('/contact', function (req, res){
  res.render('contact');
});
app.get('/about', function (req, res){
  res.render('about');
});

app.get('/game', function(req, res) {
  res.render('game');
});

app.get('/gallery', function(req,res) {
  res.render('gallery');
});

rC.set('bg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/1.jpg', function (err, reply) {
  console.log(reply.toString());
});

var fileName = function () {
  return '_' + Math.random().toString(36).substr(2,9);
};
/*
 * Sockets part of code
 */

// Draw game
io.of('/game').on('connection', function (socket) {

  var images = ['https://dl.dropboxusercontent.com/u/259394896/kanji/1.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/2.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/3.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/4.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/5.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/6.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/7.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/8.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/9.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/10.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/11.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/12.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/13.jpg'];
  socket.on('set bg', function () {
    rC.get('bg', function (err, reply) {
      var basicBg = reply.toString();
      console.log(basicBg);
      socket.emit('bg set', basicBg);
    });
  });

  socket.on('change bg', function() {
    var randomBg = images[Math.floor(Math.random()*images.length)];
    rC.set('bg', randomBg, function (err, reply) {
      console.log(reply.toString());
    });
    rC.get('bg', function (err, reply) {
      var changedBg = reply.toString();
      console.log(changedBg);
      io.of('/game').emit('bg set', changedBg);
    });
  });

  socket.on('save img', function (data) {
    var img = data;
    var base = img.replace(/^data:image\/\w+;base64,/, '');
    var buf = new Buffer(base, 'base64');
    fs.writeFile('./public/img/' + fileName() + '.png', buf);
  });

  socket.on('mousemove', function (data) {
    socket.broadcast.emit('moving', data);
  });
});

server.listen(port, function () {
  console.log('Server on port: ' + port);
});
