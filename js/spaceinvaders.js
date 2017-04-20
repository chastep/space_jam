// Create an instance of the Game 'class'
function Game() {

  // initial config
  this.config = {
    bombRate: 0.01,
    bombMinVelocity: 100,
    bombMaxVelocity: 150,
    invaderInitialVelocity: 40,
    invaderAcceleration: 0,
    invaderDropDistance: 25,
    rocketVelocity: 275,
    rocketMaxFireRate: 3,
    gameWidth: 1000,
    gameHeight: 300,
    fps: 50,
    debugMode: false,
    invaderRanks: 5,
    invaderFiles: 50,
    shipSpeed: 300,
    levelDifficultyMultiplier: 0.5,
    pointsPerInvader: 5
  };

  // all the constant state variables are defined below
  this.lives = 3;
  this.width = 0;
  this.height = 0;
  this.gameBound = {left: 0, top: 0, right: 0, bottom: 0};
  this.intervalId = 0;
  this.score = 0;
  this.level = 1;

  // state stack
  this.stateStack = [];

  // input/output
  this.pressedKeys = {};
  this.gameCanvas = null;

}

Game.prototype.initialize = function(gameCanvas) {

  // set the game canvas
  this.gameCanvas = gameCanvas;
  // set the game width and height
  this.width = gameCanvas.width;
  this.height = gameCanvas.height;
  // set the state game bounds
  this.gameBounds = {
    left: gameCanvas.width / 2 - this.config.gameWidth / 2,
    right: gameCanvas.width / 2 + this.config.gameWidth / 2,
    top: gameCanvas.height / 2 - this.config.gameHeight / 2,
    bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
  };
  console.log(this.gameBounds);

}

// return the current state
Game.prototype.currentState = function() {
  return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
};

// moving the state of the game
Game.prototype.moveToState = function(state) {
  // if we are in a state
  if(this.currentState()) {
    // do this
    // check to see if the state has a leave function
    // if it does then call it on the current game
    if(this.currentState().leave) {
      this.currentState().leave(game);
    }
    this.stateStack.pop();
  }
  // if there is an enter function for the new state, call it plz
  if(state.enter) {
    state.enter(game);
  } 
  // set the current state
  this.stateStack.push(state);

};
 
Game.prototype.pushState = function(state) {
    // If there's an enter function for the new state, call it.
    if(state.enter) {
      state.enter(game);
    }
    // Set the current state.
    this.stateStack.push(state);

};
 
Game.prototype.popState = function() {
  // Leave and pop the state.
  if(this.currentState()) {
    if(this.currentState().leave) {
      this.currentState().leave(game);
    }
    // Set the current state.
    this.stateStack.pop();
  }

};

function gameLoop(game) {
  var currentState = game.currentState();
  if(currentState) {
    // time to update/draw the active state of the game
    var dt = 1 / game.config.fps;
    // get the drawing content
    var ctx = game.gameCanvas.getContext("2d");
    // update and also draw if we have the functions present
    if(currentState.update) {
      currentState.update(game, dt);
    }
    if(currentState.draw) {
      currentState.draw(game, dt, ctx);
    }
  }
};

// start the game
Game.prototype.start = function() {
  // move into the 'welcome state'
  this.moveToState(new WelcomeState());
  //  Set the game variables.
  this.lives = 2;
  this.config.debugMode = /debug=true/.test(window.location.href);
  //  Start the game loop.
  var game = this;
  this.intervalId = setInterval(function () { gameLoop(game);}, 1000 / this.config.fps);
}

// WELCOME STATE / STARTING PAGE
function WelcomeState() {

};

WelcomeState.prototype.draw = function(game, dt, ctx) {
  // clear the background upon start
  ctx.clearRect(0, 0, game.width, game.height);

  ctx.font="30px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline="center";
  ctx.textAlign="center";
  ctx.fillText("Space Invaders yah FOOL", game.width / 2, game.height/2 - 40);
  ctx.font="16px Arial";

  ctx.fillText("Press 'Space' to start.", game.width/2, game.height/2)

};

WelcomeState.prototype.keyDown = function(game, keyCode) {
  if(keyCode == 32) /*space key*/ {
    //  Space starts the game.
    game.moveToState(new LevelIntroState(game.level));
  }

};

// INFORM GAME IF A KEY IS PRESSED, DOWN OR UP
Game.prototype.keyDown = function(keyCode) {
  this.pressedKeys[keyCode] = true;
  // change the current state
  if(this.currentState() && this.currentState().keyDown) {
    this.currentState().keyDown(this, keyCode);
  }

};

Game.prototype.keyUp = function(keyCode) {
  delete this.pressedKeys[keyCode];
  if(this.currentState() && this.currentState().keyUp) {
    this.currentState().keyUp(this, keyCode);
  }

};



// LEVEL INTRO STATE
// SHOWS LEVEL MESSAGE AND THEN COUNTDOWN TIL START
function LevelIntroState(level) {
  this.level = level;
  this.countdownMessage = "3";
};

LevelIntroState.prototype.draw = function(game, dt, ctx) {
  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);
  ctx.font="36px Arial";
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline="middle"; 
  ctx.textAlign="center"; 
  ctx.fillText("Level " + this.level, game.width/2, game.height/2);
  ctx.font="24px Arial";
  ctx.fillText("Ready in " + this.countdownMessage, game.width/2, game.height/2 + 36);

};

LevelIntroState.prototype.update = function(game, dt) {
  // update the countdown
  if(this.countdown === undefined) {
    this.countdown = 3;
  }
  this.countdown -= dt;

  if(this.countdown < 2) {
    this.countdownMessage = "2";
  }
  if(this.countdown < 1) {
    this.countdownMessage = "1";
  }
  if(this.countdown <= 0) {
    game.moveToState(new PlayState(game.config, this.level));
  }

};



// PLAY STATE
// CREATE THIS STATE WITH THE GAME CONFIG AND LEVEL PLAYER IS ON
function PlayState(config, level) {
  this.config = config;
  this.level = level;
  // game state
  this.invaderCurrentVelocity = 25;
  this.invaderCurrentDropDistance = 0;
  this.invadersAreDropping = false;
  this.lastRocketTime = null;
  // game entities
  this.ship = null;
  this.invaders = [];
  this.rockets = [];
  this.bombs = [];
};

// game variables/objects

function Ship(x, y) {
  this.x = x;
  this.y = y;
  this.width = 15;
  this.height = 12;
};

function Rocket(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
  this.width = 2;
  this.height = 4;
};

function Bomb(x, y, velocity) {
  this.x = x;
  this.y = y;
  this.velocity = velocity;
};

function Invader(x, y, rank, file, type) {
  this.x = x;
  this.y = y;
  this.rank = rank;
  this.file = file;
  this.type = type;
  this.width = 30;
  this.height = 15;
};

PlayState.prototype.enter = function(game) {
  this.ship = new Ship(game.width/2, game.gameBounds.bottom);
  // sets the ship speed for this level, as well as invader params
  var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
  this.shipSpeed = this.config.shipSpeed;
  this.invaderInitialVelocity = this.config.invaderInitialVelocity + (levelMultiplier * this.config.invaderInitialVelocity);
  this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
  this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
  this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);
  // creates the invaders
  var ranks = this.config.invaderRanks;
  var files = this.config.invaderFiles;
  var invaders = [];
  for(var rank = 0; rank < ranks; rank++){
    for(var file = 0; file < files; file++) {
      invaders.push(new Invader((game.width / 2) + ((files/2 - file) * 400 / files), (game.gameBounds.top + rank * 40), rank, file, 'Invader'));
    }
  }
  this.invaders = invaders;
  this.invaderCurrentVelocity = this.invaderInitialVelocity;
  this.invaderVelocity = {x: -this.invaderInitialVelocity, y:0};
  this.invaderNextVelocity = null;
};

PlayState.prototype.update = function(game, dt) {
  // move ship with left and right arrow keys
  // this is tied to ticks rather than keydown events
  // makes movement smooth
  // left arrow
  if(game.pressedKeys[37]) {
    this.ship.x -= this.shipSpeed*dt;
  }
  // right arrow
  if(game.pressedKeys[39]) {
    this.ship.x += this.shipSpeed*dt; 
  }
  // up arrow
  if(game.pressedKeys[38]) {
    this.ship.y -= this.shipSpeed*dt;
  }
  // down arrow
  if(game.pressedKeys[40]) {
    this.ship.y += this.shipSpeed*dt; 
  }
  // spacebar
  if(game.pressedKeys[32]) {
    this.fireRocket();
  }
  //  Keep the ship in bounds.
  // if(this.ship.x < game.gameBounds.left) {
  //   this.ship.x = game.gameBounds.left;
  // }
  // if(this.ship.x > game.gameBounds.right) {
  //   this.ship.x = game.gameBounds.right;
  // }
  // move each bomb
  for(var i=0; i<this.bombs.length; i++) {
    var bomb = this.bombs[i];
    bomb.y += dt*bomb.velocity;
    // remove bomb if it has gone off the screen
    if(bomb.y > this.height) {
      this.bombs.splice(i--, 1);
    }
  }
  // move each rocket
  for(i=0;i<this.rockets.length; i++) {
    var rocket = this.rockets[i];
    rocket.y -= dt*rocket.velocity;
    // remove rocket if it has gone off screen
    if(rocket.y < 0) {
      this.rockets.splice(i--, 1);
    }
  }
  //  Move the invaders
  var hitLeft = false, hitRight = false, hitBottom = false;
  for(i=0; i<this.invaders.length; i++) {
    var invader = this.invaders[i];
    var newx = invader.x + this.invaderVelocity.x * dt;
    var newy = invader.y + this.invaderVelocity.y * dt;
    if(hitLeft === false && newx < game.gameBounds.left) {
      hitLeft = true;
    }
    else if(hitRight === false && newx > game.gameBounds.right) {
      hitRight = true;
    }
    else if(hitBottom === false && newy > game.gameBounds.bottom) {
      hitBottom = true;
    }

    if(!hitLeft && !hitRight && !hitBottom) {
      invader.x = newx;
      invader.y = newy;
    }
  }

  //  update invader velocities
  if(this.invadersAreDropping) {
    this.invaderCurrentDropDistance += this.invaderVelocity.y * dt;
    if(this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
      this.invadersAreDropping = false;
      this.invaderVelocity = this.invaderNextVelocity;
      this.invaderCurrentDropDistance = 0;
    }
  }
  //  if we've hit the left, move down then right
  if(hitLeft) {
    this.invaderCurrentVelocity += this.config.invaderAcceleration;
    this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity};
    this.invadersAreDropping = true;
    this.invaderNextVelocity = {x: this.invaderCurrentVelocity , y:0};
  }
  //  If we've hit the right, move down then left
  if(hitRight) {
    this.invaderCurrentVelocity += this.config.invaderAcceleration;
    this.invaderVelocity = {x: 0, y:this.invaderCurrentVelocity };
    this.invadersAreDropping = true;
    this.invaderNextVelocity = {x: -this.invaderCurrentVelocity , y:0};
  }
  //  If we've hit the bottom, it's game over
  if(hitBottom) {
    this.lives = 0;
  } 

  //  Check for rocket/invader collisions
  for(i=0; i<this.invaders.length; i++) {
    var invader = this.invaders[i];
    var bang = false;

    for(var j=0; j<this.rockets.length; j++){
      var rocket = this.rockets[j];

      if(rocket.x >= (invader.x - invader.width/2) && rocket.x <= (invader.x + invader.width/2) &&
        rocket.y >= (invader.y - invader.height/2) && rocket.y <= (invader.y + invader.height/2)) {
        
        //  remove the rocket, set 'bang' so rocket is not evaluated again
        this.rockets.splice(j--, 1);
        bang = true;
        game.score += this.config.pointsPerInvader;
        break;
      }
    }
    if(bang) {
      this.invaders.splice(i--, 1);
    }
  }

  //  Find all of the front rank invaders.
    var frontRankInvaders = {};
    for(var i=0; i<this.invaders.length; i++) {
      var invader = this.invaders[i];
      //  If we have no invader for game file, or the invader
      //  for game file is further behind, set the front
      //  rank invader to game one.
      if(!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
        frontRankInvaders[invader.file] = invader;
      }
    }
 
    //  Give each front rank invader a chance to drop a bomb.
    for(var i=0; i<this.config.invaderFiles; i++) {
      var invader = frontRankInvaders[i];
      if(!invader) continue;
      var chance = this.bombRate * dt;
      if(chance > Math.random()) {
        //  Fire!
        this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2,
          this.bombMinVelocity + Math.random()*(this.bombMaxVelocity - this.bombMinVelocity)));
      }
    } 

    //  Check for bomb/ship collisions.
    for(var i=0; i<this.bombs.length; i++) {
      var bomb = this.bombs[i];
      if(bomb.x >= (this.ship.x - this.ship.width/2) && bomb.x <= (this.ship.x + this.ship.width/2) &&
          bomb.y >= (this.ship.y - this.ship.height/2) && bomb.y <= (this.ship.y + this.ship.height/2)) {
        this.bombs.splice(i--, 1);
        game.lives--;
      }
                
    }

    //  Check for invader/ship collisions.
    for(var i=0; i<this.invaders.length; i++) {
      var invader = this.invaders[i];
      if((invader.x + invader.width/2) > (this.ship.x - this.ship.width/2) && 
        (invader.x - invader.width/2) < (this.ship.x + this.ship.width/2) &&
        (invader.y + invader.height/2) > (this.ship.y - this.ship.height/2) &&
        (invader.y - invader.height/2) < (this.ship.y + this.ship.height/2)) {
        //  Dead by collision!
        game.lives = 0;
      }
    }

    //  Check for failure
    if(game.lives <= 0) {
      game.moveToState(new GameOverState());
    }
 
    //  Check for victory
    if(this.invaders.length === 0) {
      game.score += this.level * 50;
      game.level += 1;
      game.moveToState(new LevelIntroState(game.level));
    } 

};

PlayState.prototype.fireRocket = function() {
  //  If we have no last rocket time, or the last rocket time 
  //  is older than the max rocket rate, we can fire.
  if(this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (500 / this.config.rocketMaxFireRate))
  {   
    //  Add a rocket.
    this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
    this.lastRocketTime = (new Date()).valueOf();
  }

};

PlayState.prototype.draw = function(game, dt, ctx) {
 
  //  Clear the background.
  ctx.clearRect(0, 0, game.width, game.height);
  
  //  Draw ship.
  ctx.fillStyle = '#999999';
  ctx.fillRect(this.ship.x - (this.ship.width / 2), this.ship.y - (this.ship.height / 2), this.ship.width, this.ship.height);

  //  Draw invaders.
  ctx.fillStyle = '#006600';
  for(var i=0; i<this.invaders.length; i++) {
    var invader = this.invaders[i];
    ctx.fillRect(invader.x - invader.width/2, invader.y - invader.height/2, invader.width, invader.height);
  }

  //  Draw bombs.
  ctx.fillStyle = '#ff5555';
  for(var i=0; i<this.bombs.length; i++) {
    var bomb = this.bombs[i];
    ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
  }

  //  Draw rockets.
  ctx.fillStyle = '#ff0000';
  for(var i=0; i<this.rockets.length; i++) {
    var rocket = this.rockets[i];
    ctx.fillRect(rocket.x, rocket.y - 2, 3, 5);
  }
 
};

function GameOverState() {
}

GameOverState.prototype.update = function(game, dt) {
};








