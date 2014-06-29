/*jshint globalstrict: true, devel: true, browser: true */
'use strict';

var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL || 'redis://rediscloud:qwcjRddqcKcccaTP@pub-redis-15033.us-east-1-4.1.ec2.garantiadata.com:15033');
var redis = require('redis');
var rC = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});

//redis.debug_mode = true;

rC.auth(redisURL.auth.split(':')[1]);

rC.on('error', function(err) {
  console.log('Err: ' + err);
});

module.exports = {
  rC: rC
};

