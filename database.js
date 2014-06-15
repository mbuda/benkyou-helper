/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL || 'redis://rediscloud:qwcjRddqcKcccaTP@pub-redis-15033.us-east-1-4.1.ec2.garantiadata.com:15033');
var redis = require('redis');
var rC = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});

rC.auth(redisURL.auth.split(':')[1]);

rC.on('error', function(err) {
  console.log('Err: ' + err);
});

rC.set('bg', 'https://dl.dropboxusercontent.com/u/259394896/kanji/1.jpg', function (err, reply) {
  console.log(reply.toString());
});

module.exports = {
  rC: rC
};

