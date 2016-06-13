var game;

// colors for background tunnel 
var bgColors = [0xF16745, 0xFFC65D, 0x7BC8A4, 0x4CC3D9, 0x93648D, 0x7c786a, 0x588c73, 0x8c4646, 0x2a5b84, 0x73503c];
var tunnelWidth = 320;

// moving the ship 
var shipHorizontalSpeed = 100;
var shipMoveDelay = 0; 
var shipVerticalSpeed = 15000;
var swipeDistance = 10;

// barriers 
var barrierSpeed = 280;
var barrierGap = 120; 


window.onload = function() {
     game = new Phaser.Game(640, 960, Phaser.AUTO, "");
     
     // different game states 
     game.state.add("Boot", boot);
     game.state.add("Preload", preload);
     game.state.add("TitleScreen", titleScreen);
     game.state.add("PlayGame", playGame);
     game.state.add("GameOverScreen", gameOverScreen);
     game.state.start("Boot");
}
var boot = function(game){};
boot.prototype = {
	preload: function(){
		this.game.load.image('loading', "assets/sprites/loading.png")
	},
    create: function(){
          game.scale.pageAlignHorizontally = true; 
          game.scale.pageAlignVertically = true; 
          game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; 
          this.game.state.start("Preload"); 
     }
}
var preload = function(game){};
preload.prototype = {
     preload: function(){
          var loadingBar = this.add.sprite(game.width/2, game.height/2, "loading"); 
          loadingBar.anchor.setTo(0.5);
          game.load.setPreloadSprite(loadingBar);
          game.load.image("title", 'assets/sprites/title.png');
          game.load.image("playbutton", "assets/sprites/playbutton.png");
          game.load.image("backsplash", "assets/sprites/backsplash.png");
          game.load.image("tunnelbg", "assets/sprites/tunnelbg.png");
          game.load.image('wall', "assets/sprites/wall.png");
          game.load.image("ship", "assets/sprites/ship.png");
          game.load.image("smoke", "assets/sprites/smoke.png");
          game.load.image("barrier", "assets/sprites/barrier.png");

     },
     create: function(){
          this.game.state.start("TitleScreen")
     }
}
var titleScreen = function(game){};
titleScreen.prototype = {
     create: function(){
          //game.stage.backgroundColor = bgColors[game.rnd.between(0,bgColors.length - 1)];
               
          var titleBG = game.add.tileSprite(0,0,game.width,game.height,"backsplash");
               titleBG.tint = bgColors[game.rnd.between(0, bgColors.length-1)];

          var title = game.add.image(game.width / 2, 210, "title");
               title.anchor.set(0.5);
          var playButton = game.add.button(game.width / 2, game.height - 150, "playbutton", this.startGame);
               playButton.anchor.set(0.5);
          var tween = game.add.tween(playButton).to({
               width: 220, 
               height: 220,
          }, 1500, "Linear", true, 0, -1); 
          tween.yoyo(true); 
          },
     
     startGame: function(){
          game.state.start("PlayGame")
     }
}
var playGame = function(game){};
playGame.prototype = {
     create: function(){
          var tintColor = bgColors[game.rnd.between(0, bgColors.length - 1)]
          var tunnelBG = game.add.tileSprite(0, 0, game.width, game.height,"tunnelbg");
               tunnelBG.tint = tintColor;
          var leftWallBG = game.add.tileSprite(-tunnelWidth/ 2,0,game.width/2,game.height,"wall");
               leftWallBG.tint = tintColor;
          var rightWallBG = game.add.tileSprite((game.width + tunnelWidth)/2,0,game.width/2,game.height,"wall");
               rightWallBG.tint = tintColor;
               rightWallBG.tileScale.x = -1;
          this.shipPositions = [(game.width - tunnelWidth) / 2 + 32, (game.width + tunnelWidth)/2-32];
          this.ship = game.add.sprite(this.shipPositions[0], 860, "ship");
          this.ship.side = 0;
          this.ship.anchor.set(0.5);
          this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);
          this.ship.canMove = true;
          this.ship.canSwipe = false;
          game.input.onDown.add(this.moveShip, this);
          game.input.onUp.add(function(){
               this.ship.canSwipe = false;
          }, this);

          // Smoke Emitter 
          this.smokeEmitter = game.add.emitter(this.ship.x, this.ship.y + 10, 20);
          this.smokeEmitter.makeParticles("smoke");
          this.smokeEmitter.setXSpeed(-15, 15);
          this.smokeEmitter.setYSpeed(50, 150);
          this.smokeEmitter.setAlpha(0.5, 1);
          this.smokeEmitter.start(false, 1000, 40);

          // vertical movement 
          this.verticalTween = game.add.tween(this.ship).to({
               y:0
          }, shipVerticalSpeed, Phaser.Easing.Linear.None, true);
          
          this.barrierGroup = game.add.group(); 
          this.addBarrier(this.barrierGroup, tintColor);

          // var barrier = new Barrier(game, barrierSpeed, tintColor); 
          // game.add.existing(barrier); 
          // this.barrierGroup.add(barrier);

     },

     addBarrier: function(group, tintColor){
          var barrier = new Barrier(game, barrierSpeed, tintColor);
          game.add.existing(barrier); 
          group.add(barrier);
     },

     moveShip: function(){
         this.ship.canSwipe = true;
          if(this.ship.canMove){
               this.ship.canMove = false; 
               this.ship.side = 1 - this.ship.side;
               var horizontalTween = game.add.tween(this.ship).to({
                    x: this.shipPositions[this.ship.side]
               }, shipHorizontalSpeed, Phaser.Easing.Linear.None, true);
               horizontalTween.onComplete.add(function(){
                    game.time.events.add(shipMoveDelay, function(){
                         this.ship.canMove = true;

                    }, this);
               },this);   
               var ghostShip = game.add.sprite(this.ship.x, this.ship.y, "ship");
                    ghostShip.alpha = 0.5;
                    ghostShip.anchor.set(0.5);
               var ghostTween = game.add.tween(ghostShip).to({
                    alpha: 0
               }, 500, Phaser.Easing.Linear.None, true)
                    ghostTween.onComplete.add(function(){
                    ghostShip.destroy();
               });
          }
     },
     update: function(){
          this.smokeEmitter.x = this.ship.x;
          this.smokeEmitter.y = this.ship.y; 
          if(this.ship.canSwipe){
               if(Phaser.Point.distance(game.input.activePointer.positionDown, game.input.activePointer.position) > swipeDistance){
                    this.restartShip();
               }
          }
     }, 
     restartShip: function(){
          this.ship.canSwipe = false;
          this.verticalTween.stop();
          this.verticalTween = game.add.tween(this.ship).to({
          y: 860}, 100, Phaser.Easing.Linear.None, true);
          this.verticalTween.onComplete.add(function(){
               this.verticalTween = game.add.tween(this.ship).to({
               y: 0}, shipVerticalSpeed, Phaser.Easing.Linear.None, true);
          }, this);
     }

}

var gameOverScreen = function(game){};
gameOverScreen.prototype = {
}

var Barrier = function (game, speed, tintColor) {
     var positions = [(game.width - tunnelWidth) / 2, (game.width + tunnelWidth) / 2];
     var position = game.rnd.between(0, 1);
     Phaser.Sprite.call(this, game, positions[position], -100, "barrier");
     var cropRect = new Phaser.Rectangle(0, 0, tunnelWidth / 2, 24);
     this.crop(cropRect);
     game.physics.enable(this, Phaser.Physics.ARCADE);
     this.anchor.set(position, 0.5);
     this.tint = tintColor;
     this.body.velocity.y = speed;
     this.placeBarrier = true;
};
Barrier.prototype = Object.create(Phaser.Sprite.prototype);
Barrier.prototype.constructor = Barrier;
Barrier.prototype.update = function(){
     if(this.placeBarrier && this.y > barrierGap){
          this.placeBarrier = false; 
          playGame.prototype.addBarrier(this.parent, this.tint);
     }
     if(this.y > game.height){
          this.destroy();
     }
}
