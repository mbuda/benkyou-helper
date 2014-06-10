/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

/*
 * require block
 */
var http = require('http');
var express = require('express');
var logfmt = require('logfmt');
var app = express();
var httpServer = http.createServer(app);
var path = require('path');
var less = require('less-middleware');
var socket = require('socket.io');
var io = socket.listen(httpServer);
var _ = require('underscore');
var redis = require('redis');
var rC = redis.createClient();
var redisClient = redis.createClient();
var sess = require('express-session');
var RedisStore = require('connect-redis')(sess);
var rClient = redis.createClient();
var sessionStore = new RedisStore({client:rClient});
var cookieParser = express.cookieParser('S3cr3t');

/*
 *  configuration
 */

app.configure(function() {
  app.set('port', process.env.PORT || 3000);  // set port
  app.set('views', __dirname + '/views');     // set views directory
  app.set('view engine', 'jade');              // set views engine
  app.use(logfmt.requestLogger());
  app.use(express.favicon());                 // favicon load
  app.use(express.logger('dev'));             // logger on development environment
  app.use(express.bodyParser());              // bodyParser
  app.use(express.methodOverride());          // methodOverride
  app.use(cookieParser);                      // cookieParser
  app.use(express.session({store:sessionStore, key:'jsessionid', secret:'S3cr3t'}));  //session set
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
  app.use(express.errorHandler());
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

app.get('/chat', function (req, res){
  var user = req.session.user;
  req.session.regenerate(function () {
    req.session.user = user;
    res.render('chat', {user:req.session.user});
  });
});

app.get('/game', function(req, res) {
  res.render('game');
});

app.post('/user', function(req,res) {
  req.session.user = req.body.user;
  res.json({'error': ''});
});

/*
 * Session sockets vars
 */

var SessionSockets = require('session.socket.io');
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser, 'jsessionid');

/*
 * Some vars for chat
 */

var numChatters = 0;
var sub = redis.createClient();
var pub = redis.createClient();
sub.subscribe('chat');

rC.set('bg', '1.jpg', function (err, reply) {
  console.log(reply.toString());
});

/*
 * Sockets part of code
 */

// Draw game
io.of('/game').on('connection', function (socket) {

  socket.on('set bg', function () {
    rC.get('bg', function (err, reply) {
      var basicBg = reply.toString();
      console.log(basicBg);
      socket.emit('bg set', basicBg);
    });
  });

  socket.on('change bg', function() {
    var images = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'];
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

// Chat
sessionSockets.on('connection', function (err, socket, session) {
    if(!session.user) { return; }

    socket.on('chat', function (data) {
      var msg = JSON.parse(data);
      var reply = JSON.stringify({action:'message', user:session.user, msg:msg.msg });
        pub.publish('chat', reply);
    });

    socket.on('join', function () {
      var reply = JSON.stringify({action :'control', user:session.user, msg:' joined the channel' });
      pub.publish('chat', reply);
      ++numChatters;
      io.sockets.emit('update numChatters', numChatters);
      io.sockets.emit('add chatter', session.user);
      redisClient.smembers('chatters', function(err, names) {
        _.each(names, function(name) {
          socket.emit('add chatter', name);
        });
      redisClient.sadd('chatters', session.user);
      });
    });
    sub.on('message', function (channel, message) {
        socket.emit(channel, message);
    });

    socket.on('disconnect', function() {
      var reply = JSON.stringify({action:'control', user:session.user, msg:' leaved the channel' });
      pub.publish('chat', reply);
      --numChatters;
      io.sockets.emit('update numChatters', numChatters);
      io.sockets.emit('remove chatter', session.user);
      redisClient.srem('chatters', session.user);
    });
});
var port = app.get('port');

httpServer.listen(port, function() {
  console.log('Server is listening on port: ' + port);
});
