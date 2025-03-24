/*
 * Simple top down adventure game
 *
 * Gilberto Echeverria
 * 2025-02-05
 */

"use strict";

// Global variables
const canvasWidth = 800;
const canvasHeight = 600;

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

        this.isFacingRight = true;
        this.isJumping = false;
        this.isCrouching = false;

        this.heightThreshold = 3; 
        this.inHigherLevel = false;

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
                      duration: 100,
                      right: [5, 6],
                      left: [11, 11] },
            crouch: { status: false,
                      repeat: false,
                      duration: 300,
                      right: [4,4],
                      left: [4,4],
                      upRight: [0, 0],
                      upLeft: [17, 17] },
        };
    }

    startMovement(direction) {
        const dirData = this.movement[direction];
        this.isFacingRight = direction === "right";
    
        // Set current direction status to true
        dirData.status = true;
        
        // Update velocity and animation based on active directions
        this.updateMovementState();
    }

    stopMovement(direction) {
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
        this.velocity.x = 0;
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
        // Make the character fall constantly because of gravity
        this.velocity.y = this.velocity.y + this.physics.gravity * deltaTime;

        // Check movement state and update it if needed
        this.updateMovementState();

        let velX = this.velocity.x;
        let velY = this.velocity.y;

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
            this.land();
        }

        this.updateFrame(deltaTime);
    }

    /*
    startMovement(direction) {
        const dirData = this.movement[direction];
        this.isFacingRight = direction === "right";

        // Get opposite direction
        const oppositeDirection = direction === "right" ? "left" : "right";
        const oppositeData = this.movement[oppositeDirection];
        
        // Set the current direction status to true
        dirData.status = true;
        
        // Set the velocity based on active directions
        this.updateMovementVelocity();
        
        // Only update animation if not crouching
        if (!this.isCrouching) {
            // Extract min and max frames from the moveFrames array
            const minFrame = Math.min(...dirData.moveFrames);
            const maxFrame = Math.max(...dirData.moveFrames);
            
            this.frame = minFrame; // Reset to first frame
            this.setAnimation(minFrame, maxFrame, dirData.repeat, dirData.duration);

            // Force update to the sprite
            this.spriteRect.x = this.frame % this.sheetCols;
            this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
        }
    }
    */

    

    /*
    stopMovement(direction) {
        const dirData = this.movement[direction];
        dirData.status = false;
        
        // Update velocity based on remaining active directions
        this.updateMovementVelocity();

        // Only update to idle animation if no movement keys are pressed
        const leftData = this.movement["left"];
        const rightData = this.movement["right"];
        
        if (!leftData.status && !rightData.status && !this.isJumping) {
            // Set idle animation based on facing direction
            if (this.isFacingRight) {
                const idleFrame = rightData.idleFrames[0];
                this.setAnimation(idleFrame, idleFrame, false, 100);
            } else {
                const idleFrame = leftData.idleFrames[0];
                this.setAnimation(idleFrame, idleFrame, false, 100);
            }

            // Force update of sprite
            this.spriteRect.x = this.frame % this.sheetCols;
            this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
        }
    }
        */


    // Method that calculates velocity based on active movement directions (this is made so that the character doesn't get stuck when pressing
    // many keys in quick succession)
    updateMovementVelocity() {
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
            this.isJumping = true;
            const jumpData = this.movement.jump;
             // Get frames for the current direction
            const jumpFrames = this.isFacingRight ? jumpData.right : jumpData.left;
            const minFrame = Math.min(...jumpFrames);
            const maxFrame = Math.max(...jumpFrames);
        
            // Set animation with those frames
            this.setAnimation(minFrame, maxFrame, jumpData.repeat, jumpData.duration);
        }
    }

    land() {
        // If the character is touching the ground,
        // there is no vertical velocity
        this.velocity.y = 0;
        // Force the player to move down to touch the floor
        this.position.y = Math.ceil(this.position.y);
        if (this.isJumping) {
            // Reset the jump variable
            this.isJumping = false;
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

    checkLevelChange(game){
        if(this.position.y <this.heightThreshold && !this.inHigherLevel){
            this.inHigherLevel=true;
            if (game.currentLevelIndex < game.availableLevels.length - 1){

                const currentXPosition = this.position.x;
                const facingRight = this.isFacingRight;
                const velocity = new Vec(this.velocity.x, this.velocity.y);
                const isJumping = this.isJumping;
                const isCrouching = this.isCrouching;

                const movementState = {
                    right: this.movement.right.status,
                    left: this.movement.left.status
                }

                game.changeLevel(game.currentLevelIndex + 1);

                const bottomPosition = game.level.height - 4;

                game.player.position = new Vec(currentXPosition,bottomPosition);
                game.player.isFacingRight = facingRight;
                game.player.velocity = velocity;
                game.player.inHigherLevel = true;
                game.player.isJumping = isJumping;
                game.player.isCrouching = isCrouching;

                if (movementState.right) {
                    game.player.movement.right.status = true;
                }
                if (movementState.left) {
                    game.player.movement.left.status = true;
                }
                
                game.player.updateMovementState();   
            }
        }
    }

    fallToLowerLevel(game){
        if(game.currentLevelIndex > 0){
            this.inHigherLevel = false;

            const currentXPosition = this.position.x;
            const facingRight = this.isFacingRight;
            const velocityX = this.velocity.x;
            const isJumping = this.isJumping;
            const isCrouching = this.isCrouching;

            const movementState = {
                right: this.movement.right.status,
                left: this.movement.left.status
            };

            game.changeLevel(game.currentLevelIndex - 1);

            const topPosition = 4;

            game.player.position = new Vec(currentXPosition, topPosition);
            game.player.isFacingRight = facingRight;
            game.player.velocity = new Vec (velocityX, 0.01);
            game.player.inHigherLevel = false;

            game.player.isJumping = isJumping;
            game.player.isCrouching = isCrouching;

            if (movementState.right) {
                game.player.movement.right.status = true;
            }
            if (movementState.left) {
                game.player.movement.left.status = true;
            }
            
            game.player.updateMovementState();
        }
    }
}


class Dash extends AnimatedObject {
    constructor(_color, width, height, x, y, _type) {
        super("yellow", width, height, x, y, "powerup");
    }

    update(_level, deltaTime) {
        this.updateFrame(deltaTime);
    }
}

class Charged extends AnimatedObject {
    constructor(_color, width, height, x, y, _type) {
        super("yellow", width, height, x, y, "powerup");
    }

    update(_level, deltaTime) {
        this.updateFrame(deltaTime);
    }
}
class Double extends AnimatedObject {
    constructor(_color, width, height, x, y, _type) {
        super("yellow", width, height, x, y, "powerup");
    }

    update(_level, deltaTime) {
        this.updateFrame(deltaTime);
    }
}


class BaseLevel {
    constructor(plan, physics) {
        // Split the plan string into a matrix of strings
        let rows = plan.trim().split('\n').map(l => [...l]);
        this.height = rows.length;
        this.width = rows[0].length;
        this.actors = [];

        // Fill the rows array with a label for the type of element in the cell
        // Most cells are 'empty', except for the 'wall'
        this.rows = rows.map((row, y) => {
            return row.map((ch, x) => {
                let item = levelChars[ch];
                let objClass = item.objClass;
                let cellType = item.label;
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
                } else if (actor.type == "powerup") {
                    // Also instantiate a floor tile below the player
                    this.addBackgroundFloor(x, y);

                    actor.position = actor.position.plus(new Vec(-1, -1));
                    actor.size = new Vec(2, 2); 
                    
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, true, 100);
                    this.actors.push(actor);
                    cellType = "empty";
                } else if (actor.type == "wall") {
                    // Randomize sprites for each wall tile
                    actor.setSprite(item.sprite, item.rect);
                    this.actors.push(actor);
                    cellType = "wall";
                } else if (actor.type == "floor") {
                    cellType = "floor";
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


class Game {
    constructor(state, levelIndex) {
        this.state = state;
        this.currentLevelIndex = levelIndex;
        this.physics = new BasePhysics();  // Create an instance of BasePhysics
        
        this.availableLevels = GAME_LEVELS;

        this.level = new BaseLevel (this.availableLevels[levelIndex], this.physics)

        this.player = this.level.player;
        this.actors = this.level.actors;

        this.background = new Background('../assets/Castle1.png', canvasWidth, canvasHeight);
    }

    update(deltaTime) {

        this.player.update(this.level, deltaTime);

        this.player.checkLevelChange(this);

        for (let actor of this.actors) {
            actor.update(this.level, deltaTime);
        }

        // A copy of the full list to iterate over all of them
        // DOES THIS WORK?
        let currentActors = this.actors;
        // Detect collisions
        for (let actor of currentActors) {
            if (actor.type != 'floor' && overlapRectangles(this.player, actor)) {

                 
                if (actor.type == 'powerup') {
                    this.actors = this.actors.filter(item => item !== actor);
                }
            }
        }
    }

    changeLevel(levelIndex){
        
        this.level = new BaseLevel(this.availableLevels[levelIndex], this.physics);
        this.player = this.level.player;
        this.actors=this.level.actors;

        this.currentLevelIndex=levelIndex;
    }

    draw(ctx, scale) {
        this.background.draw(ctx);
        
        // Draw only non-floor actors
        for (let actor of this.actors) {
            if (actor.type !== 'floor') {
                actor.draw(ctx, scale);
            }
        }
        this.player.draw(ctx, scale);
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
        ctx.drawImage(this.image, 0, 0, canvasWidth, canvasHeight/2 +50);
    }
}


// Object with the characters that appear in the level description strings
// and their corresponding objects
const levelChars = {
    // Rect defined as offset from the first tile, and size of the tiles
    ".": {objClass: GameObject,
          label: "floor",
          sprite: 'none',
          rect: new Rect(12, 17, 32, 32)},
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
          label: "collectible",
          sprite: '../assets/PowerUps/Dash.png',
          rect: new Rect(0, 0, 32, 32),
          sheetCols: 3,
          startFrame: [0, 1]},
    "%": {objClass: Charged,
          label: "collectible",
          sprite: '../assets/PowerUps/Charged_Jump.png',
          rect: new Rect(0, 0, 32, 32),
          sheetCols: 3,
          startFrame: [0, 1]},
    "&": {objClass: Double,
          label: "collectible",
          sprite: '../assets/PowerUps/Double_jump.png',
          rect: new Rect(0, 0, 32, 32),
          sheetCols: 3,
          startFrame: [0, 1]},
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
    // Register the game object, which creates all other objects
    game = new Game('playing', 0);  // Pass physics to Level

    setEventListeners();

    // Call the first frame with the current time
    updateCanvas(document.timeline.currentTime);
}

function setEventListeners() {
    window.addEventListener("keydown", event => {
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
    });

    window.addEventListener("keyup", event => {
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

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    game.update(deltaTime);
    game.draw(ctx, scale);

    // Update time for the next frame
    frameStart = frameTime;
    requestAnimationFrame(updateCanvas);
}

// Call the start function to initiate the game
main();
