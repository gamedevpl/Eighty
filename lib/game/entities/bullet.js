ig.baked = true;
ig.module( 
    'game.entities.bullet' 
)
.requires(
    'impact.entity'
)
.defines(function(){

EntityBullet = ig.Entity.extend({
    size: { x:1, y:1 },
    offset: { x:0, y:0 },

    collides: ig.Entity.COLLIDES.ACTIVE,
    type: ig.Entity.TYPE.PASSIVE,
    checkAgainst: ig.Entity.TYPE.A,

    gravityFactor: 0,

    liveTime:0.0,
    maxLiveTime:1.0,

    connID: null,

    animSheet: new ig.AnimationSheet( 'media/bullet.png', 1, 1 ),

    init: function( x, y, settings ) {
        this.parent( x, y, settings );
        this.addAnim( 'idle', this.maxLiveTime/4, [0,1,2,3] );
        this.currentAnim = this.anims.idle;
    },

    update: function() {
        this.liveTime+=ig.system.tick;

        if(this.liveTime>this.maxLiveTime) {this.kill();return;}

        this.parent();
    },

    handleMovementTrace: function( res ) {
        if( res.collision.y || res.collision.x ) {
            this.kill();return;
        }
        this.parent(res);
    },

    collideWith: function( other, axis ) {
        // check player
        if( other instanceof EntityPlayer )
        {
            other.shooted(this.connID);
            this.kill();return;
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