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
var sess = require('express-session');
var RedisStore = require('connect-redis')(sess);
var cookieParser = express.cookieParser('S3cr3t');

if (process.env.REDISTOGO_URL) {
  var rtg = require('url').parse(process.env.REDISTOGO_URL);
  var rC = redis.createClient(rtg.port, rtg.hostname);
  var redisClient = redis.createClient(rtg.port, rtg.hostname);
  var rClient = redis.createClient(rtg.port, rtg.hostname);
  var sub = redis.createClient(rtg.port, rtg.hostname);
  var pub = redis.createClient(rtg.port, rtg.hostname);

  rC.auth(rtg.auth.split(':')[1]);
  redisClient.auth(rtg.auth.split(':')[1]);
  rClient.auth(rtg.auth.split(':')[1]);
  pub.auth(rtg.auth.split(':')[1]);
  sub.auth(rtg.auth.split(':')[1]);
} else {
  var rC = redis.createClient();
  var redisClient = redis.createClient();
  var rClient = redis.createClient();
  var sub = redis.createClient();
  var pub = redis.createClient();
}

rC.on('error', function(err) {
  console.log('Err: ' + err);
});

redisClient.on('error', function(err) {
  console.log('Err: ' + err);
});

rClient.on('error', function(err) {
  console.log('Err: ' + err);
});

pub.on('error', function(err) {
  console.log('Err: ' + err);
});

sub.on('error', function(err) {
  console.log('Err: ' + err);
});

var sessionStore = new RedisStore({client:rClient});

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
    var images = ['https://www.dropbox.com/s/sn7hweh3e014cs5/1.jpg', 'https://www.dropbox.com/s/gurc25k6faz1yzf/2.jpg', 'https://www.dropbox.com/s/t5f8hyw8t7rdavf/3.jpg', 'https://www.dropbox.com/s/a7yhw9n7tee62m5/4.jpg', 'https://www.dropbox.com/s/3lk6ygzxbf0e7tt/5.jpg', 'https://www.dropbox.com/s/g8a366otxrdjsm9/6.jpg', 'https://www.dropbox.com/s/t9tmrwordkytt76/7.jpg', 'https://www.dropbox.com/s/uufxcx3g9wijlvk/8.jpg'];
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
