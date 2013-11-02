ig.baked = true;
ig.module( 
    'game.entities.particle' 
)
.requires(
    'impact.entity'
)
.defines(function(){
// Create your own entity, subclassed from ig.Enitity
EntityParticle = ig.Entity.extend({
    // single pixel sprites
    size: { x:4, y:4 },
    offset: { x:4, y:4 },

    // particle will collide but not effect other entities
    type: ig.Entity.TYPE.NONE,
    checkAgainst: ig.Entity.TYPE.NONE,
    collides: ig.Entity.COLLIDES.LITE,
    gravityFactor: -0.25,
    // default particle lifetime & fadetime
    lifetime: 1.0,
    fadetime: 1.0,

    // particles will bounce off other entities when it collides
    minBounceVelocity: 25.0,
    bounciness: 0.5,
    friction: { x:1, y:1 },

    vel: { x:0, y:0 },

    connID: 0,

    animSheet: new ig.AnimationSheet( 'media/particle.png', 8, 8 ),

    init: function( x, y, settings ) {
        this.parent( x, y, settings );
        this.addAnim( 'idle', 0.1, [0,1,2,3,2,3,1] );
        this.currentAnim = this.anims.idle;
        // take velocity and add randomness to vel
        this.vel.x = (Math.random()*20-10);
        this.vel.y = (Math.random()*50-25);
     
        // creates a flicker effect
        this.currentAnim.gotoRandomFrame();

        // init timer for fadetime
        this.idleTimer = new ig.Timer();

    },

    update: function() {
        // check if particle has existed past lifetime
        // if so, remove particle
        if(this.idleTimer.delta() > this.lifetime){
             this.kill();
             return;
        } 
     
        // fade the particle effect using the aplha blend
        this.currentAnim.alpha = this.idleTimer.delta().map( this.lifetime - this.fadetime, this.lifetime, 1, 0 );
        this.parent();
    } 
});
});