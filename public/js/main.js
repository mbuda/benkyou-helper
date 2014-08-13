/*jshint globalstrict: true, devel: true, browser: true */
console.log('Benkyou Helper welcomes you!');

$(document).ready(function () {
  $('.nav li').hover(function(){
    if(!$(this).hasClass('animated')) {
      $(this).dequeue().stop().animate({bottom: '10px', right: '7px'});
    }
  }, function() {
    $(this).addClass('animated').animate({bottom: '0px', right: '0px'}, 'normal', 'linear', function() {
      $(this).removeClass('animated').dequeue();
    });
  });

  /* I want these hearts to beat on hover but do not now how to repeat it
  $('.footer').hover(function() {
    if(!$('.glyphicon-heart').hasClass('animated')) {
      $('.glyphicon-heart').dequeue().stop().animate({fontSize: '18px', top: '4px'});
    }
  }, function() {
    $('.glyphicon-heart').addClass('animated').animate({fontSize: '14px', top: '0'}, 'normal', 'linear', function() {
      $('.glyphicon-heart').removeClass('animated').dequeue();
    });
  });
  */

  //panels all over the site
  $('.list-group-item').hover(function(){
    if(!$(this).hasClass('animated')) {
      $(this).dequeue().stop().animate({left: '10px'});
    }
  }, function() {
    $(this).addClass('animated').animate({left: '0px'}, 'normal', 'linear', function() {
      $(this).removeClass('animated').dequeue();
    });
  });

});
