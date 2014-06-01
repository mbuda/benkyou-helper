var express = require('express');
var http = require('http');
var path = require('path');
var app = express();

app.use(express.favicon());
app.use(express.json());
app.use(express.urlencoded());
app.use(app.router);
app.use(express.static('app'));
app.use(express.static('bower_components'));

app.get('/', function(req, res) {
  res.redirect('/index.html');
});

if ('development' == app.get('env')) {
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
};

http.createServer(app).listen(3000, function() {
  console.log('Serwer działa na porcie 3000');
});
