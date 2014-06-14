/*jshint globalstrict: true, devel: true, browser: true, jquery: true */
/* global io */
'use strict';

$(document).ready(function () {

  var url = window.location.hostname + '/gallery';
  var socket = io.connect(url);

  var arrayBufferToBase64 = function (buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  socket.on('connect', function() {
    socket.emit('images');
    console.log('I want images');
  });

  socket.on('get img', function (data) {
    console.log('I will add image');
    var img = 'data:image/png;base64,' + arrayBufferToBase64(data);
    $('#gallery').append('<img src="' + img + '"/>');
  });

});
