/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

/*
 * require block
 */
var dropbox = require('dropbox');
var client = new dropbox.Client({
    key: '879girjuj51wsvi',
    secret: 'wz87axx1zxbpee5',
    token: 'HFsm8SpY_UgAAAAAAAABr7SEHN6Mehk0gOVtpOJTfqii2Pt_4tO8ZmQDCiS3w0T9',
});
var http = require('http');
var express = require('express');
var url = require('url');
var port = process.env.PORT || 3000;
var logfmt = require('logfmt');
var app = express();
var server = http.createServer(app);
var path = require('path');
var less = require('less-middleware');
var socketio = require('socket.io');
var io = socketio.listen(server);
var redisURL = url.parse(process.env.REDISCLOUD_URL || 'redis://rediscloud:qwcjRddqcKcccaTP@pub-redis-15033.us-east-1-4.1.ec2.garantiadata.com:15033');
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
  app.set('view engine', 'jade');             // set views engine
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

var showError = function(error) {
  switch (error.status) {
  case dropbox.ApiError.INVALID_TOKEN:
    // If you're using dropbox.js, the only cause behind this error is that
    // the user token expired.
    // Get the user through the authentication flow again.
    prompt('Your token has been expired, sorry.');
    break;

  case dropbox.ApiError.NOT_FOUND:
    // The file or folder you tried to access is not in the user's Dropbox.
    // Handling this error is specific to your application.
    prompt('File or folder not found');
    break;

  case dropbox.ApiError.OVER_QUOTA:
    // The user is over their Dropbox quota.
    // Tell them their Dropbox is full. Refreshing the page won't help.
    prompt('You have run out of quota. Your Dropbox is full.');
    break;

  case dropbox.ApiError.RATE_LIMITED:
    // Too many API requests. Tell the user to try again later.
    // Long-term, optimize your code to use fewer API calls.
    prompt('Too many requests, try again later');
    break;

  case dropbox.ApiError.NETWORK_ERROR:
    // An error occurred at the XMLHttpRequest layer.
    // Most likely, the user's network connection is down.
    // API calls will not succeed until the user gets back online.
    prompt('Your connection is dead probably');
    break;

  case dropbox.ApiError.INVALID_PARAM: break;
  case dropbox.ApiError.OAUTH_ERROR: break;
  case dropbox.ApiError.INVALID_METHOD: break;
  default:
    // Caused by a bug in dropbox.js, in your application, or in Dropbox.
    // Tell the user an error occurred, ask them to refresh the page.
  }
};

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

app.get('/links', function(req,res) {
  res.render('links');
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
  'https://dl.dropboxusercontent.com/u/259394896/kanji/13.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/14.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/15.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/16.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/17.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/18.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/19.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/20.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/21.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/22.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/23.jpg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/24.jpg',
  'https://dl.dropboxusercontent.com/u/259394896/kanji/25.jpg'];

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

  socket.on('write file', function(data) {
    var file = fileName();
    client.writeFile(file + '.png', data, function(error, stat) {
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


io.of('/gallery').on('connection', function (socket) {
  var rFile = function (img) {
    client.readFile(img, {arrayBuffer: true}, function (error, data) {
      if (error) {
        return showError(error);
      }
      socket.emit('get img', data);
      console.log('Image send');
    });
  };

  socket.on('images', function () {
    client.readdir('/', {removed: false }, function (error, imgs) {
      if (error) {
        return showError(error);
      }
      console.log('I get your message' + imgs);
      for(var i=0; i < imgs.length; i++) {
        console.log('I am in loop' + imgs[i]);
        rFile(imgs[i]);
      }
    });
  });
});

server.listen(port, function () {
  console.log('Server on port: ' + port);
});
