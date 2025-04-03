/*
 * Knight's Fall
 * Enrique Antonio Pires A01424547
 * Santiago Coronado A01785558
 * Juan de Dios Gastelum A01784523
 */

"use strict";

// Global variables
const canvasWidth = 800;
const canvasHeight = 450;

// Context for the display canvas
let ctx;

// The time at the previous frame
let frameStart;

let game;
let player;
let level;

// Scale of the whole world, to be applied to all objects
// Each unit in the level file will be drawn as these many square pixels
const scale = 14.3;

let debugJump = false;

class BasePhysics {
    constructor() {
        // The project works only with very small values for velocities and acceleration
        this.walkSpeed = 0.010;
        this.initialJumpSpeed = -0.03;
        this.gravity = 0.0000981;
    }
}

class Player extends AnimatedObject {
    constructor(_color, width, height, x, y, _type, physics) {
        super("green", width, height, x, y, "player");
        this.physics = physics;  // Store physics so that they can be used
        this.velocity = new Vec(0.0, 0.0);
        this.friction = 0.3; // Friction value to slow down the player when idle
        this.defaultFriction = 0.3; // Store default friction
        this.hitFriction = 0.9; // Higher friction value when hit (more sliding)
        this.frictionResetTimer = 0; // Timer to reset friction
        this.disableControls = false; // Flag to disable controls when the game is finished

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
        
        this.fatalFallVelocity = 0.04; 

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
            this.velocity.x = rightData.sign * this.physics.walkSpeed;
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
            this.velocity.x = leftData.sign * this.physics.walkSpeed;
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

        if (this.isDead) {
            this.updateFrame(deltaTime);
            return; 
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

        if (this.inHigherLevel && this.position.y >= level.height - 3.5) {
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
            this.velocity.x = rightData.sign * this.physics.walkSpeed;
        }
        
        if (leftData.status) {
            this.velocity.x = leftData.sign * this.physics.walkSpeed;
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
            const dashSpeed = this.physics.walkSpeed * 3; 
            this.isDashing=true;
            const dashTime = 250;

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
                // Optional: Handle reaching the final level
                console.log("Reached final level!");
                this.inHigherLevel = false;
            }
        }
    }

    
    fallToLowerLevel(game){
        if(game.currentLevelIndex > 0){

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

        if (!this.initialPosition) {
            this.initialPosition = new Vec(this.position.x, this.position.y);
        }

        this.respawnLevelIndex = 0;
    
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
        this.deathTimer = this.deathDuration;;
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

function findPlayerStartPosition(level) {
    for (let y = 0; y < level.rows.length; y++) {
        for (let x = 0; x < level.rows[y].length; x++) {
            // Check if this position has the player character in the level data
            if (level.rows[y][x] === "empty" && 
                GAME_LEVELS[game.currentLevelIndex].trim().split('\n')[y][x] === "@") {
                return { x: x, y: y };
            }
        }
    }
    return null;
}


class Dash extends AnimatedObject {
    constructor(_color, width, height, x, y, _type) {
        super("yellow", width, height, x, y, "powerup1");
    }

    update(_level, deltaTime) {
        this.updateFrame(deltaTime);
    }
}

class Charged extends AnimatedObject {
    constructor(_color, width, height, x, y, _type) {
        super("yellow", width, height, x, y, "powerup2");
    }

    update(_level, deltaTime) {
        this.updateFrame(deltaTime);
    }
}
class Double extends AnimatedObject {
    constructor(_color, width, height, x, y, _type) {
        super("yellow", width, height, x, y, "powerup3");
    }

    update(_level, deltaTime) {
        this.updateFrame(deltaTime);
    }
}


class BaseLevel {
    constructor(plan, physics, collectedPowerUps = { dash: [], charged: [], double: [] }) {
        // Split the plan string into a matrix of strings
        let rows = plan.trim().split('\n').map(l => [...l]);
        this.height = rows.length;
        this.width = rows[0].length;
        this.actors = [];
        this.enemies = [];	// An array to store the enemies

        // Fill the rows array with a label for the type of element in the cell
        // Most cells are 'empty', except for the 'wall'
        this.rows = rows.map((row, y) => {
            return row.map((ch, x) => {
                let item = levelChars[ch];
                let objClass = item.objClass;
                let cellType = item.label;

                if ((ch === '$' && isPowerUpCollected(collectedPowerUps.dash, x, y)) ||
                (ch === '%' && isPowerUpCollected(collectedPowerUps.charged, x, y)) ||
                (ch === '&' && isPowerUpCollected(collectedPowerUps.double, x, y))) {
                // Solo agregar un suelo de fondo donde estaría el power-up
                this.addBackgroundFloor(x, y);
                return "empty";
            }
                // Create a new instance of the type specified
                let actor = new objClass("skyblue", 1, 1, x, y, item.label, physics);  // Pass physics to the constructor
                // Configurations for each type of cell
                // TODO: Simplify this code, sinde most of it is repeated
                if (actor.type == "player") {
                    // Also instantiate a floor tile below the player
                    this.addBackgroundFloor(x, y);

                    // Make the player larger
                    actor.position = actor.position.plus(new Vec(0, -3));
                    actor.size = new Vec(3, 3);

                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, false, 100);
                    this.player = actor;
                    cellType = "empty";
                } else if (actor.type == "princess") {
                    this.addBackgroundFloor(x, y);
                    console.log("Princess created at position:", actor.position);
                    actor.position = actor.position.plus(new Vec(0, 0));
                    actor.size = new Vec(3, 3);
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, false, 100);
                    this.princess = actor;
                    cellType = "empty";
                } else if (actor.type == "powerup1") {
                    // Also instantiate a floor tile below the player
                    this.addBackgroundFloor(x, y);

                    actor.position = actor.position.plus(new Vec(-1, -1));
                    actor.size = new Vec(2, 2); 
                    
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, true, 100);
                    this.actors.push(actor);
                    cellType = "empty";
                    
                } else if (actor.type == "powerup2") {
                    // Also instantiate a floor tile below the player
                    this.addBackgroundFloor(x, y);

                    actor.position = actor.position.plus(new Vec(-1, -1));
                    actor.size = new Vec(2, 2); 
                    
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, true, 100);
                    this.actors.push(actor);
                    cellType = "empty";
                    
                } else if (actor.type == "powerup3") {
                    // Also instantiate a floor tile below the player
                    this.addBackgroundFloor(x, y);

                    actor.position = actor.position.plus(new Vec(-1, -1));
                    actor.size = new Vec(2, 2); 
                    
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, true, 100);
                    this.actors.push(actor);
                    cellType = "empty";
                    
                }else if (actor.type == "wall") {
                    // Randomize sprites for each wall tile
                    actor.setSprite(item.sprite, item.rect);
                    this.actors.push(actor);
                    cellType = "wall";
                } else if (actor.type == "floor") {
                    cellType = "floor";
                } else if (actor.type == "skeleton") {
                    this.addBackgroundFloor(x, y);
                    actor.size = new Vec(2, 2.5);
                    actor.position = actor.position.plus(new Vec(0, -1));
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.velocity = new Vec(actor.walkSpeed, 0);
                    actor.setMoveAnimation();
                    this.enemies.push(actor);
                    cellType = "empty";
                } else if (actor.type == "demon") {
                    this.addBackgroundFloor(x, y);
                    actor.size = new Vec(3.25, 3.25);
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.flySpeed = 0.008;
                    actor.velocity = new Vec(actor.flySpeed, 0);
                    actor.startY = y;
                    actor.setMoveAnimation();
                    this.enemies.push(actor);
                    cellType = "empty";
                } else if (actor.type == "jumper") {
                    this.addBackgroundFloor(x, y);
                    actor.size = new Vec(4.5, 3);
                    actor.position = actor.position.plus(new Vec(0, -2));
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.velocity = new Vec(0, 0);
                    actor.setIdleAnimation();
                    this.enemies.push(actor);
                    cellType = "empty";
                }
                return cellType;
            });
        });
    }

    addBackgroundFloor(x, y) {
        let floor = levelChars['.'];
        let floorActor = new GameObject("skyblue", 1, 1, x, y, floor.label);
        floorActor.setSprite(floor.sprite, floor.rect);
        this.actors.push(floorActor);
    }

    // Detect when the player touches a wall
    contact(playerPos, playerSize, type) {
        // Determine which cells the player is occupying
        let xStart = Math.floor(playerPos.x);
        let xEnd = Math.ceil(playerPos.x + playerSize.x);
        let yStart = Math.floor(playerPos.y);
        let yEnd = Math.ceil(playerPos.y + playerSize.y);

        // Check each of those cells
        for (let y=yStart; y<yEnd; y++) {
            for (let x=xStart; x<xEnd; x++) {
                // Anything outside of the bounds of the canvas is considered
                // to be a wall, so it blocks the player's movement
                let isOutside = x < 0 || x >= this.width ||
                                y < 0 || y >= this.height;
                let here = isOutside ? 'wall' : this.rows[y][x];
                // Detect if an object of type specified is being touched
                if (here == type) {
                    return true;
                }
            }
        }
        return false;
    }
}

function isPowerUpCollected(collectedPowerUpsArray, x, y) {
    if (!collectedPowerUpsArray || !Array.isArray(collectedPowerUpsArray)) {
        return false;
    }
    
    for (let powerUp of collectedPowerUpsArray) {
        // Comparación aproximada de posición para tener en cuenta los desplazamientos
        const baseX = Math.floor(x);
        const baseY = Math.floor(y);
        const collectedX = Math.floor(powerUp.x);
        const collectedY = Math.floor(powerUp.y);
        
        // Verificar si están aproximadamente en la misma posición
        if (Math.abs(collectedX - baseX) <= 3 && Math.abs(collectedY - baseY) <= 3) {
            return true;
        }
    }
    return false;
}

class Game {
    constructor(state, levelIndex) {
        this.state = state;
        this.currentLevelIndex = levelIndex;
        this.physics = new BasePhysics();  // Create an instance of BasePhysics
        
        this.availableLevels = GAME_LEVELS;

        this.collectedPowerUps = {
            dash: [],
            charged: [],
            double: []
        };

        this.level = new BaseLevel (this.availableLevels[levelIndex], this.physics, this.collectedPowerUps)

        this.player = this.level.player;
        this.princess = this.level.princess;
        this.actors = this.level.actors;
        this.enemies = this.level.enemies;

        this.background = new Background('../assets/Castle1.png', canvasWidth, canvasHeight);
        this.powerUpBar = new PowerUpBar();
        this.gameOver = new Image();
        this.gameOver.src = '../assets/Game_Over.png'

        this.gameOverActive = false;
        this.gameOverAlpha = 0; 
        this.fadeInSpeed = 0.005;

        this.textScore = new TextLabel(70, canvasHeight - 40, "30px 'Press Start 2P', sans-serif", "white");

        this.playerPowerUps = {
            charged: false,
            double: false,
            dash: false
        };
        this.statePlayer= 'playing';
    }

    update(deltaTime) {
        if (this.state === 'playing') {
        if (this.player.isDead) {
            this.player.deathTimer -= deltaTime;
            this.player.updateFrame(deltaTime);
   
            if (this.player.deathTimer <= 0 && !this.gameOverActive) {
                this.gameOverActive = true;
                this.gameOverAlpha = 0;
            }
            if (this.gameOverActive && this.gameOverAlpha<0.7) {
                this.gameOverAlpha += this.fadeInSpeed * deltaTime;
                if(this.gameOverAlpha > 0.7) {
                    this.gameOverAlpha = 0.7;
                }
            }
            return; 
        }

        this.playerPowerUps = { ...this.player.powerUps };

        this.player.update(this.level, deltaTime);

        this.player.checkLevelChange(this);

        for (let actor of this.actors) {
            actor.update(this.level, deltaTime);
        }

        for (let enemy of this.enemies) {
            enemy.update(this.level, deltaTime);
        }

        if (this.princess) {
            this.princess.update(deltaTime, this.player, this);
        }

        this.powerUpBar.updateFrame(
            this.player.powerUps.charged,
            this.player.powerUps.double,
            this.player.powerUps.dash
        );

        this.playerPowerUps = { ...this.player.powerUps };

        // A copy of the full list to iterate over all of them
        // DOES THIS WORK?
        let currentActors = this.actors;
        // Detect collisions
        for (let actor of currentActors) {
            if (actor.type != 'floor' && overlapRectangles(this.player, actor)) {
                if (actor.type == 'powerup1') {
                    this.player.powerUps.dash = true;
                    this.player.availableMiniLevels.dash = Object.keys(MINI_LEVELS.dash);

                    this.collectedPowerUps.dash.push({
                        levelIndex: this.currentLevelIndex,
                        x: actor.position.x,
                        y: actor.position.y
                    });
                    this.player.score += 1000; // Increase score by 1000 when collecting a charged power-up
                    this.actors = this.actors.filter(item => item !== actor);
                } else if (actor.type == 'powerup2') {
                    this.player.powerUps.charged = true;
                    this.player.availableMiniLevels.charged = Object.keys(MINI_LEVELS.charged);
                    this.actors = this.actors.filter(item => item !== actor);
                } else if (actor.type == 'powerup3') {
                    this.player.powerUps.double = true;
                    this.player.availableMiniLevels.double = Object.keys(MINI_LEVELS.double);

                    this.collectedPowerUps.charged.push({
                        levelIndex: this.currentLevelIndex, 
                        x: actor.position.x,
                        y: actor.position.y
                    });
                    this.player.score += 1000; // Increase score by 1000 when collecting a charged power-up
                    this.actors = this.actors.filter(item => item !== actor);
                } else if (actor.type == 'powerup3') {
                    this.player.powerUps.double = true;
                    this.collectedPowerUps.double.push({
                        levelIndex: this.currentLevelIndex, 
                        x: actor.position.x,
                        y: actor.position.y
                    });
                    this.player.score += 1000; // Increase score by 1000 when collecting a charged power-up
                    this.actors = this.actors.filter(item => item !== actor);
                }
            }
        }

        // Check collisions with enemies
        for (let enemy of this.enemies) {
            if (overlapRectangles(this.player, enemy)) {
                if (enemy.isDying || enemy.deathAnimationStarted) continue;

                const playerBottom = this.player.position.y + this.player.size.y;
                const enemyTop = enemy.position.y;
                
                if (this.player.velocity.y > 0 && playerBottom < enemyTop + 0.3) {
                    // Player is stomping the enemy
                    if (enemy.takeDamage) {
                        enemy.takeDamage();
                        this.player.velocity.y = -0.03;
                    }
                } else if (enemy.hitTimer <= 0) {
                    // Player is hit by enemy
                    if (enemy.hitPlayer) {
                        enemy.hitPlayer(this.player);
                    }
                }
            }
        }
        // Remove enemies that have finished their death animation
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.isDying && enemy.animationComplete) {
                return false;
            }
            return true;
        });
    }
    else if (this.state === 'paused') {
        if (this.pauseAlpha < 0.7) {
            this.pauseAlpha += this.pauseFadeSpeed * deltaTime;
            if (this.pauseAlpha > 0.7) {
                this.pauseAlpha = 0.7;
            }
        }
    }
    }

    fillUndefinedAreas(levelPlan) {
        let rows = levelPlan.split('\n');
        
        // Iterate through each row and check for sequences of 'x' or 'y'
        for(let y = 0; y < rows.length; y++) {
            // First check for 'x' sequences (standard templates)
            let xSequence = rows[y].match(/x+/);
            if(xSequence) {
                this.applyTemplateToLevel(rows, y, rows[y].indexOf('x'), false);
            }
            
            // Then check for 'i' sequences (inverted templates)
            let iSequence = rows[y].match(/i+/);
            if(iSequence) {
                this.applyTemplateToLevel(rows, y, rows[y].indexOf('i'), true);
            }
        }
        return rows.join('\n');
    }

    applyTemplateToLevel(rows, startY, startX, invertHorizontally) {
        let miniLevel;
        let availableTemplates = [];
        let availablePowerupTypes = [];
        let powerUpType;

        if (this.player.powerUps.double && this.player.availableMiniLevels.double.length > 0) {
            availablePowerupTypes.push("double");
        }
        if (this.player.powerUps.charged && this.player.availableMiniLevels.charged.length > 0) {
            availablePowerupTypes.push("charged");
        }
        if (this.player.powerUps.dash && this.player.availableMiniLevels.dash.length > 0) {
            availablePowerupTypes.push("dash");
        }

        // If no powerups available, use normal templates
        if (availablePowerupTypes.length === 0) {
            powerUpType = "normal";
            availableTemplates = this.player.availableMiniLevels.normal;
        } else {
            // Randomly choose one of the available powerup types
        powerUpType = availablePowerupTypes[Math.floor(Math.random() * availablePowerupTypes.length)];
        
        // Set templates based on the selected type
        if (powerUpType === "double") availableTemplates = this.player.availableMiniLevels.double;
        else if (powerUpType === "charged") availableTemplates = this.player.availableMiniLevels.charged;
        else if (powerUpType === "dash") availableTemplates = this.player.availableMiniLevels.dash;
        }

        // Ensure we have templates
        if (!availableTemplates || availableTemplates.length === 0) {
            console.warn(`No available templates for ${powerUpType}, falling back to normal templates`);
            availableTemplates = ['a', 'b', 'c', 'd', 'e'];
            powerUpType = "normal";
        }

        // Make sure the templates actually exist in MINI_LEVELS
        availableTemplates = availableTemplates.filter(key => {
            if (powerUpType === "double") return MINI_LEVELS.double[key];
            if (powerUpType === "charged") return MINI_LEVELS.charged[key];
            if (powerUpType === "dash") return MINI_LEVELS.dash[key];
            return MINI_LEVELS.normal[key];
        });

        if (availableTemplates.length === 0) {
            console.warn(`No valid templates found for ${powerUpType}, using normal templates`);
            availableTemplates = ['a', 'b', 'c', 'd', 'e'];
            powerUpType = "normal";
        }
    
        // Randomly select one of the available templates
        const randomIndex = Math.floor(Math.random() * availableTemplates.length);
        const templateKey = availableTemplates[randomIndex];
        
        // Get the mini-level based on the powerup type and template key
        if (powerUpType === "double" && this.player.powerUps.double) {
            miniLevel = MINI_LEVELS.double[templateKey];
        } 
        else if (powerUpType === "charged" && this.player.powerUps.charged) {
            miniLevel = MINI_LEVELS.charged[templateKey];
        }
        else if (powerUpType === "dash" && this.player.powerUps.dash) {
            miniLevel = MINI_LEVELS.dash[templateKey];
        }
        else {
            // Default to normal mini-level
            miniLevel = MINI_LEVELS.normal[templateKey];
        }

        // Split the mini-level into rows
        let miniLevelRows = miniLevel.split('\n');
        
        // If we need to invert the template horizontally
        if (invertHorizontally) {
            miniLevelRows = miniLevelRows.map(row => {
                // Trim and reverse each row for horizontal inversion
                const trimmedRow = row.trim();
                return [...trimmedRow].reverse().join('');
            });
        }

        for(let i = 0; i < miniLevelRows.length && startY + i < rows.length; i++) {
            const replacementText = miniLevelRows[i].trim();
            const originalRow = rows[startY + i];
            
            // Ensure we don't exceed the row length
            if (startX + replacementText.length <= originalRow.length) {
                rows[startY + i] = originalRow.substring(0, startX) + 
                            replacementText + 
                            originalRow.substring(startX + replacementText.length);
            } else {
                console.warn(`Row ${startY+i} too short for replacement, truncating`);
                // Still do our best to replace what we can
                rows[startY + i] = originalRow.substring(0, startX) + 
                            replacementText.substring(0, originalRow.length - startX);
            }
        }
    }

   

    changeLevel(levelIndex) {
        if (levelIndex < 0 || levelIndex >= this.availableLevels.length) {
            console.warn(`Attempted to change to invalid level index: ${levelIndex}`);
            return;
        }

        // Validate that the level exists
        const nextLevel = this.availableLevels[levelIndex];
        if (!nextLevel) {
            console.error(`Level ${levelIndex} is undefined`);
            return;
        }
        
        // Guardar estado del jugador actual
        const oldPlayer = this.player;
        const powerUps = { ...oldPlayer.powerUps };
        const oldRespawnPoint = oldPlayer.respawnPoint;
        const oldInitialPosition = oldPlayer.initialPosition || new Vec(oldPlayer.position.x, oldPlayer.position.y);
        const isPowerUpColdown = oldPlayer.powerUpCooldown;

        const remainingCoolDownTime= oldPlayer.cooldownTime;

        // Guarda la disponibilidad de mini-niveles
        const availableMiniLevels = {
            normal: [...oldPlayer.availableMiniLevels.normal],
            dash: [...oldPlayer.availableMiniLevels.dash],
            charged: [...oldPlayer.availableMiniLevels.charged],
            double: [...oldPlayer.availableMiniLevels.double]
        };

        // Genera niveles con las areas randomizadas
        let levelPlan = this.fillUndefinedAreas(this.availableLevels[levelIndex]);

        // Crear nuevo nivel
        this.level = new BaseLevel(this.availableLevels[levelIndex], this.physics, this.collectedPowerUps);
        if (levelIndex === this.availableLevels.length - 1) {
            let princessChar = levelChars['P'];
            let princessX = this.level.width - 4;
            let princessY = this.level.height - 4;
            let princess = new princessChar.objClass("yellow", 1, 1, princessX, princessY, princessChar.label, this.physics);
            princess.position = new Vec(princessX, princessY);
            princess.size = new Vec(3, 3);
            princess.setSprite(princessChar.sprite, princessChar.rect);
            princess.sheetCols = princessChar.sheetCols;
            princess.setAnimation(...princessChar.startFrame, false, 100);
            this.level.princess = princess;
            this.princess = princess;

            this.level.princess = princess;
            this.princess = princess;
        }
        this.player = this.level.player;
        this.actors=this.level.actors;
        this.enemies = this.level.enemies;

        this.player.powerUps = powerUps;
        this.player.availableMiniLevels = availableMiniLevels;

        this.player.respawnPoint = oldRespawnPoint;
        this.player.initialPosition = oldInitialPosition;
        this.player.respawnLevelIndex = levelIndex;
        this.player.powerUpCooldown=isPowerUpColdown;
        this.player.cooldownTime=remainingCoolDownTime;

        this.currentLevelIndex=levelIndex;

        this.player.initialPosition = new Vec(this.player.position.x, this.player.position.y);

        this.playerPowerUps = { ...powerUps };
    }

    draw(ctx, scale) {
        this.background.draw(ctx);
        
        // Dibujar juego
        for (let actor of this.actors) {
            if (actor.type !== 'floor') {
                actor.draw(ctx, scale);
            }
        }

        for (let enemy of this.enemies) {
            enemy.draw(ctx, scale);
        }

        this.player.draw(ctx, scale);

        if (this.princess) {
            this.princess.draw(ctx, scale);
        }
        
        // Dibujar HUD
        ctx.fillStyle = '#5a2c0f';
        ctx.fillRect(0, canvasHeight - 100, canvasWidth, 100);

        this.textScore.draw(ctx, `Score: ${this.player.score}`);
        
        // Dibujar barra de power-ups
        this.powerUpBar.draw(ctx);
        if (this.player.powerUpCooldown) {
            const barWidth = 100;
            const barHeight = 10;
            const cooldownRatio = this.player.cooldownTime / this.player.cooldownDuration;
        
            // Posición
            const barX = 625;
            const barY = 360 - 8; 

            // Estilo
            ctx.fillStyle = 'black';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = 'red';
            ctx.fillRect(barX, barY, barWidth * cooldownRatio, barHeight);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        
            // Temporizador númerico
            ctx.fillStyle = 'white';
            ctx.font = '14px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(
                `${Math.ceil(this.player.cooldownTime / 1000)}s`,
                barX + barWidth + 8,
                barY + barHeight - 1 
            );
        
            ctx.textAlign = 'start'; 
        }
        if (this.gameOverActive) {
            this.drawGameOver(ctx);
        }
    }
    drawGameOver(ctx) {
        ctx.fillStyle = `rgba(0, 0, 0, ${this.gameOverAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if(this.gameOver.complete){
            const imgWidth = 300;
            const imgHeight = 200;
            const x = (canvasWidth - imgWidth) / 2;
            const y = (canvasHeight - imgHeight) / 2;

            ctx.save();
            ctx.globalAlpha = this.gameOverAlpha * 1.4;
            ctx.drawImage(this.gameOver, x, y, imgWidth, imgHeight);

            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx
            ctx.fillText('Press R to restart', canvasWidth/2 - 80, y + imgHeight + 40);
            ctx.restore();
        }

    }
    respawnPlayer() {
        if (this.gameOverActive) {
            const powerUpsToKeep = { ...this.playerPowerUps };
            const scoreToKeep = this.player.score;

            this.collectedPowerUps = {
                dash: [],
                charged: [],
                double: []
            };
            if (this.currentLevelIndex !== this.player.respawnLevelIndex) {
                this.changeLevel(this.player.respawnLevelIndex);
            } else {
                this.level = new BaseLevel(this.availableLevels[this.currentLevelIndex], this.physics, this.collectedPowerUps);
                this.player = this.level.player;
                this.actors = this.level.actors;
                this.enemies = this.level.enemies;
            }
            this.player.respawn(this.level);
            this.player.powerUps = powerUpsToKeep;
            this.player.score = scoreToKeep;

            this.powerUpBar.updateFrame(
                this.player.powerUps.charged,
                this.player.powerUps.double,
                this.player.powerUps.dash
            );

            this.gameOverActive = false;
            this.gameOverAlpha = 0;
        }
    }
    togglepause(){
        if(this.state == 'playing'){
            this.state = 'paused';
        } else if(this.state == 'paused'){
            this.state = 'playing';
            frameStart=document.timeline.currentTime;
        }
}
}

class Background {
    constructor(imagePath, width, height) {
        this.image = new Image();
        this.image.src = imagePath;
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        // Draw the background image to fill the entire canvas
        ctx.drawImage(this.image, 0, 0, canvasWidth, canvasHeight -100);
    }
}


// Object with the characters that appear in the level description strings
// and their corresponding objects
const levelChars = {
    // Rect defined as offset from the first tile, and size of the tiles
    ".": {objClass: GameObject,
          label: "floor",
          sprite: null,
          rect: null},
    "#": {objClass: GameObject,
          label: "wall",
          sprite: '../assets/BlueWalls.png',
          rect: new Rect(0, 0, 256, 256)},
    "@": {objClass: Player,
          label: "player",
          sprite: '../assets/Knight/Knight_Assets.png',
          rect: new Rect(0, 0, 32, 33.5),
          sheetCols: 18,
          startFrame: [0, 0]},
    "$": {objClass: Dash,
          label: "powerup1",
          sprite: '../assets/PowerUps/Dash.png',
          rect: new Rect(0, 0, 32, 32),
          sheetCols: 3,
          startFrame: [0, 1]},
    "%": {objClass: Charged,
          label: "powerup2",
          sprite: '../assets/PowerUps/Charged_Jump.png',
          rect: new Rect(0, 0, 32, 32),
          sheetCols: 3,
          startFrame: [0, 1]},
    "&": {objClass: Double,
          label: "powerup3",
          sprite: '../assets/PowerUps/Double_jump.png',
          rect: new Rect(0, 0, 32, 32),
          sheetCols: 3,
          startFrame: [0, 1]},
    "S": {objClass: EnemySkeleton,
          label: "skeleton",
          sprites: {
            move: {
                path: '../assets/Skeleton/Skeleton_Walk_Assets.png',
                rect: new Rect(0, 0, 22, 33),
                sheetCols: 18
            },
            attack: {
                path: '../assets/Skeleton/Skeleton_Attack_Assets.png',
                rect: new Rect(0, 0, 43, 37),  
                sheetCols: 18
            },
            death: {
                path: '../assets/Skeleton/Skeleton_Dead_Assets.png',
                rect: new Rect(0, 0, 33, 32),  
                sheetCols: 15
            }
        },
          startFrame: [0, 0]},
    "D": {objClass: EnemyDemon,
          label: "demon",
          sprite: '../assets/Demon/Demon_Assets.png',
          rect: new Rect(0, 0, 81, 71),
          sheetCols: 7,
          startFrame: [0, 0]},
    "J": {objClass: EnemyJumper,
          label: "jumper",
          sprite: '../assets/Jumper/Jumper_Assets.png',
          rect: new Rect(0, 0, 64, 32),
          sheetCols: 15,
          startFrame: [0, 0]},
    "P": {objClass: Princess,
          label: "princess",
          sprite: '../assets/Princess_Assets.png',
          rect: new Rect(0, 0, 32, 32),
          sheetCols: 8,
          startFrame: [0, 0]},
    "x": {objClass: GameObject,
          label: "undefined",
          sprite: null,
          rect: null},
    "i": {objClass: GameObject,
          label: "undefined",
          sprite: null,
          rect: null},
};


function main() {
    // Set a callback for when the page is loaded,
    // so that the canvas can be found
    window.onload = init;
}

function init() {
    const canvas = document.getElementById('canvas');
    //const canvas = document.querySelector('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx = canvas.getContext('2d');



    gameStart();
}

function gameStart() {
    const physics = new BasePhysics();  // Create an instance of BasePhysics
    // a Register the game object, which creates all other objects
    game = new Game('playing', 0);  // Pass physics to Level

    setEventListeners();

    // Call the first frame with the current time
    updateCanvas(document.timeline.currentTime);
}

function setEventListeners() {
    window.addEventListener("keydown", event => {

        if(event.key == 'Escape'){
            game.togglepause();
            return;
        }
        
        if (event.key.toLowerCase() === 'r' && game.gameOverActive) {
            game.respawnPlayer();
        }
    
        if (game.player.isDead) {
            return;
        }

        if (event.code == 'Space') {
            game.player.jump();
        }
        if (event.key == 'a') {
            game.player.startMovement("left");
        }
        if (event.key == 'd') {
            game.player.startMovement("right");
        }
        if (event.key == 's') {
            game.player.crouch();
        }
        if (event.key == 'q') {
            game.player.dash();
        }
    });

    window.addEventListener("keyup", event => {
        if(game.statePlayer !== 'playing') return;

        if (event.key == 'a') {
            game.player.stopMovement("left");
        }
        if (event.key == 'd') {
            game.player.stopMovement("right");
        }
        if (event.key == 's') {
            game.player.standUp();
        }
    });
}

// Function that will be called for the game loop
function updateCanvas(frameTime) {
    if (frameStart === undefined) {
        frameStart = frameTime;
    }
    let deltaTime = frameTime - frameStart;
    //console.log(`Delta Time: ${deltaTime}`);

    const MAX_DELTA = 100;
    if (deltaTime > MAX_DELTA) {
        deltaTime = MAX_DELTA;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    game.update(deltaTime);
    game.draw(ctx, scale);

    // Update time for the next frame
    frameStart = frameTime;
    requestAnimationFrame(updateCanvas);
}

// Call the start function to initiate the game
main();
