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

// increase difficulty 
var barrierIncreaseSpeed = 1.1;

//Ship invulnerability time on swipe 
var shipInvisibilityTime = 1000;

// Scoring 
var scoreHeight = 100; 
var scoreSegments = [100, 50, 25, 10, 5, 2, 1];


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
          game.load.image("separator", "assets/sprites/separator.png");
          game.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt"); 

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
          //Create tunnel 
          var tintColor = bgColors[game.rnd.between(0, bgColors.length - 1)]
          var tunnelBG = game.add.tileSprite(0, 0, game.width, game.height,"tunnelbg");
               tunnelBG.tint = tintColor;
          var leftWallBG = game.add.tileSprite(-tunnelWidth/ 2,0,game.width/2,game.height,"wall");
               leftWallBG.tint = tintColor;
          var rightWallBG = game.add.tileSprite((game.width + tunnelWidth)/2,0,game.width/2,game.height,"wall");
               rightWallBG.tint = tintColor;
               rightWallBG.tileScale.x = -1;

          for(var i =1; i<= scoreSegments.length; i++){
               var leftSeparator = game.add.sprite((game.width - tunnelWidth)/2, scoreHeight * i, 'separator');
                    leftSeparator.tint = tintColor; 
                    leftSeparator.anchor.set(1,0);
               var rightSeparator = game.add.sprite((game.width + tunnelWidth)/2, scoreHeight * i, 'separator');
                    rightSeparator.tint = tintColor; 
               var posX = (game.width - tunnelWidth)/2 - leftSeparator.width/2;
               if(i%2 === 0){
                    posX = (game.width + tunnelWidth)/2 + leftSeparator.width/2; 
               }
               game.add.bitmapText(posX, scoreHeight*(i - 1) + scoreHeight/2 - 18 , 'font', scoreSegments[i - 1].toString(), 36).anchor.x = 0.5; 
          }
          //Create Ship positions 
          this.shipPositions = [(game.width - tunnelWidth) / 2 + 32, (game.width + tunnelWidth)/2-32];
          this.ship = game.add.sprite(this.shipPositions[0], 860, "ship");
          this.ship.side = 0;
          this.ship.destroyed = false;
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
          if(!this.ship.destroyed && this.ship.alpha === 1){
               game.physics.arcade.collide(this.ship, this.barrierGroup, null, function(s,b){
                    this.ship.destroyed = true; 
                    this.smokeEmitter.destroy(); 
                    var destroyTween = game.add.tween(this.ship).to({
                         x: this.ship.x + game.rnd.between(-100,100), 
                         y: this.ship.y - 100,
                         rotation: 10
                    }, 1000, Phaser.Easing.Linear.None, true);
                    destroyTween.onComplete.add(function(){
                         var explosionEmitter = game.add.emitter(this.ship.x, this.ship.y, 200);
                         explosionEmitter.makeParticles('smoke');
                         explosionEmitter.setAlpha(0.5,1);
                         explosionEmitter.minParticleScale = 0.5; 
                         explosionEmitter.maxParticleScale = 2; 
                         explosionEmitter.start(true, 2000, null, 200);
                         this.ship.destroy(); 
                         game.time.events.add(Phaser.Timer.SECOND*2, function(){
                              game.state.start("GameOverScreen");
                         });

                    }, this)
               }, this);     
          }
     }, 
     restartShip: function(){
          if(!this.ship.destroyed && this.ship.alpha === 1){
               barrierSpeed *= barrierIncreaseSpeed;
               for(var i = 0; i<barrierGroup.length; i++){
                    this.barrierGroup.getChildAt(i).body.velocity.y = barrierSpeed; 
               }
               this.ship.canSwipe = false;
               this.verticalTween.stop();
               this.ship.alpha = 0.5; 
               this.verticalTween = game.add.tween(this.ship).to({
               y: 860}, 100, Phaser.Easing.Linear.None, true);
               this.verticalTween.onComplete.add(function(){
                    this.verticalTween = game.add.tween(this.ship).to({
                    y: 0}, shipVerticalSpeed, Phaser.Easing.Linear.None, true);
                    var alphaTween = game.add.tween(this.ship).to({
                         alpha: 1
                    }, shipInvisibilityTime, Phaser.Easing.Bounce.In, true);
               }, this);      
          }
          
     }

}

var gameOverScreen = function(game){};
gameOverScreen.prototype = {
     create: function(){
          console.log("game over")
     }
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
     this.body.immovable = true;
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
