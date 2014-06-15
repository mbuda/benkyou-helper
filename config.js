/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

var express = require('express');
var path = require('path');
var logfmt = require('logfmt');
var less = require('less-middleware');

module.exports = function(app) {

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
};
