ig.baked = true;
ig.module( 
    'game.entities.player' 
)
.requires(
    'impact.entity',
    'game.entities.particle',
    'game.entities.bullet'
)
.defines(function(){
// Create your own entity, subclassed from ig.Enitity
EntityPlayer = ig.Entity.extend({

    // Set some of the properties
    collides: ig.Entity.COLLIDES.PASSIVE,
    type: ig.Entity.TYPE.A,
    checkAgainst: ig.Entity.TYPE.NONE,

    size: {x: 6, y: 7},
    offset: {x: 1, y: 1},
    hp: 3,

    maxFuel:1.0,
    fuel:1.0,
    gravityFactor: 1.0,

    shootCooldown: 1.0,
    maxShootCooldown: 0.5,

    flip: {x:true, y:false},

    connID: null,

    isPlayer: false,

    kills:0,

    deaths:0,

    nick:"",
    
    // Load an animation sheet
    animSheet: new ig.AnimationSheet( 'media/player.png', 8, 8 ),
    
    init: function( x, y, settings ) {

        this.addAnim( 'idle', 0.1, [0] );
        this.addAnim( 'uidle', 0.1, [2] );
        this.addAnim( 'walk', 0.1, [0,1] );
        this.addAnim( 'uwalk', 0.1, [2,3] );
        

        this.parent( x, y, settings );
        this.currentAnim = this.anims.idle;
    },

    curBullets: [],

    getData: function() {
        return {
            pos: { x:this.pos.x, y:this.pos.y },
            vel: { x:this.vel.x, y:this.vel.y },

            flip: { x: this.flip.x, y:this.flip.y },

            hp: this.hp,

            curBullets: this.curBullets,

            connID: this.connID,
            nick: this.nick,

            kills:this.kills,
            deaths:this.deaths
        };
    },

    setData: function(data) {
        if(data.pos.x!=null)
        this.pos.x=data.pos.x;
        if(data.pos.y!=null)
        this.pos.y=data.pos.y;

        if(data.vel.x!=null)
        this.vel.x=data.vel.x;
        if(data.vel.y!=null)
        this.vel.y=data.vel.y;

        if(data.flip.x!=null)
        this.flip.x=data.flip.x;
        if(data.flip.y!=null)
        this.flip.y=data.flip.y;

        if(data.hp!=null)
        this.hp=data.hp;

        if(data.connID!=null)
        this.connID=data.connID;

        if(data.nick!=null)
        this.nick=data.nick;
    
        if(data.kills!=null)
        this.kills=data.kills;
        if(data.deaths!=null)
        this.deaths=data.deaths;
    },

    checkFuel : function() {
        if(this.fuel>this.maxFuel) {
            this.fuel=this.maxFuel;
        } else if(this.fuel<0) {
            this.fuel=0;
        }
    },

    left:  false,
    right: false,
    jump:  false,
    up:    false,
    shoot: false,

    stateChange: new Array(),

    getChanges: function() {
        if(this.stateChange.length!=0) {
            this.stateChange.push({time:ig.game.connection.getRoomTime() });
            this.stateChange.push(this.getData());
            var data=this.stateChange;
            this.stateChange=new Array();
            return data;
        } else return false;
    },

    timeToRespawn: 0,
    
    update: function() {
        if(this.isPlayer==false) {
            this.stateChange=[];
        }
        if(this.hp<=0 && this.isPlayer==true) {
            this.pos.x=-1000;
            this.pos.y=-1000;
            this.timeToRespawn-=ig.system.tick;
            this.stateChange.push({"up":this.up});
        }

        if( this.timeToRespawn <0 && this.isPlayer==true ) {
            this.timeToRespawn = 0;
            this.hp=3;
            var spawn=ig.game.getRandomSpawn();
            this.pos.x=spawn.x;
            this.pos.y=spawn.y;
            var log=ig.game.findPlayerLog(this.connID);
            log=this.getData();
            this.stateChange.push({"up":this.up});
        } else if(this.timeToRespawn!=0 && this.isPlayer==true) {
            this.parent();
            return;
        }

        if( this.isPlayer ) {
            if(this.jump!=ig.input.state('jump') && ig.input.state('jump')!=null)
            {
                this.jump=ig.input.state('jump');
                this.stateChange.push({"jump":this.jump});
            }

            if(this.left!=ig.input.state('left') && ig.input.state('left')!=null)
            {
                this.left=ig.input.state('left');
                this.stateChange.push({"left":this.left});
            }

            if(this.right!=ig.input.state('right') && ig.input.state('right')!=null)
            {
                this.right=ig.input.state('right');
                this.stateChange.push({"right":this.right});
            }

            if(this.up!=ig.input.state('up') && ig.input.state('up')!=null)
            {
                this.up=ig.input.state('up');
                this.stateChange.push({"up":this.up});
            }

            if(this.shoot!=ig.input.state('shoot') && ig.input.state('shoot')!=null)
            {
                this.shoot=ig.input.state('shoot');
                // this.stateChange.push({"shoot":this.shoot});
            }
        }

        this.shootCooldown -= ig.system.tick;
        if(this.shootCooldown<0.0) this.shootCooldown=0;

        this.gravityFactor+=ig.system.tick;
        this.vel.x=lerp(this.vel.x, 0, ig.system.tick*10);

        if( this.jump ) {
            if(this.standing==true) {
                this.vel.y = -30;
            } else if(this.fuel > 0) {
                this.gravityFactor=0.25;
                this.vel.y += -80*ig.system.tick;
                this.fuel -= ig.system.tick;
                if( (ig.system.tick > ( 1000/90/1000 ) && ig.system.tick < ( 1000/30/1000 )) && Math.round(Math.random()*2) >= 1)
                    ig.game.spawnEntity(EntityParticle,this.pos.x+3,this.pos.y+8);
                this.checkFuel();
            }
        } else {
            this.fuel += ig.system.tick/2;
            this.checkFuel();
        }

        if( this.right ) {
            this.vel.x += 500*ig.system.tick;
        }

        if( this.left ) {
            this.vel.x -= 500*ig.system.tick;
        }

        if( this.standing && !(this.right || this.left) ) {
            if( this.up )
                this.currentAnim = this.anims.uidle;
            else
                this.currentAnim = this.anims.idle;
        } else if( this.vel.x > 0 ) {
            if( ig.input.state('up') && this.standing )
                this.currentAnim = this.anims.uwalk;
            else if ( this.standing )
                this.currentAnim = this.anims.walk;
            else if ( ig.input.state('up') )
                this.currentAnim = this.anims.uidle;
            else
                this.currentAnim = this.anims.idle;

            this.flip.x=false;
        } else if( this.vel.x < 0 ) {
            if( this.up && this.standing )
                this.currentAnim = this.anims.uwalk;
            else if ( this.standing )
                this.currentAnim = this.anims.walk;
            else if ( ig.input.state('up') )
                this.currentAnim = this.anims.uidle;
            else
                this.currentAnim = this.anims.idle;

            this.flip.x=true;
        }

        this.currentAnim.flip.x=this.flip.x;

        if( this.shoot && this.shootCooldown == 0 ) {

            this.shootBullet();
        }

        if( this.gravityFactor>1.0 ) this.gravityFactor = 1;
        this.parent();
    },
    specialUpdate: function(delta) {
        var tick=ig.system.tick;
        ig.system.tick=delta;
        this.update();
        ig.system.tick=tick;
    },

    shootBullet: function() {
        var settings = { vel: { x: 2000, y: 0 } };
        if(this.up) {
            settings.vel.y=-settings.vel.x;
            settings.vel.x=0;
        }
            //right
        var offX= 5;
        if(this.flip.x) {
            //left
            offX=-6;
            settings.vel.x=-settings.vel.x;
        }

        this.shootCooldown=this.maxShootCooldown;
        var ent=null;
        if(this.up)
            ent= ig.game.spawnEntity(EntityBullet,this.pos.x+3,this.pos.y-1, settings);
        else
            ent= ig.game.spawnEntity(EntityBullet,this.pos.x+3+offX,this.pos.y+2, settings);
        ent.connID=this.connID;

        this.stateChange.push({"bullet":{
            pos:{x:ent.pos.x,y:ent.pos.y},
            vel:{x:ent.vel.x,y:ent.vel.y},
            time:ig.game.connection.getRoomTime()
        }});
    },

    shooted: function(connID) {
        if(ig.game.isHost==true) {
            ig.game.connection.broadcast( "bulletHit", JSON.stringify({connID:this.connID, bltID:connID}) );
            if(this.hp-1<=0) ig.game.connection.broadcast( "playerKilled", JSON.stringify({plrID:this.connID, kilID:connID}) );
        }
    },

    specialUpdate: function(delta) {
        var iterations=20;
        delta/=iterations;
        for (var i = 0; i <= iterations; i++) {
            var maxStep=ig.Timer.maxStep;
            ig.Timer.maxStep=1;
            var tick=ig.system.tick;
            ig.system.tick=delta;
            this.update();
            ig.system.tick=tick;
            ig.Timer.maxStep=maxStep;
        };
    }
});
});