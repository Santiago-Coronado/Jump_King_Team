/*
 * Enemy Classes
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
        // Push player away from enemy
        const pushDirection = player.position.x < this.position.x ? -1 : 1;
        player.velocity.x = this.playerPushForce.x * pushDirection;
        player.velocity.y = this.playerPushForce.y;
        if (player.damageSound) {
            player.damageSound.currentTime = 0;
            player.damageSound.play();
        }

        // Set high friction and timer
        player.friction = player.hitFriction;
        player.frictionResetTimer = 500; // Reset friction after 500ms

        // Set cooldown
        this.hitTimer = this.hitCooldown;
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            if (game && game.player) {
                game.player.score += this.scoreValue;
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

class EnemySkeleton extends BaseEnemy {
    constructor(color, width, height, x, y, type ,physics) {
        super(color, width, height, x, y, "skeleton");
        this.attackSound = new Audio("../Assets/Skeleton/EfectoDeSonido_AtaqueEsqueleto.wav");
        this.attackSound.volume = 0.4;

        this.deathSound = new Audio("../Assets/Skeleton/EfectoDeSonido_MuerteEsqueleto.wav");
        this.deathSound.volume = 0.4;
        
        this.walkSpeed = 0.006;
        this.physics = physics;
        this.attackRange = 2; // Distance at which skeleton will attack
        this.attackTimer = 0;
        this.attackDuration = 400; // Duration of attack animation
        this.attackCooldown = 1000; // Time between attacks
        this.state = "moving";
        this.velocity = new Vec(this.walkSpeed, 0);
        this.idleTimer = 0; // Time spent idle
        this.idleDuration = 1000; // Duration to stay idle before moving

        // Get sprite configurations from levelChars
        const spriteConfigs = levelChars["S"].sprites;

        // Load all spritesheets
        this.sprites = {
            move: {
                image: new Image(),
                rect: new Rect(0, 0, 22, 33),
                sheetCols: 13,
                path: '../assets/Skeleton/Skeleton_Walk_Assets.png',
                scale: { width: 2, height: 2.5 } // Scale for the move sprite
            },
            attack: {
                image: new Image(),
                rect: new Rect(0, 0, 43, 37),
                sheetCols: 18,
                path: '../assets/Skeleton/Skeleton_Attack_Assets.png',
                scale: { width: 3.5, height: 2.8 } // Scale for the attack sprite
            },
            death: {
                image: new Image(),
                rect: new Rect(0, 0, 33, 32),
                sheetCols: 15,
                path: '../assets/Skeleton/Skeleton_Dead_Assets.png',
                scale: { width: 2.5, height: 2.4 } // Scale for the death sprite
            }
        };

        // loading state tracking
        this.spritesLoaded = {
            move: false,
            attack: false,
            death: false
        };

        // Load all images with proper loading state tracking
        Object.entries(this.sprites).forEach(([key, sprite]) => {
            sprite.image.onload = () => {
                console.log(`Loaded sprite: ${sprite.path}`);
                this.spritesLoaded[key] = true;
                
                // Initialize sprite properties when move sprite is loaded
                if (key === 'move') {
                    this.currentSprite = 'move';
                    this.sprite = sprite.image;
                    this.spriteRect = sprite.rect;
                    this.sheetCols = sprite.sheetCols;
                    this.setMoveAnimation();
                }
            };
            sprite.image.onerror = (err) => {
                console.error(`Failed to load sprite: ${sprite.path}`, err);
            };
            sprite.image.src = sprite.path;
        });

        // Set initial sprite
        this.currentSprite = 'move';
        this.sprite = this.sprites.move.image;
        this.spriteRect = this.sprites.move.rect;
        this.sheetCols = this.sprites.move.sheetCols;


         // Define base size for consistent rendering
         this.baseSize = {
            width: 2,    // Base width in game units
            height: 2.5  // Base height in game units
        };

        // Define sprite offsets for each state to center the animations
        this.spriteOffsets = {
            move: { x: 0, y: 0 },
            attack: { x: -0.15, y: -0.15 },  // Adjust these values to center the attack animation
            death: { x: -0.1, y: -0.1 }       // Adjust these values to center the death animation
        };

        // Define movement animations with updated frame numbers
        this.movement = {
            right: { 
                status: false,
                axis: "x",
                sign: 1,
                repeat: true,
                duration: 80,
                moveFrames: [1, 12],
                idleFrames: [0]
            },
            left: {
                status: false,
                axis: "x",
                sign: -1,
                repeat: true,
                duration: 80,
                moveFrames: [13, 24],
                idleFrames: [13]
            },
            attack: {
                status: false,
                repeat: false,
                duration: 80,
                right: [0, 17],
                left: [18, 36]
            },
            death: {
                right: [0, 14],
                left: [15, 30]
            },
            idle: {
                right: [0, 0],
                left: [13, 13]
            }
        };
        this.setMoveAnimation();
    }

    changeSprite(state) {
        if (this.currentSprite !== state && this.spritesLoaded[state]) {
            this.currentSprite = state;
            this.sprite = this.sprites[state].image;
            this.spriteRect = this.sprites[state].rect;
            this.sheetCols = this.sprites[state].sheetCols;
        }
    }

    draw(ctx, scale) {
        if (!this.spritesLoaded[this.currentSprite]) {
            return; // Don't draw if current sprite isn't loaded
        }

        ctx.save();
        const spriteWidth = this.spriteRect.width;
        const spriteHeight = this.spriteRect.height;
        
        // Calculate sprite position based on current frame
        const sx = (this.frame % this.sheetCols) * spriteWidth;
        const sy = Math.floor(this.frame / this.sheetCols) * spriteHeight;
        
        // Get offset and scale for current state
        const offset = this.spriteOffsets[this.currentSprite] || { x: 0, y: 0 };
        const spriteScale = this.sprites[this.currentSprite].scale;
        
        // Calculate drawing position with offset
        const drawX = (this.position.x + offset.x) * scale;
        const drawY = (this.position.y + offset.y) * scale;
        
        // Draw the sprite using the state-specific scale
        ctx.drawImage(this.sprite,
            sx, sy, spriteWidth, spriteHeight,
            drawX, drawY,
            spriteScale.width * scale,
            spriteScale.height * scale);
        
        ctx.restore();
    }

    update(level, deltaTime) {
        if (!this.spritesLoaded[this.currentSprite]) {
            return;
        }

        if (this.isDying) {
            // Handle death animation
            this.updateFrame(deltaTime);
            // Check if death animation is complete
            if (this.isFacingRight) {
                if (this.frame >= this.maxFrame) {
                    this.animationComplete = true;
                }
            } else {
                if (this.frame <= this.maxFrame) {
                    this.animationComplete = true;
                }
            }
            // Still apply gravity during death animation
            this.updateMovement(level, deltaTime);
            return;
        }
    
        if (this.hitTimer > 0) {
            this.hitTimer -= deltaTime;
        }
    
        if (this.isAlive) {
            this.updateMovement(level, deltaTime);
            this.updateFrame(deltaTime);
        }
    }

    updateFrame(deltaTime) {
        // Add safety check before updating frame
        if (!this.spritesLoaded[this.currentSprite]) {
            return;
        }
        
        // Call parent's updateFrame method
        super.updateFrame(deltaTime);
    }

    updateMovement(level, deltaTime) {
        // Apply gravity
        this.velocity.y += this.physics.gravity * deltaTime;

        if (this.isDying) {
            // Check vertical collision
            let newYPosition = this.position.plus(new Vec(0, this.velocity.y * deltaTime));
            if (!level.contact(newYPosition, this.size, 'wall')) {
                this.position = newYPosition;
            } else {
                this.velocity.y = 0;
                this.position.y = Math.ceil(this.position.y);
            }
            return;
        }    
    
        // Check state transitions and execute state actions
        if (this.state === "moving") {
            if (this.canAttack(level)) {
                this.changeState("attacking");
            } else {
                // Moving state actions
                let newXPosition = this.position.plus(new Vec(this.velocity.x * deltaTime, 0));
                const wallCollision = level.contact(
                    new Vec(
                        newXPosition.x + (this.isFacingRight ? this.size.x : 0), 
                        this.position.y + (this.size.y * 0.2)
                    ),
                    new Vec(0.2, this.size.y * 0.6),
                    'wall'
                );
    
                const groundAhead = this.hasGroundAhead(level, this.position);
                
                /* console.log({
                    currentX: this.position.x,
                    attemptedX: newXPosition.x,
                    wallCollision: wallCollision,
                    hasGround: groundAhead,
                    size: this.size,
                    deltaTime: deltaTime
                }); */

                if (wallCollision || !groundAhead) {
                    this.position = this.position.plus(new Vec(this.isFacingRight ? 1 : -1, 0));
                    this.changeDirection();
                } else {
                    this.position = newXPosition;
                }
            }
        } 
        else if (this.state === "attacking") {
            this.attackTimer -= deltaTime;
            this.dealAttackDamage(level);
            if (this.attackTimer <= 0) {
                this.changeState("idle");
            }
        } 
        else if (this.state === "idle") {
            if (this.canAttack(level)) {
                this.changeState("attacking");
            } else {
                this.idleTimer += deltaTime;
                if (this.idleTimer >= this.idleDuration) {
                    this.changeState("moving");
                }
            }
        }
        else if (this.state === "death") {
            if (!this.animationComplete) {
                this.updateFrame(deltaTime);
            }
        }
        //console.log("Skeleton state:", this.state);
        //console.log("Velocity:", this.velocity);
    }
    
    changeState(newState) {
        this.state = newState;
    
        switch (newState) {
            case "moving":
                this.changeSprite('move');
                this.velocity.x = this.isFacingRight ? this.walkSpeed : -this.walkSpeed;
                this.setMoveAnimation();
                break;
            case "attacking":
                this.changeSprite('attack');
                this.velocity.x = 0;
                const attackFrames = this.isFacingRight ? 
                    this.movement.attack.right : 
                    this.movement.attack.left;
                this.setAnimation(attackFrames[0], attackFrames[1], false, 80);
                this.attackTimer = this.attackDuration + this.attackCooldown;
                break;
            case "idle":
                this.changeSprite('move');
                this.velocity.x = 0;
                this.idleTimer = 0;
                const idleFrames = this.isFacingRight ? 
                    this.movement.idle.right : 
                    this.movement.idle.left;
                this.setAnimation(idleFrames[0], idleFrames[1], true, 150);
                break;
                case "death":
                this.changeSprite('death');
                this.velocity = new Vec(0, 0);
                const deathFrames = this.isFacingRight ? 
                    this.movement.death.right : 
                    this.movement.death.left;
                this.setAnimation(deathFrames[0], deathFrames[1], false, 150);
                break;
        }
    }

    // attack damage method
    dealAttackDamage(level) {
        if (this.state === "attacking" && level.player) {
            const distance = Math.abs(level.player.position.x - this.position.x);
            const attackProgress = (this.attackDuration - this.attackTimer) / this.attackDuration;
            if (distance < this.attackRange && attackProgress > 0.7) {
                if (this.attackSound) {
                    this.attackSound.currentTime = 0;
                    this.attackSound.play();
                }
                this.hitPlayer(level.player);
            }
        }
    }

    canAttack(level) {
        if (!level.player) return false;
        
        const distance = Math.abs(level.player.position.x - this.position.x);
        const verticalDistance = Math.abs(level.player.position.y - this.position.y);

        /* console.log("Attack Check:", {
            distance,
            verticalDistance,
            attackRange: this.attackRange,
            attackTimer: this.attackTimer,
            willAttack: distance < this.attackRange && 
                this.attackTimer <= 0 && 
                verticalDistance < 3
        }); */

        return distance < this.attackRange && 
               this.attackTimer <= 0 && 
               verticalDistance < 2;
    }

    hasGroundAhead(level, position) {
        // Check further ahead in the direction of movement
        const lookAhead = this.isFacingRight ? 1 : -0.5;
        const edgeCheckX = position.x + (this.size.x * 2 * lookAhead); 
        const groundCheckWidth = 0.8; 

        // Check for ground below the next position with multiple points
        const groundCheckPoints = [
            // Check near the edge
            level.contact(
                new Vec(edgeCheckX, position.y + this.size.y + 0.1),
                new Vec(groundCheckWidth, 0.2),
                'wall'
            ),
            // Check a bit before the edge for more reliable detection
            level.contact(
                new Vec(edgeCheckX - (lookAhead * this.size.x/2), position.y + this.size.y + 0.1),
                new Vec(groundCheckWidth, 0.2),
                'wall'
            )
        ];

        // Return true if there's ground at any check point
        return groundCheckPoints.some(hasGround => hasGround);
    }

    changeDirection() {
        this.isFacingRight = !this.isFacingRight;
        this.velocity.x = this.isFacingRight ? this.walkSpeed : -this.walkSpeed;
        const moveData = this.isFacingRight ? 
                    this.movement.right : 
                    this.movement.left;
        this.setAnimation(moveData.moveFrames[0], moveData.moveFrames[1], true, moveData.duration);
    }

    setMoveAnimation() {
        const moveData = this.isFacingRight ? 
            this.movement.right : 
            this.movement.left;
        this.setAnimation(moveData.moveFrames[0], moveData.moveFrames[1], true, moveData.duration);
    }

    die() {
        if (!this.deathAnimationStarted) {
            this.isAlive = false;
            this.isDying = true;
            if (this.deathSound) {
                this.deathSound.currentTime = 0;
                this.deathSound.play();
            }
            this.deathAnimationStarted = true;
            this.velocity = new Vec(0, 0);
            this.hitTimer = 0;

            this.changeSprite('death');
            
            // Get death animation frames based on direction
            if (this.isFacingRight) {
                // Normal death animation for right-facing
                this.frame = this.movement.death.right[0];  // Start from frame 0
                this.maxFrame = this.movement.death.right[1];  // End at frame 14
                this.frameDuration = 100;
            } else {
                // Reversed death animation for left-facing
                this.frame = this.movement.death.left[1];  // Start from frame 30
                this.maxFrame = this.movement.death.left[0];  // End at frame 15
                this.frameDuration = 100;
                // Create custom update function for reversed animation
                this.updateFrame = (deltaTime) => {
                    this.totalTime += deltaTime;
                    if (this.totalTime > this.frameDuration) {
                        this.frame--;  // Decrement frame number
                        this.spriteRect.x = this.frame % this.sheetCols;
                        this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
                        this.totalTime = 0;
                    }
                };
            }
        }
    }
}

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
        if (!this.isDying) {
            // Check if player exists and has just started jumping
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
        }
    
        this.updateFrame(deltaTime);
    }

    takeDamage() {
        if (!this.isDying) {
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
}