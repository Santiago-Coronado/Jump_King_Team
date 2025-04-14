/*
 * Player Knight Class
 * Enrique Antonio Pires A01424547
 * Santiago Coronado A01785558
 * Juan de Dios Gastelum A01784523
 */

"use strict";

class Player extends AnimatedObject {
    constructor(_color, width, height, x, y, _type, physics) {
        super("green", width, height, x, y, "player");
        this.physics = physics;  // Store physics so that they can be used
        this.velocity = new Vec(0.0, 0.0);
        this.friction = 0.3; // Friction value to slow down the player when idle
        this.defaultFriction = 0.3; // Store default friction
        this.hitFriction = 0.9; // Higher friction value when hit (more sliding)
        this.frictionResetTimer = 0; // Timer to reset friction
        this.inVictorySequence = false; // Flag to indicate if the player is in the victory sequence
        this.disableControls = false; // Flag to disable controls when the game is finished

        
        this.speedMultiplier = 1.0; // Initial multiplier (no boost)
        this.speedBoostLevel = 0; // Initial speed boost level 
        this.speedBoostApplied = {
            level1: false, // 2000 points - 2.5% boost
            level2: false, // 3000 points - 5% boost
            level3: false, // 4500 points - 7.5% boost
        };

        this.jumpSound = new Audio("../Assets/Knight/EfectoDeSonido_SaltoCaballero.wav");
        this.jumpSound.volume = 0.5;

        this.damageSound = new Audio("../Assets/Knight/EfectoDeSonido_DanoCaballero.wav");
        this.damageSound.volume = 0.5;

        this.deathSound = new Audio("../Assets/Knight/EfectoDeSonido_MuerteCaballero.wav");
        this.deathSound.volume = 0.5;

        this.isFacingRight = true;
        this.isJumping = false;
        this.isCrouching = false;
        this.canDoubleJump = false;
        this.isDashing=false;
        this.dashTime=0;

        this.heightThreshold = 1; 
        this.inHigherLevel = false;

        this.hasAirDashed = false;

        this.powerUps = {
            charged: false,
            double: false,
            dash: false
        };

        // Track available mini-level templates for each powerup
        this.availableMiniLevels = {
            normal: ['a','b','c','d','e'],  // Start with normal templates
            dash: [],
            charged: [],
            double: []
        };

        this.powerUpCooldown = false;
        this.cooldownTime = 0;
        this.cooldownDuration = 3000;

        this.isDead = false;
        this.deathTimer = 0;
        this.deathDuration = 1500; 
        this.respawnPoint = new Vec(x, y);
        
        this.fatalFallVelocity = 0.045; 

        this.score = 0;

        // Movement variables to define directions and animations
        this.movement = {
            right:  { status: false,
                      axis: "x",
                      sign: 1,
                      repeat: true,
                      duration: 40,
                      moveFrames: [1, 2, 3],
                      idleFrames: [0] },
            left:   { status: false,
                      axis: "x",
                      sign: -1,
                      repeat: true,
                      duration: 40,
                      moveFrames: [14, 15, 16],
                      idleFrames: [17] },
            jump:   { status: false,
                      repeat: false,
                      duration: 80,
                      right: [5, 6],
                      left: [10, 11] },
            crouch: { status: false,
                      repeat: false,
                      duration: 300,
                      right: [4,4],
                      left: [4,4],
                      upRight: [0, 0],
                      upLeft: [17, 17] },
            death:  { status: false,
                      repeat: false,
                      duration: 1000,
                      right: [7,7],
                      left: [10,10],
                      upRight: [0,0],
                      upLeft: [17,17]}
        };
    }

    startMovement(direction) {
        if (this.disableControls) return;
        const dirData = this.movement[direction];
        this.isFacingRight = direction === "right";
    
        // Set current direction status to true
        dirData.status = true;
        
        // Update velocity and animation based on active directions
        this.updateMovementState();
    }

    stopMovement(direction) {
        if (this.disableControls) return;
        const dirData = this.movement[direction];
        dirData.status = false;
        
        // Update velocity and animation based on remaining active directions
        this.updateMovementState();
    }

    updateMovementState() {
        if (this.isCrouching || this.isJumping) return; // Don't change animations while jumping or crouching
        
        // If controls are disabled, use push velocity from enemy but don't apply movement flags
        if (this.disableControls) {
            // If we're in victory sequence, allow animation updates based on velocity
            if (this.inVictorySequence) {
                // Update animation based on current velocity
                if (this.velocity.x > 0) {
                    // Right animation
                    const rightData = this.movement.right;
                    const minFrame = Math.min(...rightData.moveFrames);
                    const maxFrame = Math.max(...rightData.moveFrames);
                    if (this.frame < minFrame || this.frame > maxFrame) {
                        this.setAnimation(minFrame, maxFrame, rightData.repeat, rightData.duration);
                    }
                } else if (this.velocity.x < 0) {
                    // Left animation
                    const leftData = this.movement.left;
                    const minFrame = Math.min(...leftData.moveFrames);
                    const maxFrame = Math.max(...leftData.moveFrames);
                    if (this.frame < minFrame || this.frame > maxFrame) {
                        this.setAnimation(minFrame, maxFrame, leftData.repeat, leftData.duration);
                    }
                } else {
                    // Idle animation when stopped
                    this.setIdleAnimation();
                }
            } else {
                // Let friction handle slowing down, don't set any new velocity
                return;
            }
        }
        const rightData = this.movement.right;
        const leftData = this.movement.left;
        
        // Both keys pressed - stand still with idle animation
        if (rightData.status && leftData.status) {
            this.velocity.x = 0;
            this.setIdleAnimation();
            return;
        }
        
        // Only right key pressed
        if (rightData.status) {
            this.velocity.x = rightData.sign * this.physics.walkSpeed * this.speedMultiplier;
            // Only set the animation if we're not already in this animation
            // or we're changing from idle to walking
            if (this.frame < rightData.moveFrames[0] || this.frame > rightData.moveFrames[rightData.moveFrames.length-1]) {
                const minFrame = Math.min(...rightData.moveFrames);
                const maxFrame = Math.max(...rightData.moveFrames);
                this.setAnimation(minFrame, maxFrame, rightData.repeat, rightData.duration);
            }
            return;
        }
        
        // Only left key pressed
        if (leftData.status) {
            this.velocity.x = leftData.sign * this.physics.walkSpeed * this.speedMultiplier;
            // Only set the animation if we're not already in this animation
            // or we're changing from idle to walking
            if (this.frame < leftData.moveFrames[0] || this.frame > leftData.moveFrames[leftData.moveFrames.length-1]) {
                const minFrame = Math.min(...leftData.moveFrames);
                const maxFrame = Math.max(...leftData.moveFrames);
                this.setAnimation(minFrame, maxFrame, leftData.repeat, leftData.duration);
            }
            return;
        }
        
        // No keys pressed - idle animation
        //this.velocity.x = 0;
        this.velocity.x = this.velocity.x * this.friction; // Apply friction when idle
        if (Math.abs(this.velocity.x) < 0.0001) { // If velocity is very small, stop completely
            this.velocity.x = 0;
        }
        this.setIdleAnimation();
    }

    checkSpeedBoosts() {
        // Check for level 1 boost (2000 points)
        if (!this.speedBoostApplied.level1 && this.score >= 2000) {
            this.speedMultiplier = 1.1; // 10% boost
            this.fatalFallVelocity = 0.0475; // Increase fall velocity threshold
            this.speedBoostApplied.level1 = true;
            this.speedBoostLevel = 1;
        }
        // Check for level 2 boost (3000 points)
        else if (!this.speedBoostApplied.level2 && this.score >= 3000) {
            this.speedMultiplier = 1.2; // 20% boost
            this.fatalFallVelocity = 0.05; // Increase fall velocity threshold
            this.speedBoostApplied.level2 = true;
            this.speedBoostLevel = 2;
        }
        // Check for level 3 boost (4500 points)
        else if (!this.speedBoostApplied.level3 && this.score >= 4500) {
            this.speedMultiplier = 1.3; // 30% boost
            this.fatalFallVelocity = 0.055; // Increase fall velocity threshold
            this.speedBoostApplied.level3 = true;
            this.speedBoostLevel = 3;
        }
    }

    setIdleAnimation() {
        if (this.isJumping || this.isCrouching) return; // don't interrupt animation when jumping or crouching
        
        const idleFrame = this.isFacingRight ? 
                          this.movement.right.idleFrames[0] : 
                          this.movement.left.idleFrames[0];
        
        this.frame = idleFrame;
        this.setAnimation(idleFrame, idleFrame, false, 100);
        
        // Force update of sprite
        this.spriteRect.x = idleFrame % this.sheetCols;
        this.spriteRect.y = Math.floor(idleFrame / this.sheetCols);
    }

    update(level, deltaTime) {
        if (gameStats && game && game.player) {
            // Inicializar los powerups desde gameStats
            setTimeout(() => {
                game.player.powerUps.double = gameStats.doubleJumpObtained;
                game.player.powerUps.charged = gameStats.chargedJumpObtained;
                game.player.powerUps.dash = gameStats.dashObtained;
                console.log("Power-ups inicializados desde gameStats:", game.player.powerUps);
            }, 500); // Pequeño retraso para asegurar que todo está cargado
        }

        if (this.isDead) {
            this.updateFrame(deltaTime);
            return; 
        }

        this.checkSpeedBoosts();

        if (this.inHigherLevel && this.position.y > this.heightThreshold + 1) {
            this.inHigherLevel = false;
        }

        if (this.powerUpCooldown) {
            this.cooldownTime -= deltaTime;
            if (this.cooldownTime <= 0) {
                this.powerUpCooldown = false;
                this.cooldownTime = 0;
            }
        }

        // Make the character fall constantly because of gravity
        if (!this.isDashing){
        this.velocity.y = this.velocity.y + this.physics.gravity * deltaTime;
        }

        // Check movement state and update it if needed
        if (!this.isDashing) {
            this.updateMovementState();
        }

        if (this.position.y > level.height + 5) {
            this.death();
            return;
        }

        let velX = this.velocity.x;
        let velY = this.velocity.y;

        // Update friction reset timer
        if (this.frictionResetTimer > 0) {
            this.frictionResetTimer -= deltaTime;
            if (this.frictionResetTimer <= 0) {
                this.friction = this.defaultFriction;
            }
        }

        // Find out where the player should end if it moves
        let newXPosition = this.position.plus(new Vec(velX * deltaTime, 0));
        // Move only if the player does not move inside a wall
        if (!level.contact(newXPosition, this.size, 'wall')) {
            this.position = newXPosition;
        }

        if (this.position.y >= level.height - 3.5 && game.currentLevelIndex > 0) {
            this.fallToLowerLevel(game);
            return; 
        }


        // Find out where the player should end if it moves
        let newYPosition = this.position.plus(new Vec(0, velY * deltaTime));
        // Move only if the player does not move inside a wall
        if (!level.contact(newYPosition, this.size, 'wall')) {
            this.position = newYPosition;
        } else {
            // Check if we're actually landing on top of a platform
        if (this.isLandingOnPlatform(level, newYPosition)) {
            this.land();
        } else {
            // Just stop vertical movement if hitting from below
            this.velocity.y = 0;
        }
        }
        

        this.updateFrame(deltaTime);
    }

    // Method that calculates velocity based on active movement directions (this is made so that the character doesn't get stuck when pressing
    // many keys in quick succession)
    updateMovementVelocity() {

        if (this.isJumping) return; 
        if (this.isCrouching) return;

        const rightData = this.movement.right;
        const leftData = this.movement.left;
        
        // Check if both directions are active
        if (rightData.status && leftData.status) {
            // Both keys are pressed, set velocity to 0
            this.velocity.x = 0;
            
            // Set idle animation
            this.setIdleAnimation();
            return;
        }
        
        // Handle single key directions
        this.velocity.x = 0;
        
        if (rightData.status) {
            this.velocity.x = rightData.sign * this.physics.walkSpeed * this.speedMultiplier;
        }
        
        if (leftData.status) {
            this.velocity.x = leftData.sign * this.physics.walkSpeed * this.speedMultiplier;
        }
    }

    jump() {
        if (!this.isJumping) {
            // Give a velocity so that the player starts moving up
            this.velocity.y = this.physics.initialJumpSpeed;

            if (this.jumpSound) {
                this.jumpSound.currentTime = 0;
                this.jumpSound.play();
            }

            this.isJumping = true;

            if (this.powerUps.double){
                this.canDoubleJump = true;
            }
            const jumpData = this.movement.jump;

            // Get frames for the scurrent direction
            const jumpFrames = this.isFacingRight ? jumpData.right : jumpData.left;
            const minFrame = Math.min(...jumpFrames);
            const maxFrame = Math.max(...jumpFrames);
            this.setAnimation(minFrame, maxFrame, jumpData.repeat, jumpData.duration);
        }
        else if (this.canDoubleJump){
            this.doubleJump()
        }
    }

    isLandingOnPlatform(level, newPosition) {
        // Check if there's a wall/platform below and we're moving downward
        return level.contact(newPosition, this.size, 'wall') && this.velocity.y > 0;
    }

    land() {
        const previousYVelocity = this.velocity.y;
        if (previousYVelocity > this.fatalFallVelocity) {
            this.death();
            return;
        }
        // If the character is touching the ground,
        // there is no vertical velocity
        this.velocity.y = 0;
        // Force the player to move down to touch the floor
        this.position.y = Math.ceil(this.position.y);

        this.hasAirDashed = false;
        if (this.isJumping) {
            // Reset the jump variable
            this.isJumping = false;
            this.canDoubleJump=false;
            const leftData = this.movement["left"];
            const rightData = this.movement["right"];
            // Continue the running animation if the player is moving
            if (leftData.status) {
                const minFrame = Math.min(...leftData.moveFrames);
                const maxFrame = Math.max(...leftData.moveFrames);
                this.setAnimation(minFrame, maxFrame, leftData.repeat, leftData.duration);
            } else if (rightData.status) {
                const minFrame = Math.min(...rightData.moveFrames);
            const maxFrame = Math.max(...rightData.moveFrames);
            this.setAnimation(minFrame, maxFrame, rightData.repeat, rightData.duration);
            // Otherwise switch to the idle animation
            } else {
                if (this.isFacingRight) {
                    const idleFrame = rightData.idleFrames[0];
                    this.setAnimation(idleFrame, idleFrame, false, 100);
                } else {
                    const idleFrame = leftData.idleFrames[0]; // Use first idle frame
                    this.setAnimation(idleFrame, idleFrame, false, 100);
                }
            }
        }
    }

    dash() {
        if (this.powerUpCooldown) return;
        if (this.powerUps.dash && !this.isDashing) { 
            if (this.isJumping && this.hasAirDashed) {
                return; 
            }
            // Get the velocity of the dash
            const dashSpeed = this.physics.walkSpeed * 3; 
            this.isDashing=true;
            const dashTime = 250; // Duration of the dash in milliseconds

            if (this.isJumping) {
                this.hasAirDashed = true;
            }
            
            this.velocity.y= 0;
            
            if (this.isFacingRight) {
                this.velocity.x = dashSpeed;
            } else {
                this.velocity.x = -dashSpeed;
            }

            const originalColor = this.color;
            this.color = "cyan"; 
            // Make it so that when the dash ends, the player is not moving in the dashspeed anymore
            setTimeout(() => {
                this.isDashing = false;
                this.updateMovementState();
                this.color = originalColor;
            }, dashTime);
            this.startPowerUpCooldown();
        }
    }

    doubleJump() {
        if (this.powerUpCooldown) return;
        this.canDoubleJump = false;
        
        this.velocity.y = this.physics.initialJumpSpeed * 0.8; 

        if (this.jumpSound) {
            this.jumpSound.currentTime = 0;
            this.jumpSound.play();
        }
        
        const originalColor = this.color;
        this.color = "lime";
        

        const effectDuration = 150;

        setTimeout(() => {
            this.color = originalColor;
        }, effectDuration);
        this.startPowerUpCooldown();
    }

    startPowerUpCooldown() {
        this.powerUpCooldown = true;
        this.cooldownTime = this.cooldownDuration;
    }

    crouch(){
        if (this.powerUps.charged){
            if (this.powerUpCooldown) return;
            if (!this.isJumping) {
                this.isCrouching = true;
                
                const crouchData = this.movement.crouch;

                const crouchFrames = this.isFacingRight ? crouchData.right : crouchData.left;
                const minFrame = Math.min(...crouchFrames);
                const maxFrame = Math.max(...crouchFrames);
        
                // Set animation with those frames
                this.setAnimation(minFrame, maxFrame, crouchData.repeat, crouchData.duration);

                this.frame = minFrame;
                this.spriteRect.x = this.frame % this.sheetCols;
                this.spriteRect.y = Math.floor(this.frame / this.sheetCols);

                this.velocity.x = 0;
            }
        }
    }

    standUp(){
        if (this.isCrouching) {
            if (this.powerUpCooldown) return;

            this.isCrouching = false;

        
            const rightData = this.movement.right;
            const leftData = this.movement.left;
            
            // Reset horizontal velocity first
            this.velocity.x = 0;
            
            if (rightData.status && !leftData.status) {
                this.velocity.x = rightData.sign * this.physics.walkSpeed * 0.4;
            } else if (leftData.status && !rightData.status) {
                this.velocity.x = leftData.sign * this.physics.walkSpeed * 0.4;
            }

            this.isJumping = true;
            this.velocity.y = this.physics.initialJumpSpeed * 1.5; 

            
            const jumpData = this.movement.jump;
             // Get frames for the scurrent direction
            const jumpFrames = this.isFacingRight ? jumpData.right : jumpData.left;
            const minFrame = Math.min(...jumpFrames);
            const maxFrame = Math.max(...jumpFrames);
        
            // Set animation with those frames
            this.setAnimation(minFrame, maxFrame, jumpData.repeat, jumpData.duration);
            this.startPowerUpCooldown();
        }
    }
    
    checkLevelChange(game){
        //console.log(game.currentLevelIndex);
        //console.log(this.position.y);
        //console.log("Available levels",game.availableLevels.length);
        //console.log(this.inHigherLevel);

        if(this.position.y <this.heightThreshold && !this.inHigherLevel){
            this.inHigherLevel=true;
            if (game.currentLevelIndex < game.availableLevels.length - 1){
                // Store the behaviour that the player has before changing levels
                const currentXPosition = this.position.x;
                const facingRight = this.isFacingRight;
                const velocity = new Vec(this.velocity.x, this.velocity.y);
                const isJumping = this.isJumping;
                const isCrouching = this.isCrouching;

                const powerUps = { ...this.powerUps };

                const scoreKeep = this.score


                const movementState = {
                    right: this.movement.right.status,
                    left: this.movement.left.status
                }

                game.changeLevel(game.currentLevelIndex + 1);

                const bottomPosition = game.level.height - 5;

                // Get player information and set it to the new level
                game.player.position = new Vec(currentXPosition,bottomPosition);
                game.player.isFacingRight = facingRight;
                game.player.velocity = velocity;
                game.player.inHigherLevel = false;

                game.player.isJumping = isJumping;
                game.player.isCrouching = isCrouching;

                game.player.powerUps = powerUps;

                game.player.inHigherLevel = true;
                game.player.respawnPoint = new Vec(currentXPosition, bottomPosition);
                game.player.initialPosition = new Vec(currentXPosition, bottomPosition);
                game.player.score = scoreKeep;



                if (movementState.right) {
                    game.player.movement.right.status = true;
                }
                if (movementState.left) {
                    game.player.movement.left.status = true;
                }
                
                game.player.updateMovementState();   
            } else {
                this.inHigherLevel = false;
            }
        }
    }

    
    fallToLowerLevel(game){
        if(game.currentLevelIndex > 0){
            // Store the behaviour that the player has before changing levels
            const currentXPosition = this.position.x;
            const facingRight = this.isFacingRight;
            const velocity = new Vec(this.velocity.x, this.velocity.y); 
            const isJumping = this.isJumping;
            const isCrouching = this.isCrouching;

            const powerUps = { ...this.powerUps };

            const scoreKeep = this.score


            const movementState = {
                right: this.movement.right.status,
                left: this.movement.left.status
            };

            game.changeLevel(game.currentLevelIndex - 1);

            const topPosition = 3;
            // Get player information and set it to the new level
            game.player.position = new Vec(currentXPosition, topPosition);
            game.player.isFacingRight = facingRight;
            game.player.velocity = velocity;
            game.player.isJumping = isJumping;
            game.player.isCrouching = isCrouching;
            game.player.powerUps = powerUps;
            game.player.score = scoreKeep;


            game.player.inHigherLevel = false;

            game.player.respawnPoint = new Vec(currentXPosition, topPosition);
            game.player.initialPosition = new Vec(currentXPosition, topPosition);
            game.player.respawnLevelIndex = game.currentLevelIndex;


            if (movementState.right) {
                game.player.movement.right.status = true;
            }
            if (movementState.left) {
                game.player.movement.left.status = true;
            }
            
            game.player.updateMovementState();
        }
    }

    death(){
        if(this.isDead) return;
        if (this.deathSound) {
            this.deathSound.currentTime = 0;
            this.deathSound.play();
        }

        if (gameStats) {
            const currentTime = Date.now();
            const sessionTime = currentTime - gameStartTime;
            gameStats.addTimePlayed(sessionTime);
            gameStartTime = currentTime;
        }

        if (!this.initialPosition) {
            this.initialPosition = new Vec(this.position.x, this.position.y);
        }
        if (gameStats) gameStats.recordDeath(); // Record the death in the stats

        this.respawnLevelIndex = 0; // Reset respawn level index
        this.score = 0; // Reset score on death
        this.speedMultiplier = 1; // Reset speed multiplier
        this.fatalFallVelocity = 0.045; // Reset fall velocity threshold

        const startingPos = findPlayerStartPosition(game.level);
        
        if (startingPos) {
            this.respawnPoint = new Vec(startingPos.x, startingPos.y - 3); 
        } else {
            this.respawnPoint = new Vec(3, 3); // Safe default near top-left
        }

        this.isDead = true;
        this.velocity = new Vec(0, 0);
        this.stopMovement("right");
        this.stopMovement("left");

        if (this.deathSound) {
            this.deathSound.currentTime = 0;
            this.deathSound.play();
        }

        const deathData = this.movement.death;

        const deathFrames = this.isFacingRight ? deathData.right : deathData.left;

        if (deathFrames && deathFrames.length > 0) {
            const minFrame = deathFrames[0];
            const maxFrame = deathFrames.length > 1 ? deathFrames[1] : deathFrames[0];
            
            this.setAnimation(minFrame, maxFrame, false, deathData.duration);
            this.frame = minFrame; // Force the frame to be set immediately
            this.spriteRect.x = this.frame % this.sheetCols;
            this.spriteRect.y = Math.floor(this.frame / this.sheetCols);        
        }      
        this.deathTimer = this.deathDuration;


    }

    respawn(level) {
        if (level.contact(this.respawnPoint, this.size, 'wall')) {
            for (let y = this.respawnPoint.y; y > 0; y--) {
                const testPos = new Vec(this.respawnPoint.x, y);
                if (!level.contact(testPos, this.size, 'wall')) {
                    this.respawnPoint = testPos;
                    break;
                }
            }
        }
        
        this.position = new Vec(this.respawnPoint.x, this.respawnPoint.y);
        this.velocity = new Vec(0, 0);
        this.isDead = false;
        
        // Reset movement states
        this.isJumping = false;
        this.isCrouching = false;
        this.hasAirDashed = false;

        this.movement.right.status = false;
        this.movement.left.status = false;
        this.movement.jump.status = false;
        this.movement.crouch.status = false;

        // Reset animation
        this.isFacingRight = true;
        this.setIdleAnimation();
    }
}