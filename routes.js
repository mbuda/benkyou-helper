/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

module.exports = function(app){

  app.get('/', function (req, res){
    res.render('index');
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
};
