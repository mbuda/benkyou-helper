/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

/*
 * require block
 */
var http = require('http');
var express = require('express');
var logfmt = require('logfmt');
var app = express();
var server = http.createServer(app);
var path = require('path');
var less = require('less-middleware');
var socketio = require('socket.io');
var io = socketio.listen(server);
var redis = require('redis');

if (process.env.REDISTOGO_URL) {
  var rtg = require('url').parse(process.env.REDISTOGO_URL);
  var rC = redis.createClient(rtg.port, rtg.hostname);

  rC.auth(rtg.auth.split(':')[1]);
} else {
  var rC = redis.createClient();
}

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

rC.set('bg', 'https://db.tt/9xBNPLbq', function (err, reply) {
  console.log(reply.toString());
});

/*
 * Sockets part of code
 */

// Draw game
io.of('/game').on('connection', function (socket) {

  var images = ['https://db.tt/9xBNPLbq', 'https://db.tt/FD7Nt7Qg', 'https://db.tt/QYyycDix', 'https://db.tt/plJ1vSdp', 'https://db.tt/OyMurvM0', 'https://db.tt/p8MdJW6o', 'https://db.tt/62BhYHtX', 'https://db.tt/YpVSWPjA'];
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


  socket.on('mousemove', function (data) {
    socket.broadcast.emit('moving', data);
  });
});

var port = process.env.port || 3000;
server.listen(port, function () {
  console.log('Server on port: ' + port);
});
