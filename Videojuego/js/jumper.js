/*
 * Enemy Jumper Class
 * Enrique Antonio Pires A01424547
 * Santiago Coronado A01785558
 * Juan de Dios Gastelum A01784523
 */

"use strict";

class EnemyJumper extends BaseEnemy {
    constructor(_color, width, height, x, y, _type, physics) {
        super("red", width, height, x, y, "jumper");

        this.jumpSound = new Audio("../Assets/Jumper/EfectoDeSonido_SaltoJumper.wav");
        this.jumpSound.volume = 0.2;

        this.deathSound = new Audio("../Assets/Jumper/EfectoDeSonido_MuerteJumper.wav");
        this.deathSound.volume = 0.5;

        this.physics = physics;
        this.velocity = new Vec(0, 0);
        this.jumpTimer = 0;
        this.jumpInterval = 2000; // Backup timer in case player doesn't jump
        this.isAlive = true;
        this.isDying = false;
        this.health = 1;
        this.lastPlayerVelocityY = 0; // Track player's previous vertical velocity
        this.scoreValue = 200; // Score value when defeated


        this.movement = {
            death: { 
                right: [90, 104], 
                left: [105, 120]   
            },
            idle: {
                right: [0, 5],
                left: [6, 11]
            }
        };
    }


    update(level, deltaTime) {
        if (this.isDying) {
            // Handle death animation
            this.updateFrame(deltaTime);
            // Check if death animation is complete
            if (this.frame >= this.maxFrame) {
                this.animationComplete = true;
            }
            return;
        }

        if (level.player) {
            const playerJustJumped = this.lastPlayerVelocityY >= 0 && level.player.velocity.y < 0;
            if (playerJustJumped) {
                this.velocity.y = -0.02; // Jump when player jumps
                this.jumpTimer = 0;

                if (this.jumpSound) {
                    this.jumpSound.currentTime = 0;
                    this.jumpSound.play();
                }
            }
            this.lastPlayerVelocityY = level.player.velocity.y;
        }
        // Backup jumping behavior if player hasn't jumped in a while 
        this.jumpTimer += deltaTime;
        if (this.jumpTimer >= this.jumpInterval) {
            this.velocity.y = -0.02; // Jump strength
            this.jumpTimer = 0;

            if (this.jumpSound) {
                this.jumpSound.currentTime = 0;
                this.jumpSound.play();
            }
        }

        // Apply gravity
        this.velocity.y += this.physics.gravity * deltaTime;
        
        // Vertical movement
        let newPos = this.position.plus(new Vec(0, this.velocity.y * deltaTime));
        if (!level.contact(newPos, this.size, 'wall')) {
            this.position = newPos;
        } else {
            this.velocity.y = 0;
        }
        
        this.updateFrame(deltaTime);
    }

    takeDamage() {
        if (!this.isDying && this.isAlive) {
            this.health--;
            if (this.health <= 0) {
                if (game && game.player) {
                    game.player.score += this.scoreValue;
                }
                if (this.deathSound) {
                    this.deathSound.currentTime = 0;
                    this.deathSound.play();
                }
                this.die();
            }
        }
    }

    hitPlayer(player) {
        if (!this.isDying) {
            const pushDirection = player.position.x < this.position.x ? -1 : 1;
            player.velocity.x = 0.02 * pushDirection; // Stronger horizontal push
            player.velocity.y = -0.015; // Consistent vertical push

            // Set high friction and timer
            player.friction = player.hitFriction;
            player.frictionResetTimer = 500; // Reset friction after 500ms
        }
    }

    die() {
        if (!this.deathAnimationStarted) {
            this.isAlive = false;
            this.isDying = true;
            this.deathAnimationStarted = true;
            this.velocity = new Vec(0, 0);
            this.hitTimer = 0;

            if (this.deathSound) {
                this.deathSound.currentTime = 0;
                this.deathSound.play();
            }
    
            // Get death animation frames based on direction
            const deathFrames = this.isFacingRight ? 
                this.movement.death.right : 
                this.movement.death.left;
            
            // Set the animation
            this.setAnimation(deathFrames[0], deathFrames[1], false, 150);
        }
    }
}