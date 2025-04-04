/*
 * Enemy Skeleton Class
 */

"use strict";

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
            this.updateMovement(level, deltaTime);
            this.updateFrame(deltaTime);

            if (this.state === "attacking") {
                if (this.isFacingRight) {
                    if (this.frame >= this.maxFrame) {
                        this.changeState("idle");
                    }
                } else {
                    if (this.frame <= this.maxFrame) {
                        this.changeState("idle");
                    }
                }
            }
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
                if (this.isFacingRight) {
                    // Standard forward animation for right-facing attack
                    this.frame = this.movement.attack.right[0];
                    this.maxFrame = this.movement.attack.right[1];
                    this.setAnimation(this.movement.attack.right[0], this.movement.attack.right[1], false, 80);
                } else {
                    // Reversed animation for left-facing attack
                    this.frame = this.movement.attack.left[1];
                    this.maxFrame = this.movement.attack.left[0];
                    this.frameDuration = 80;
                    
                    // update function for reversed animation
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
                this.attackTimer = this.attackDuration + this.attackCooldown;
                break;
            case "idle":
                this.changeSprite('move');
                this.velocity.x = 0;
                this.idleTimer = 0;
                // Reset the updateFrame function to the default behavior
                this.updateFrame = AnimatedObject.prototype.updateFrame;
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
            // Calculate attack progress based on direction
            let attackProgress;
            if (this.isFacingRight) {
                const totalFrames = this.movement.attack.right[1] - this.movement.attack.right[0];
                const currentFrame = this.frame - this.movement.attack.right[0];
                attackProgress = currentFrame / totalFrames;
            } else {
                const totalFrames = this.movement.attack.left[1] - this.movement.attack.left[0];
                const currentFrame = this.movement.attack.left[1] - this.frame;
                attackProgress = currentFrame / Math.abs(totalFrames);
            }
            
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
                this.frameDuration = 150;
                // Reset to default update function if it was modified
                this.updateFrame = AnimatedObject.prototype.updateFrame;
            } else {
                // Reversed death animation for left-facing
                this.frame = this.movement.death.left[1];  // Start from frame 30
                this.maxFrame = this.movement.death.left[0];  // End at frame 15
                this.frameDuration = 150;
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