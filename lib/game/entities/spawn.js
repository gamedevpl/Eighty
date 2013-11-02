ig.baked = true;
ig.module( 
    'game.entities.spawn' 
)
.requires(
    'impact.entity'
)
.defines(function(){
    EntitySpawn = ig.Entity.extend({
		size: {x: 6, y: 8},
		offset: {x: 1, y: 0},
		_wmDrawBox: true,
		_wmBoxColor: "rgba(100, 255, 150, 0.5)",
        type: ig.Entity.TYPE.NONE,
        checkAgainst: ig.Entity.TYPE.NONE,
        collides: ig.Entity.COLLIDES.NONE,
        gravityFactor: 0.0
    });
});