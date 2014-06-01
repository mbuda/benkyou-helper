var express = require('express');
var ECT = require('ect');
var http = require('http');
var path = require('path');
var less = require('less-middleware');
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ect');
  app.engine('ect', ectRenderer.render);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
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

http.createServer(app).listen(3000, function() {
  console.log('Server on port: ' + app.get('port'));
});
