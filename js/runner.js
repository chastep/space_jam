//  Create the starfield.
var container = document.getElementById('starfield');
var starfield = new Starfield();
starfield.initialize(container);
starfield.start();
 
//  Setup the canvas.
// var canvas = document.getElementById("gameCanvas");
// canvas.width = window.innerWidth;
// console.log(canvas.width);
// canvas.height = window.innerHeight;
// console.log(canvas.height);
 
//  Create the game.
// var game = new Game();
 
//  Initialise it with the game canvas.
// game.initialize(canvas);
 
//  Start the game.
// game.start();
 
//  Listen for keyboard events.
window.addEventListener("keydown", function keydown(e) {
  var keycode = e.which || window.event.keycode;
  //  Supress further processing of left/right/space (37/29/32)
  if(keycode == 37 || keycode == 39 || keycode == 32) {
      e.preventDefault();
  }
  game.keyDown(keycode);
});
window.addEventListener("keyup", function keydown(e) {
  var keycode = e.which || window.event.keycode;
  game.keyUp(keycode);
});