/*jshint globalstrict: true, devel: true, browser: true, jquery: true */
/* global io */
'use strict';

$(document).ready(function () {

  $('#show-hiragana').click(function() {
    $('#hiragana').slideToggle('slow');
  });

  // Your browser need to support canvas element
  if(!('getContext' in document.createElement('canvas'))){
    alert('Sorry. your browser does not support canvas!');
    return false;
  }

  var url = window.location.hostname + '/game';
  // some variables for canvas
  var doc = jQuery(document),
  canvas = jQuery('#paper'),
  ctx = canvas[0].getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;

  // Generate an unique ID
  var id = Math.round(jQuery.now()*Math.random());

  //Generate a random color
  var r = Math.floor(Math.random() * 255) + 70;
  var g = Math.floor(Math.random() * 255) + 70;
  var b = Math.floor(Math.random() * 255) + 70;
  var color = 'rgb(' + r + ',' + g + ',' + b + ')';

  // A flag for drawing activity
  var drawing = false;

  var clients = {};
  //socket connection
  var socket = io.connect(url);

  var base64ToArrayBuffer = function (stringBase64) {
    var binaryString = window.atob(stringBase64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for(var i = 0; i < len; i++) {
      var ascii = binaryString.charCodeAt(i);
      bytes[i]=ascii;
    }
    return bytes.buffer;
  };

  var arrayBufferToDataUri = function (buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return 'data:image/jpeg;base64,' + window.btoa(binary);
  };

  //on connect inform server you want bg for canvas
  socket.on('connect', function () {
    socket.emit('set bg');
  });

  //set received bg on canvas
  socket.on('bg set', function(data) {
    console.log('Wow: ' + data);
    var img = new Image();
    console.log('Buffer: ' + arrayBufferToDataUri(data));
    img.src = arrayBufferToDataUri(data);
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
    };
  });

  //moving from another sockets
  socket.on('moving', function (data) {

    // Is the user drawing?
    if(data.drawing && clients[data.id]){

      // Draw a line on the canvas. clients[data.id] holds
      // the previous position of this user's mouse pointer

      ctx.strokeStyle = data.color;
      drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
    }

    // Saving the current client state
    clients[data.id] = data;
    clients[data.id].updated = jQuery.now();
  });

  var prev = {};

  function touchHandler(event)
  {
    var touches = event.changedTouches,
        first = touches[0],
        type = '';
    switch(event.type)
    {
      case 'touchstart':
        type = 'mousedown';
        break;
      case 'touchmove':
        type = 'mousemove';
        break;
      case 'touchend':
        type = 'mouseup';
        break;
      case 'touchcancel':
        type = 'mouseup';
        break;
      default:
        return;
    }

    var simulatedEvent = document.createEvent('MouseEvent');
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
        first.screenX, first.screenY,
        first.clientX, first.clientY, false,
        false, false, false, 0, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
  }
  document.addEventListener('touchstart', touchHandler, true);
  document.addEventListener('touchmove', touchHandler, true);
  document.addEventListener('touchend', touchHandler, true);
  document.addEventListener('touchcancel', touchHandler, true);

  canvas.on('mousedown', function(e){
    e.preventDefault();
    drawing = true;
    // console.log('PageX: ' + e.pageX + 'pageY: ' + e.pageY);
    prev.x = e.pageX;
    prev.y = e.pageY;
  });

  doc.bind('mouseup mouseleave', function(){
    drawing = false;
  });

  var lastEmit = jQuery.now();

  doc.on('mousemove', function(e){
    if(jQuery.now() - lastEmit > 30){
      socket.emit('mousemove',{
        'x': e.pageX,
        'y': e.pageY,
        'drawing': drawing,
        'color': color,
        'id': id
      });
      lastEmit = jQuery.now();
    }

    // Draw a line for the current user's movement, as it is
    // not received in the socket.on('moving') event above

    if(drawing){

      ctx.strokeStyle = color;
      drawLine(prev.x, prev.y, e.pageX, e.pageY);
      prev.x = e.pageX;
      prev.y = e.pageY;
    }
  });

  function drawLine(fromx, fromy, tox, toy){
    var canvasOffset = canvas.offset();
    ctx.beginPath();
    ctx.moveTo(fromx - canvasOffset.left, fromy - canvasOffset.top);
    ctx.lineTo(tox - canvasOffset.left, toy - canvasOffset.top);
    ctx.stroke();
  }

  $('#save_img').click( function () {
      console.log('Image saved.');
      var img = canvas[0].toDataURL('image/png');
      console.log('Base: ' + img);
      $('#images').append('<img src="' + img + '"/>');
      var base = img.replace(/^data:image\/\w+;base64,/, '');
      console.log('Base64: ' + base);
      var imgData = base64ToArrayBuffer(base);
      console.log('ImgData: ' + imgData);
      socket.emit('write file', imgData);
      $('#save_img').show();
  });

  $('#change_bg').click(function () {
      socket.emit('change bg');
  });

  $('#bigger_brush').click(function () {
ctx.lineWidth += 1;
  });

  $('#smaller_brush').click(function () {
ctx.lineWidth -= 1;
  });

});
