var http = require('http');
var express = require('express');
var app = express();
var httpServer = http.createServer(app);
var ECT = require('ect');
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });
var path = require('path');
var less = require('less-middleware');
var socket = require('socket.io');
var io = socket.listen(httpServer);
var _ = require("underscore");
var redis = require('redis');
var redisClient = redis.createClient();
var sess = require('express-session');
var RedisStore = require('connect-redis')(sess);
var rClient = redis.createClient();
var sessionStore = new RedisStore({client:rClient});
var cookieParser = express.cookieParser('S3cr3t');

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ect');
  app.engine('ect', ectRenderer.render);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(cookieParser);
  app.use(express.session({store:sessionStore, key:'jsessionid', secret:'S3cr3t'}));
  app.use(less(path.join(__dirname, 'src', 'less'), {
    dest: path.join(__dirname, 'public'),
    preprocess: {
      path: function(pathname, req) {
        return pathname.replace('/css', '');
      }
    },
    compress: true
  }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/bower_components', express.static(path.join(__dirname, '/app/bower_components')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

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
  req.session.regenerate(function (err) {
    req.session.user = user;
    res.render('chat', {user:req.session.user});
  });
});

app.post('/user', function(req,res) {
  req.session.user = req.body.user;
  res.json({"error": ""});
});

var SessionSockets = require('session.socket.io');
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser, 'jsessionid');

var numChatters = 0;
var chatters = [];
var sub = redis.createClient();
var pub = redis.createClient();
sub.subscribe('chat');

sessionSockets.on('connection', function (err, socket, session) {
    if(!session.user) return;

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
        names.forEach(function(name) {
          socket.emit('add chatter', name);
        });
      redisClient.sadd("chatters", session.user);
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
      redisClient.srem("chatters", session.user);
    });
});
var port = app.get('port');

httpServer.listen(port, function() {
  console.log("Server is listening on port: " + port);
});
