/*
 * Enemy demon Class
 */

"use strict";

class EnemyDemon extends BaseEnemy {
    constructor(color, width, height, x, y, physics) {
        super(color, width, height, x, y, "demon", physics);
        this.deathSound = new Audio("../Assets/Demon/EfectoDeSonido_MuerteDemonio.wav");
        this.deathSound.volume = 0.6;
        this.flySpeed = 0.008;
        this.velocity.x = this.flySpeed;
        this.amplitude = 1; // Vertical movement amplitude
        this.frequency = 0.003; // Oscillation frequency
        this.startY = y; // Initial Y position to oscillate around
        this.time = 0; // Time counter for oscillation
        
        // Push force when player hits demon
        this.playerPushForce = new Vec(0.02, -0.015);
        // Configure animations
        this.sheetCols = 7;

        this.scoreValue = 500; // Score value when defeated


        // Define movement animations 
        this.movement = {
            right: { status: false,
                    axis: "x",
                    sign: 1,
                    repeat: true,
                    duration: 100,
                    moveFrames: [0, 3],
                    idleFrames: [0, 3] },
            left:  { status: false,
                    axis: "x",
                    sign: -1,
                    repeat: true,
                    duration: 100,
                    moveFrames: [7, 10],
                    idleFrames: [7, 10] },
            death: { right: [27, 33],
                    left: [34, 40],
                    duration: 50 },
            idle:  { right: [0, 3],
                    left: [7, 10] }
        };

        this.setMoveAnimation();
    }
    
    update(level, deltaTime) {
        if (!this.isAlive) {
            if (this.isDying) {
                // Handle death animation
                this.updateFrame(deltaTime);
                //console.log("Current frame during death:", this.currentFrame);
                // Check if death animation is complete
                if (this.currentFrame >= this.maxFrame) {
                    //console.log("Death animation complete");
                    this.animationComplete = true;
                    this.isDying = false;
                }
            }
            return;
        }
    
        if (this.hitTimer > 0) {
            this.hitTimer -= deltaTime;
        }
    
        this.updateMovement(level, deltaTime);
        this.updateFrame(deltaTime);
    }

    updateMovement(level, deltaTime) {
        if (!this.isDying) {
            this.time += deltaTime;
            // Horizontal movement
            let newXPosition = this.position.plus(new Vec(this.velocity.x * deltaTime, 0));
            // Check if about to hit a wall
            if (level.contact(newXPosition, this.size, 'wall')) {
                this.changeDirection();
            } else {
                this.position = newXPosition;
            }
            
            // Sinusoidal vertical movement
            this.position.y = this.startY + Math.sin(this.time * this.frequency) * this.amplitude;
        }
    }

    changeDirection() {
        // Method to change direction when hitting a wall or edge
        this.isFacingRight = !this.isFacingRight;
        this.velocity.x = -this.velocity.x;
        this.setMoveAnimation();
    }

    setMoveAnimation() {
        const moveData = this.isFacingRight ? 
            this.movement.right : 
            this.movement.left;
        this.setAnimation(moveData.moveFrames[0], moveData.moveFrames[1], true, moveData.duration);
    }

    // In EnemyDemon's takeDamage method (add this if it's missing)
    takeDamage() {
        //console.log("Demon taking damage");
        this.health--;
        if (this.health <= 0) {
            if (game && game.player) {
                game.player.score += this.scoreValue;
            }
            //console.log("Demon dying");
            this.die();
        }
    }

    die() {
        if (!this.deathAnimationStarted) {
            //console.log("Starting demon death animation");
            this.isAlive = false;
            this.isDying = true;
            this.deathAnimationStarted = true;
            this.velocity = new Vec(0, 0);
            this.hitTimer = 0;

            if (this.deathSound) {
                this.deathSound.currentTime = 0; // Reinicia si ya estaba sonando
                this.deathSound.play();
            }
    
            // Get the correct death animation frames based on direction
            const deathFrames = this.isFacingRight ? 
                this.movement.death.right : 
                this.movement.death.left;
                
            //console.log("Death frames:", deathFrames);
            
            // Set the death animation with proper frame tracking
            this.frame = deathFrames[0];
            this.maxFrame = deathFrames[1];
            this.setAnimation(deathFrames[0], deathFrames[1], false, 150);
            
            //console.log("Death animation initialized. Current frame:", this.frame, "Max frame:", this.maxFrame);
        }
    }

    hitPlayer(player) {
        // Only hit the player if the demon is alive and not dying
        if (!this.isDying && !this.deathAnimationStarted && this.hitTimer <= 0) {
            const pushDirection = player.position.x < this.position.x ? -1 : 1;
            player.velocity.x = this.playerPushForce.x * pushDirection;
            player.velocity.y = this.playerPushForce.y;
            // Set high friction and timer
            player.friction = player.hitFriction;
            player.frictionResetTimer = 500; // Reset friction after 500ms
            this.hitTimer = this.hitCooldown;
        }
    }
}