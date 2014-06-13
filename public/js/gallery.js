/*jshint globalstrict: true, devel: true, browser: true, jquery: true */
'use strict';

$(document).ready(function () {

  var dir = 'img';
  var fileextension = '.png';
  $.ajax({
    url: dir,
    success: function (data) {
      $(data).find('a:contains(' + fileextension + ')').each(function () {
        var filename = this.href.replace(window.location.host, '').replace('http:///','');
        $('#gallery').append($('<img src=' + filename + '></img>'));
      });
    }
  });

});
