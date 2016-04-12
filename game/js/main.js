"use strict";

var app = app || {};

app.main = {
	//  properties
  WIDTH : 640,
  HEIGHT: 480,
  canvas: undefined,
  ctx: undefined,
 	lastTime: 0, // used by calculateDeltaTime()
  debug: true,
	paused: false,
	animationID: 0,
	boundaries: false,

	// Entity Counts
	numObjectives: 1,

	// Game State Variables
	gameState: 0,
	playerScore: 0,

	// Sound
	bgAudio: undefined,
    effectAudio: undefined,

	GAME_STATE: Object.freeze({
		MENU : 0,
		HOWTO: 1,
		GAME : 2,
		GAMEOVER : 3,
	}),

	// Player Object
	player: {
		// Position and Radius of circle
		x: 300,
		y: 200,
		radius: 15,

		// Thrust stuff
		isThrusting: false,
		thrust: 0.08,
		angle: 0,
		turnSpeed: 0.001,
		friction: .99,

		image: {},

		velocityX: 0,
		velocityY: 0,

		// Player Stuff
		playerTurn: function(dir)
		{
			this.angle += this.turnSpeed * dir;
		},

		// Bounds player to the screen
		playerShipBounds: function(canvas)
		{
			// bounds check
		    if(this.x < 0)
		    {
		    	this.friction = 0.1;
		    	this.x += this.radius;
		    }
		    else if(this.x > canvas.width)
		    {
		    	this.friction = 0.1;
		        this.x -= this.radius;
		    }
		    else if(this.y < 0)
		    {
		    	this.friction = 0.1;
		        this.y += this.radius;
		    }
		    else if(this.y > canvas.height)
		    {
		    	this.friction = 0.1;
		        this.y -= this.radius;
		    }
		    else
		    {
		    	this.friction = 0.99;
		    }
		},

		// Player can go offscreen and come back on the other side
		noPlayerShipBounds: function(canvas)
		{
			// bounds check
		    if(this.x < 0)
		    {
		    	this.x = canvas.width;
		    }
		    else if(this.x > canvas.width)
		    {
		        this.x = 0;
		    }
		    else if(this.y < 0)
		    {
		        this.y = canvas.height;
		    }
		    else if(this.y > canvas.height)
		    {
		        this.y = 0;
		    }
		},

		playerUpdate: function(canvas)
		{
			// Get Ship Direction (in radians)
			var direction = this.angle / Math.PI*180;

			// Checks if the ship is thrusting before altering velocity
		    if(this.isThrusting)
		    {
		    	this.velocityX += Math.cos(direction) * this.thrust;
		    	this.velocityY += Math.sin(direction) * this.thrust;
		    }

		    // apply friction
		    this.velocityX *= this.friction;
		    this.velocityY *= this.friction;

		    // apply velocities
		    this.x -= this.velocityX;
		    this.y -= this.velocityY;

		    if(app.main.boundaries)
		    {
		    	this.playerShipBounds(canvas);
		    }
		    else
		    {
		    	this.noPlayerShipBounds(canvas);
		    }
		},

		playerDraw: function(ctx)
		{
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.angle / Math.PI*180 + 4.75);
			ctx.drawImage(this.image, -this.radius - 1, -this.radius - 1, this.radius*2 + 1, this.radius*2 + 1);
			if(this.isThrusting)
			{
				ctx.strokeStyle = "red";
				ctx.fillStyle = "orange";
				ctx.moveTo(-this.radius + 4, this.radius);
				ctx.lineTo(-this.radius + 6, this.radius + 10);
				ctx.lineTo(-this.radius + 8, this.radius);
				ctx.stroke();
				ctx.fill();
				ctx.moveTo(this.radius - 4, this.radius);
				ctx.lineTo(this.radius - 6, this.radius + 10);
				ctx.lineTo(this.radius - 8, this.radius);
				ctx.stroke();
				ctx.fill();
			}
			ctx.restore();
		}
	},

	objectives: [],

    // methods
	init : function() {
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');

		// Game Sprites
		var image = new Image();
		image.src = '/gameCode/media/ship.png';
		this.player.image = image;

		this.canvas.onmousedown = this.onMouseDown;

		this.gameReset();
		this.update();
	},

	// Resets Game
	gameReset: function(){

		this.player.x = 300;
		this.player.y = 200;
		this.player.velocityX = 0;
		this.player.velocityY = 0;
		this.objectives = [];

		this.numObjectives = 1;

		for(var i = 0; i < this.numObjectives; i++)
		{
			this.objectives.push(this.makeObjective());
		}
		// start the game loop
		this.gameState = 0;
		this.playerScore = 0;
	},

	// Main Game Loop
	update: function(){

		this.animationID = requestAnimationFrame(this.update.bind(this)); //looks good to me!

	 	// PAUSED
	 	if(this.paused){
	 		this.drawPauseScreen(this.ctx);
	 		return;
	 	}

	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();

		// 5) DRAW
		this.drawBackground();

		if(this.gameState == this.GAME_STATE.GAME)
		{
			// If W or Up-Arrow is pressed, thrusting is true
			this.player.isThrusting = (myKeys.keydown[myKeys.KEYBOARD.KEY_W] || myKeys.keydown[myKeys.KEYBOARD.KEY_UP]);

			// Checks for the ship turning
			if (myKeys.keydown[myKeys.KEYBOARD.KEY_RIGHT] || myKeys.keydown[myKeys.KEYBOARD.KEY_D]) {
	        	this.player.playerTurn(1);
	    	}
	    	if (myKeys.keydown[myKeys.KEYBOARD.KEY_LEFT] || myKeys.keydown[myKeys.KEYBOARD.KEY_A]) {
	       		this.player.playerTurn(-1);
	    	}

	    	// Checks that there are enough objectives based on the dropdown
	    	while(this.objectives.length < this.numObjectives)
	    	{
	    		this.objectives.push(this.makeObjective());
	    	}

	    	// Checks if there are too many objectives, if there are, remake them all
	    	if(this.objectives.length > this.numObjectives)
	    	{
	    		this.objectives = [];
	    		for(var i = 0; i < this.numObjectives; i++)
	    		{
	    			this.objectives.push(this.makeObjective());
	    		}
	    	}

	    	// Draw Objectives and checks against player collision
	    	for(var i = 0; i < this.objectives.length; i++)
	    	{
		    	this.objectives[i].checkPlayer(this.player, this.canvas);
		    	this.objectives[i].draw(this.ctx);
		    }

		    // Player update and draw
	    	this.player.playerUpdate(this.canvas);
	    	this.player.playerDraw(this.ctx);
	    }
	    this.drawHUD(this.ctx);
	},

	onMouseDown: function(){
		if(app.main.paused)
		{
			app.main.paused = false;
			return;
		}
		// If the game is happening, no mouse
		if(app.main.gameState == app.main.GAME_STATE.GAME)
		{
			app.main.pauseGame();
			return;
		}
		// If the game is over, go to main menu
		if(app.main.gameState == app.main.GAME_STATE.GAMEOVER)
		{
			app.main.gameState = app.main.GAME_STATE.MENU;
			app.main.gameReset();
			return;
		}
		// If the game is in menu, start the game
		if(app.main.gameState == app.main.GAME_STATE.MENU)
		{
			app.main.gameState = app.main.GAME_STATE.HOWTO;
			return;
		}
		// If at the how-to screen
		if(app.main.gameState == app.main.GAME_STATE.HOWTO)
		{
			app.main.gameState = app.main.GAME_STATE.GAME;
			return;
		}
	},

	drawHUD: function(ctx){
		ctx.save();

		// Main Menu Text
		if(this.gameState == this.GAME_STATE.MENU)
		{
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "The Collective", this.WIDTH/2, this.HEIGHT/5, "30pt courier", "white");
			this.fillText(this.ctx, "To begin, click the screen", this.WIDTH/2, (2/3)*this.HEIGHT, "30pt courier", "white");
		}

		// How to play screen text
		if(this.gameState == this.GAME_STATE.HOWTO)
		{
			this.fillText(ctx, "Get the yellow orbs to score points!", 50, 75, "14pt courier", "white");
			this.fillText(ctx, "Don't get hit by the collective or you lose!", 50, 175, "14pt courier", "white");
			this.fillText(ctx, "You can change the number of collective units and ", 50, 275, "14pt courier", "white");
			this.fillText(ctx, "objectives that spawn with the dropdowns below.", 50, 295, "14pt courier", "white");
			this.fillText(ctx, "Add boundaries to the game for added challenge!", 50, 395, "14pt courier", "white");
		}

		// Game HUD
		if(this.gameState == this.GAME_STATE.GAME)
		{
			this.fillText(ctx, "Round Score: " + this.playerScore, (1/2)*this.WIDTH - 280, 30, "20pt courier", "white");
		}

		// Game over text screen
		if(this.gameState == this.GAME_STATE.GAMEOVER)
		{
			ctx.save();
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx, "Game Over", this.WIDTH/2, this.HEIGHT/4 + 40, "30pt courier", "red");
			this.fillText(this.ctx, "Final Score: " + this.playerScore, this.WIDTH/2, this.HEIGHT/2 - 40, "30pt courier", "red");
			this.fillText(this.ctx, "Total Enemies: " + this.enemies.length, this.WIDTH/2, this.HEIGHT/2 + 40, "30pt courier", "red");
			this.fillText(this.ctx, "Click to continue", this.WIDTH/2, (3/4)*this.HEIGHT - 40, "30pt courier", "red");
		}

		ctx.restore();
	},

	// Draws the game background
	drawBackground: function(){
		var my_gradient = this.ctx.createLinearGradient(0,0,0,this.HEIGHT);
		my_gradient.addColorStop(0, "black");
		my_gradient.addColorStop(1, "white");
		this.ctx.fillStyle = my_gradient;
		this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT/2);
		var second_gradient = this.ctx.createLinearGradient(0,this.HEIGHT,0,0);
		second_gradient.addColorStop(0, "black");
		second_gradient.addColorStop(1, "white");
		this.ctx.fillStyle = second_gradient;
		this.ctx.fillRect(0,this.HEIGHT/2,this.WIDTH,this.HEIGHT);
	},

	makeObjective: function(){

		// Draws the Objective
		var objectiveDraw = function(ctx){
			// Draw circle
			ctx.save();
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
			ctx.closePath();
			//ctx.fillStyle = "white";
			ctx.fillStyle = this.fillStyle;
			ctx.strokeStyle = this.strokeStyle;
			ctx.stroke();
			ctx.fill();
			ctx.restore();
		}

		// Checks if the player reaches the objective
		var checkPlayerReached = function(player, canvas){
			if(playerIntersect(player,this) ){
				this.x = getRandom(0, app.main.WIDTH);
				this.y = getRandom(0, app.main.HEIGHT);
				//Player Score
				app.main.playerScore++;
			}
		}

		var c = {};

		// Random Position on the canvas (tries to avoid UI)
		c.x = getRandom(150, app.main.WIDTH);
		c.y = getRandom(150, app.main.HEIGHT);

		// Objective Properties
		c.radius = 40;
		c.strokeStyle = "red";
		c.fillStyle = "orange";
		c.draw = objectiveDraw;
		c.checkPlayer = checkPlayerReached;

		// No more properties
		Object.seal(c);

		return c;
	},

	// Pause Game
	pauseGame: function(){
		this.paused = true;
		cancelAnimationFrame(this.animationID);
		this.update();
	},

	// Resume Game
	resumeGame: function(){
		cancelAnimationFrame(this.animationID);
		this.paused = false;
		this.update();
	},

	// Pause Screen
	drawPauseScreen: function(ctx){
		ctx.save();
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		this.fillText(this.ctx, '....PAUSED....', this.WIDTH / 2, this.HEIGHT / 2, '40pt courier', 'white');
		ctx.restore();
	},

	// Draw Text on Screen
	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},

	calculateDeltaTime: function(){
		var now,fps;
		now = (+new Date);
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now;
		return 1/fps;
	},
};
