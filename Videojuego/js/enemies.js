/*
 * Enemy classes
 */

"use strict";

class BaseEnemy extends AnimatedObject {
    constructor(color, width, height, x, y, type, physics) {
        super(color || "red", width, height, x, y, type || "enemy");
        this.physics = physics;
        this.velocity = new Vec(0.0, 0.0);
        this.health = 1; // Most enemies die in one hit
        this.isAlive = true;
        this.isDying = false;
        this.isFacingRight = true;
        
        // Collision properties
        this.playerPushForce = new Vec(0.015, -0.01); // Default push force when hitting player
        this.hitTimer = 0; // Cooldown for attacks
        this.hitCooldown = 500; // Milliseconds between attacks
        
        // Animation properties
        this.animationState = "idle"; // idle, move, attack, die
        this.sheetCols = 6; // Default value, should be overridden
    }
    
    update(level, deltaTime) {
        if (!this.isAlive) return;
        
        if (this.hitTimer > 0) {
            this.hitTimer -= deltaTime;
        }
        
        if (this.isDying) {
            // Handle death animation
            this.updateFrame(deltaTime);
            return;
        }
        
        this.updateMovement(level, deltaTime);
        this.updateFrame(deltaTime);
    }
    
    updateMovement(level, deltaTime) {
        // To be implemented by subclasses
    }
    
    hitPlayer(player) {
        // Push the player
        const pushDirection = player.position.x < this.position.x ? -1 : 1;
        player.velocity.x = this.playerPushForce.x * pushDirection;
        player.velocity.y = this.playerPushForce.y;
        
        // Set cooldown
        this.hitTimer = this.hitCooldown;
    }
    
    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.isAlive = false;
        this.isDying = true;
        // Set death animation
        this.setAnimation(this.deathAnimationFrames[0], this.deathAnimationFrames[1], false, 100);
    }
    
    setIdleAnimation() {
        const idleFrame = this.idleAnimationFrames[this.isFacingRight ? 0 : 1];
        this.setAnimation(idleFrame[0], idleFrame[1], true, 150);
    }
    
    setMoveAnimation() {
        const moveFrame = this.moveAnimationFrames[this.isFacingRight ? 0 : 1];
        this.setAnimation(moveFrame[0], moveFrame[1], true, 100);
    }
    
    setAttackAnimation() {
        const attackFrame = this.attackAnimationFrames[this.isFacingRight ? 0 : 1];
        this.setAnimation(attackFrame[0], attackFrame[1], false, 80);
    }
    
    // Method to change direction when hitting a wall or edge
    changeDirection() {
        this.isFacingRight = !this.isFacingRight;
        this.velocity.x = -this.velocity.x;
        
        if (this.animationState === "move") {
            this.setMoveAnimation();
        }
    }
}

class EnemySkeleton extends BaseEnemy {
    constructor(color, width, height, x, y, physics) {
        super(color, width, height, x, y, "skeleton", physics);
        this.walkSpeed = 0.006;
        this.velocity.x = this.walkSpeed;
        this.attackRange = 2; // Distance at which skeleton will attack
        this.attackTimer = 0;
        this.attackDuration = 500; // Duration of attack animation
        this.attackCooldown = 1000; // Time between attacks
        
        // Configure animations
        this.sheetCols = 18;
        
        // Animation frames [start, end] for right and left facing
        this.idleAnimationFrames = [[0, 0], [18, 18]]; // [right, left]
        this.moveAnimationFrames = [[1, 12], [19, 30]]; // [right, left]
        this.attackAnimationFrames = [[53, 70], [35, 52]]; // [right, left]
        this.deathAnimationFrames = [[71, 85],[86, 99]]; // [right, left]
        
        this.setMoveAnimation();
        this.animationState = "move";
    }
    
    updateMovement(level, deltaTime) {
        // Apply gravity
        this.velocity.y += this.physics.gravity * deltaTime;
        
        // Move horizontally
        let newXPosition = this.position.plus(new Vec(this.velocity.x * deltaTime, 0));
        
        // Check if about to hit a wall
        if (level.contact(newXPosition, this.size, 'wall')) {
            this.changeDirection();
            return; // Skip the rest of the update for this frame
        }
        
        // Check if about to walk off an edge
        // Look ahead in the direction the skeleton is moving
        const edgeCheckX = newXPosition.x + (this.isFacingRight ? this.size.x : 0);
        const edgeCheckY = newXPosition.y + this.size.y + 0.1; // Check just below feet
        
        const hasFloorAhead = level.contact(
            new Vec(edgeCheckX, edgeCheckY),
            new Vec(0.1, 0.1),
            'wall'
        );
        
        if (!hasFloorAhead) {
            this.changeDirection();
            return; // Skip the rest of the update for this frame
        }
        
        // If we passed both checks, move to the new position
        this.position = newXPosition;
        
        // Move vertically (gravity)
        let newYPosition = this.position.plus(new Vec(0, this.velocity.y * deltaTime));
        if (!level.contact(newYPosition, this.size, 'wall')) {
            this.position = newYPosition;
        } else {
            // Stop falling
            this.velocity.y = 0;
            this.position.y = Math.ceil(this.position.y);
        }
        
        // Check for player proximity to attack
        const player = level.player;
        const distance = Math.abs(player.position.x - this.position.x);
        
        // If player is within attack range and cooldown is over
        if (distance < this.attackRange && this.attackTimer <= 0 && 
            Math.abs(player.position.y - this.position.y) < 1) {
            this.isFacingRight = player.position.x > this.position.x;
            this.attack();
        }
        
        if (this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
            if (this.attackTimer <= 0 && this.animationState === "attack") {
                this.setMoveAnimation();
                this.animationState = "move";
                this.velocity.x = this.walkSpeed * (this.isFacingRight ? 1 : -1);
            }
        }
    }
    
    attack() {
        this.velocity.x = 0; // Stop while attacking
        this.setAttackAnimation();
        this.animationState = "attack";
        this.attackTimer = this.attackDuration + this.attackCooldown;
    }
}

class EnemyDemon extends BaseEnemy {
    constructor(color, width, height, x, y, physics) {
        super(color, width, height, x, y, "demon", physics);
        this.flySpeed = 0.008;
        this.velocity.x = this.flySpeed;
        this.amplitude = 1; // Vertical movement amplitude
        this.frequency = 0.003; // Oscillation frequency
        this.startY = y; // Initial Y position to oscillate around
        this.time = 0; // Time counter for oscillation
        
        // Higher push force because it's a stronger enemy
        this.playerPushForce = new Vec(0.02, -0.015);
        
        // Configure animations
        this.sheetCols = 7;
        
        // Animation frames [start, end] for right and left facing
        this.idleAnimationFrames = [[0, 3], [7, 10]]; // [right, left]
        this.moveAnimationFrames = [[0, 3], [7, 10]]; // Same as idle for flying
        this.deathAnimationFrames = [[27, 33],[34, 40]]; // [right, left]
        
        this.setMoveAnimation();
        this.animationState = "move";
    }
    
    updateMovement(level, deltaTime) {
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

class EnemyJumper extends BaseEnemy {
    constructor(color, width, height, x, y, physics) {
        super(color, width, height, x, y, "jumper", physics);
        this.jumpSpeed = 0.03;
        this.jumpCooldown = 500; // Minimum time between jumps
        this.jumpTimer = 0;
        this.playerJumpDetectionRange = 5; // Range to detect player jump

        // Configure animations
        this.sheetCols = 15;

        // Animation frames [start, end] for right and left facing
        this.idleAnimationFrames = [[0, 5], [15, 20]]; // [right, left]
        this.jumpAnimationFrames = [[30, 35], [45, 50]]; // [right, left]
        this.deathAnimationFrames = [[90, 104], [105, 119]]; // [right, left]

        this.setIdleAnimation();
    }

    updateMovement(level, deltaTime) {
        // check if level and player exist
        if (!level || !level.player) {
            console.warn('Level or player not properly initialized');
            return;
        }

        // Apply gravity
        this.velocity.y += this.physics.gravity * deltaTime;

        // Update jump timer
        if (this.jumpTimer > 0) {
            this.jumpTimer -= deltaTime;
        }

        // Move vertically (gravity or jump)
        let newYPosition = this.position.plus(new Vec(0, this.velocity.y * deltaTime));
        if (!level.contact(newYPosition, this.size, 'wall')) {
            this.position = newYPosition;

            // If we're moving upward, we're jumping
            if (this.velocity.y < 0 && this.animationState !== "jump") {
                this.setJumpAnimation();
                this.animationState = "jump";
            }
        } else {
            // We've hit ground
            this.velocity.y = 0;
            this.position.y = Math.floor(this.position.y);

            // If we were jumping, now we're idle
            if (this.animationState === "jump") {
                this.setIdleAnimation();
                this.animationState = "idle";
            }
        }

        // Check if player jumped recently and we're in range
        const player = level.player;
        // Safe check for player properties
        if (player && player.isJumping) {
            const distance = Math.abs(player.position.x - this.position.x);

            if (distance < this.playerJumpDetectionRange &&
                this.jumpTimer <= 0 &&
                this.animationState === "idle") {
                this.jump(level);
            }
        }
    }

    jump(level) {
        if (!level || !level.player) return;

        this.velocity.y = -this.jumpSpeed;
        this.jumpTimer = this.jumpCooldown;
        this.setJumpAnimation();
        this.animationState = "jump";

        // Face towards the player
        this.isFacingRight = level.player.position.x > this.position.x;
    }

    setJumpAnimation() {
        const jumpFrame = this.jumpAnimationFrames[this.isFacingRight ? 0 : 1];
        this.setAnimation(jumpFrame[0], jumpFrame[1], false, 200);
    }
}