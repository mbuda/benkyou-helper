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
