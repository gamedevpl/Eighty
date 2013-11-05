ig.baked = true;
ig.module( 
	'game.main'
)
.requires(
	'impact.game',
	//'impact.debug.debug',
	'impact.font',
	'game.connection',
	'game.levels.dm1',
	'game.entities.player'
)
.defines(function(){

MyGame = ig.Game.extend({
	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),

	connection: null,
	
	player: null,

	gravity: 80,

	gameStarted: false,
	
	init: function() {
		this.connection = new Connection(new WebSocket("ws://"+config['host']+":"+config['port']+"/"+config['channel']+"/"), { host: config['host'], port: config['port'] });
		this.setUpConnection();
	},

	playersLogged: [],

	playerCount:0,

	isHost:false,

	ping:0,

	pingStartCalc:Date.now(),

	smoothPing:0,

	disconnected:false,
	calcPing: function () {
		ig.game.pingStartCalc=Date.now();
		ig.game.connection.toHost("ping");
	},

	updateLeaderboard: function () {
		var str="{Nick - K|D} ";

		for (var i = ig.game.playersLogged.length - 1; i >= 0; i--) {
			var d=ig.game.playersLogged[i];
			str+="{"+d.nick+" - "+d.kills+"|"+d.deaths+"} ";
		}
		document.getElementById("leaderboard").innerHTML=str;
	},

	setUpConnection: function() {
		this.connection.on('client', function(header, body) {
			ig.game.connected();
			ig.game.player.nick=nick;
			ig.game.player.kills=0;
			ig.game.player.deaths=0;

			ig.game.connection.syncTime.then(function() {
				ig.game.connection.toHost("auth", JSON.stringify( {player:ig.game.player.getData(), nick:nick} ));
			});
		});

		this.connection.on('pong', function(header, body) {
			ig.game.ping=Date.now()-ig.game.pingStartCalc;
			ig.game.smoothPing=(ig.game.smoothPing+ig.game.smoothPing+ig.game.smoothPing+ig.game.smoothPing+ig.game.ping)/5;
		});

		this.connection.on('disconnected', function(header,body) {
			ig.game.disconnected=true;
		});

		/*this.connection.on(/(.+)/g, function() {
			if(arguments[1]!="ping:" && arguments[0]!="pong")
			console.log(arguments);
		});*/

		this.connection.on('logged', function(header, body) {
			var data=JSON.parse(body);
			console.log(data.playersLogged);
			if( data.playersLogged != null ) {
				var arr=data.playersLogged;
				for (var i = 0; i < arr.length; i++) {
					var plr=ig.game.spawnEntity("EntityPlayer", 0, 0);
					plr.setData(arr[i]);

				    ig.game.addPlayer(arr[i]);
				}
			}
			ig.game.player.connID=data.clientID;
			ig.game.addPlayer(ig.game.player.getData());
			ig.game.gameStarted=true;
			console.log("Connected | id: "+data.clientID);
			setInterval("ig.game.calcPing();", 2000);
		});

		this.connection.on('newPlayer', function(header, body) {
			var data = JSON.parse(body);
			if(data.connID!=ig.game.player.connID)
			{
				var plr=ig.game.spawnEntity("EntityPlayer", 0, 0);
				plr.setData(data);
				//plr.nick=data.nick;

				ig.game.addPlayer(plr.getData());

				console.log("Got new player! | id: "+plr.connID);
			}
			ig.game.updateLeaderboard();
		});

		this.connection.on('removePlayer', function(header, body) {
			ig.game.removePlayer(body);
			console.log("Lost player :C | id: "+body);
			ig.game.updateLeaderboard();
		});

		this.connection.on('bulletHit', function(header, body) {
			var data=JSON.parse(body);

			console.log("Shooted : "+data.connID);
			var player = ig.game.findPlayer(data.connID);
			var playerLog = ig.game.findPlayerLog(data.connID);

			player.hp--; if(player.hp<=0) player.timeToRespawn=3.0;
		});

		this.connection.on('playerKilled', function(header, body) {
			var data=JSON.parse(body);
			console.log("Killed : "+data.plrID+ "; By : "+data.kilID);
			var player = ig.game.findPlayer(data.plrID);
			var playerLog = ig.game.findPlayerLog(data.plrID);
			player.deaths++;
			playerLog.deaths++;

			var killer = ig.game.findPlayer(data.kilID);
			var killerLog = ig.game.findPlayerLog(data.kilID);
			killer.kills++;
			killerLog.kills++;

			ig.game.updateLeaderboard();
		});

		this.connection.on('playerUpdate', function(header, body) {
			var data=JSON.parse(body);
			// console.log(data);
			var connID;
			var player=null;
			var playerLog=null;
			var updateTime=0;

			for (var i = data.length - 1; i >= 0; i--) {
				if(data[i].connID != null) {
					connID=data[i].connID;
					if(connID==ig.game.player.connID) {  continue; }

					//console.log("Player changed : "+connID);
					player = ig.game.findPlayer(connID);
					if( player == null ) break;
					playerLog = ig.game.findPlayerLog(connID);
					if( playerLog == null ) break;

					player.pos.x=data[i].pos.x;
					player.pos.y=data[i].pos.y;
					playerLog.pos.x=data[i].pos.x;
					playerLog.pos.y=data[i].pos.y;

					player.vel.x=data[i].vel.x;
					player.vel.y=data[i].vel.y;
					playerLog.vel.x=data[i].vel.x;
					playerLog.vel.y=data[i].vel.y;

					player.flip.x=data[i].flip.x;
					player.flip.y=data[i].flip.y;
					playerLog.flip.x=data[i].flip.x;
					playerLog.flip.y=data[i].flip.y;

					player.hp=data[i].hp;
					playerLog.hp=data[i].hp;

				} else if(data[i].time != null) {
					if(connID==ig.game.player.connID) {  continue; }
					updateTime=(ig.game.connection.getRoomTime()-data[i].time)/1000;
				} else if(data[i].jump != null) {
					if(connID==ig.game.player.connID) {  continue; }
					player.jump=data[i].jump;

				} else if(data[i].left != null) {
					if(connID==ig.game.player.connID) {  continue; }
					player.left=data[i].left;
					
				} else if(data[i].right != null) {
					if(connID==ig.game.player.connID) {  continue; }
					player.right=data[i].right;
					
				} else if(data[i].up != null) {
					if(connID==ig.game.player.connID) {  continue; }
					player.up=data[i].up;
					
				} else if(data[i].bullet != null) {
					if(connID==ig.game.player.connID) {  continue; }
					var settings = { vel: { x: data[i].bullet.vel.x, y: data[i].bullet.vel.y } };
					var ent=ig.game.spawnEntity(EntityBullet,data[i].bullet.pos.x,data[i].bullet.pos.y, settings);
					ent.connID=connID;
					ent.specialUpdate( (ig.game.connection.getRoomTime()-data[i].bullet.time)/1000 );
				}

			}
			if(player!=null){
				player.specialUpdate( updateTime );
			}
			//if(player!=null)
			//player.specialUpdate(ig.game.ping/1000);
		});
		this.setupHost();
	},
	
	setupHost: function () {
		this.isHost=true;
		console.log("You are the host!");

		this.connection.hon('auth', function(header, body, data, clientID) {
			ig.game.connection.toClient(clientID,"logged", JSON.stringify({clientID:clientID, playersLogged:ig.game.playersLogged}));
			var data=JSON.parse(body);
			var plr=data.player;
			plr.connID=clientID;
			plr.nick=data.nick;
			console.log(plr);
			ig.game.connection.broadcast("newPlayer", JSON.stringify(plr));
		});

		this.connection.hon('playerUpdate', function(header, body, data, clientID) {
			// ANTI CHEAT: Check if connectionid is the same as sender; Or replace it with correct one;
			ig.game.connection.broadcast(header,body);


		});

		this.connection.hon('leave', function(header, body, data, clientID) {
			ig.game.connection.broadcast("removePlayer", clientID);
		});

		this.connection.hon('ping', function(header, body, data, clientID) {
			ig.game.connection.toClient(clientID,"pong", null);
		});
	},

	connected: function() {
		ig.input.bind( ig.KEY.W, 'up' );
		ig.input.bind( ig.KEY.UP_ARROW, 'up' );


		ig.input.bind( ig.KEY.A, 'left' );
		ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );


		ig.input.bind( ig.KEY.D, 'right' );
		ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );


		ig.input.bind( ig.KEY.Z, 'shoot' );
		ig.input.bind( ig.KEY.J, 'shoot' );


		ig.input.bind( ig.KEY.K, 'jump' );
		ig.input.bind( ig.KEY.X, 'jump' );
		ig.input.bind( ig.KEY.SPACE, 'jump' );

        this.loadLevel( LevelDm1 );

        this.generateSpawns();
        var spawn=this.getRandomSpawn();

        this.player = ig.game.spawnEntity( EntityPlayer, spawn.x, spawn.y );

		var x = this.player.pos.x - (ig.system.width / 2);
		var y = this.player.pos.y - (ig.system.height / 2);
		this.screen.x = x;
		this.screen.y = y;
	},

	addPlayer: function(playerData) {
		this.playerCount++;

		playerData.kills=0;
		playerData.deaths=0;
		var data=this.playersLogged.push(playerData);
	},

	removePlayer: function(connID) {
		this.playerCount--;
		// playersLogged -
		var plr=this.findPlayer(connID);
		if(plr != null)
		plr.kill();
		var index = this.playersLogged.indexOf( this.findPlayerLog(connID) );
		if( index != -1 )
		this.playersLogged.splice(index, 1);
	},

	findPlayer: function(connID) {
		var entities=this.getEntitiesByType( EntityPlayer );
		for (var i = entities.length - 1; i >= 0; i--) {
			if(entities[i].connID==connID) {
				return entities[i];
			}
		}
	},

	findPlayerLog: function(connID) {
		for (var i = this.playersLogged.length - 1; i >= 0; i--) {
			if(this.playersLogged[i].connID==connID) {
				return this.playersLogged[i];
			}
		}
	},
	
	update: function() {
		if(this.gameStarted && this.disconnected==false) {
			Date.now()-ig.game.pingStartCalc

			// HOST STUFF
			if (this.isHost) {

			}

			// UPDATE STUFF
			this.player.isPlayer=true;
			this.parent();
			var x = this.player.pos.x - (ig.system.width / 2);
			var y = this.player.pos.y - (ig.system.height / 2);
			this.screen.x = lerp(this.screen.x, x, ig.system.tick*5);
			this.screen.y = lerp(this.screen.y, y, ig.system.tick*5);

			// CLIENT STUFF
			var playerChanges=this.player.getChanges();
			if (playerChanges!=false) {
				this.connection.toHost("playerUpdate", JSON.stringify(playerChanges) );
			}
		}
	},

	generateSpawns: function() {
		for (var i = ig.game.entities.length - 1; i >= 0; i--) {
			var ent=ig.game.entities[i];

			if(ent instanceof EntitySpawn)
			{
				this.spawnZones.push({x:ent.pos.x, y:ent.pos.y});
			}
		};
	},

	spawnZones: [],

	getRandomSpawn: function() {
		return this.spawnZones[Math.round(Math.random()*(this.spawnZones.length-1))];
	},
	
	draw: function() {
		// Draw all entities and backgroundMaps
		if(this.gameStarted && this.disconnected==false) {
			// DRAW STUFF
			if(this.player.hp>0) {
				this.parent();
				this.font.draw( 'HP : '+this.player.hp+'/3', 0, 0, ig.Font.ALIGN.LEFT );
				this.font.draw( ': Fuel', ig.system.width, 0, ig.Font.ALIGN.RIGHT );
				this.font.draw( Math.round(this.player.fuel*100)+'%', ig.system.width-32, 0, ig.Font.ALIGN.RIGHT );

				this.font.draw( ': Ping', ig.system.width, ig.system.height-8, ig.Font.ALIGN.RIGHT );
				this.font.draw( this.ping+'ms', ig.system.width-32, ig.system.height-8, ig.Font.ALIGN.RIGHT );
			} else {
				ig.system.clear("#000000");
				this.font.draw( 'You are dead.\n Respawning...', (ig.system.width / 2), (ig.system.height / 2), ig.Font.ALIGN.CENTER );
			}

			var entities=this.getEntitiesByType( EntityPlayer );
			for (var i = entities.length - 1; i >= 0; i--) {
				var data=entities[i].getData();
				for (var i = this.playersLogged.length - 1; i >= 0; i--) {
					if(this.playersLogged[i].connID==data.connID) {
						this.playersLogged[i]=data;
						break;
					}
				}
			}

			// if( -(this.pingStartCalc-Date.now()) >= 10000 ) ig.game.connection.close();
		} else if(this.disconnected) {
			// DISCONNECTED SCREEN
			ig.system.clear("#000000");
			this.font.draw( 'Disconnected', (ig.system.width / 2), (ig.system.height / 2), ig.Font.ALIGN.CENTER );
		} else {
			// CONNECTING SCREEN
			ig.system.clear("#000000");
			this.font.draw( 'Connecting...', (ig.system.width / 2), (ig.system.height / 2), ig.Font.ALIGN.CENTER );
		}
	}
});


// Start the Game with 60fps, a resolution of 320x240, scaled
// up by a factor of 2

lerp = function( a,  b,  f)
{
    return a + f * (b - a);
}

nick="";
nickIsSet=false;
scale=2;
nickSet = function() {
	nick=document.getElementById("nameField").value;
	if( nick != "" )
	{
		nickIsSet=true;
		document.getElementById("nicksetter").style.display="none";
		ig.main( '#canvas', MyGame, 60, document.body.clientWidth/scale, 80/scale, scale );
	} else {
		alert("Musisz wpisać nick!");
	}
}


window.onresize = function() {
	if(nickIsSet)
	ig.system.resize(document.body.clientWidth/scale, 80/scale);
}
});