/*
 * Enemy Base Class
 * Enrique Antonio Pires A01424547
 * Santiago Coronado A01785558
 * Juan de Dios Gastelum A01784523
 */

"use strict";

class BaseEnemy extends AnimatedObject {
    constructor(color, width, height, x, y, type, physics) {
        super(color || "red", width, height, x, y, type || "enemy");
        this.physics = physics;
        this.velocity = new Vec(0.0, 0.0);
        this.health = 1; // All enemies die in one hit
        this.isAlive = true;
        this.isDying = false;
        this.isFacingRight = true;
        this.deathAnimationStarted = false; // Flag to track death animation start
        this.animationComplete = false; // Flag to track animation completion

        // Collision properties
        this.hitTimer = 0; //Cooldown for attacks
        this.hitCooldown = 500; //Milliseconds between attacks
        this.playerPushForce = new Vec(0.02, -0.01); // Default push force when hitting player
        this.scoreValue = 300; // Score value when defeated


        // Movement state tracking
        this.movement = {
            right: { status: false,
                    axis: "x",
                    sign: 1,
                    repeat: true,
                    duration: 100 },
            left:  { status: false,
                    axis: "x",
                    sign: -1,
                    repeat: true,
                    duration: 100 }
        };
    }

    update(level, deltaTime) {
        if (!this.isAlive) return;

        if (this.hitTimer > 0) {
            this.hitTimer -= deltaTime;
        }

        if (this.isDying) {
            // Handle death animation
            this.updateFrame(deltaTime);
            // Check if death animation is complete
            if (this.frame >= this.maxFrame) {
                this.animationComplete = true;
            }
            return;
        }

        if (this.isAlive) {
            this.updateMovement(level, deltaTime);
            this.updateFrame(deltaTime);
        }
    }

    updateMovement(level, deltaTime) {
        // To be implemented by subclasses
    }

    startMovement(direction) {
        const dirData = this.movement[direction];
        dirData.status = true;
        this.isFacingRight = direction === "right";
        this.updateMovementState();
    }

    stopMovement(direction) {
        const dirData = this.movement[direction];
        dirData.status = false;
        this.updateMovementState();
    }

    updateMovementState() {
        // Calculate velocity based on movement status
        let velocity = 0;
        if (this.movement.right.status) {
            velocity += this.walkSpeed;
        }
        if (this.movement.left.status) {
            velocity -= this.walkSpeed; 
        }
        this.velocity.x = velocity;
    }

    hitPlayer(player) {
        if (!this.isDying) {
            const pushDirection = player.position.x < this.position.x ? -1 : 1;
            player.velocity.x = 0.02 * pushDirection; // Stronger horizontal push
            player.velocity.y = -0.015; // Consistent vertical push

            // Set high friction and timer
            player.friction = player.hitFriction;
            player.frictionResetTimer = 500; // Reset friction after 500ms

            // Reset movement flags - this prevents the player from continuing to walk
            // in the same direction after being hit
            player.movement.right.status = false;
            player.movement.left.status = false;

            // Disable player controls temporarily
            player.disableControls = true;
            
            // Create a timeout to re-enable controls slightly before friction resets
            setTimeout(() => {
                player.disableControls = false;
            }, 200); // Re-enable controls after 300ms
        }
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            if (game && game.player) {
                game.player.score += this.scoreValue;
            }
            if (this.health <= 0 && gameStats) {
                gameStats.recordEnemyDefeated();
            }
            this.die();
        }
    }

    die() {
        if (!this.deathAnimationStarted) {
            this.isAlive = false;
            this.isDying = true;
            this.deathAnimationStarted = true;
            this.velocity = new Vec(0, 0); // Stop movement
            this.hitTimer = 0; // Disable hit interactions

            const deathFrames = this.isFacingRight ? 
            this.movement.death.right : 
            this.movement.death.left;

            // Set animation without callback
            this.setAnimation(deathFrames[0], deathFrames[1], false, 150);
        }
    }

    setIdleAnimation() {
        const idleFrames = this.isFacingRight ? 
            this.movement.idle.right : 
            this.movement.idle.left;
        this.setAnimation(idleFrames[0], idleFrames[1], true, 150);
    }
}
