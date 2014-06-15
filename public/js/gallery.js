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

  var hideSpinner = function () {
    $('#loader').hide();
  };

  socket.on('connect', function() {
    $('#loader').show();
    socket.emit('images');
    // console.log('I want images');
  });

  socket.on('get img', function (data) {
    // console.log('I will add image');
    var spinnerShowTime = 5000;
    var img = new Image();
    img.src = 'data:image/png;base64,' + arrayBufferToBase64(data);
    setTimeout(hideSpinner, spinnerShowTime);
    $('#gallery').append('<img src="' + img.src + '"/>');
  });
});
