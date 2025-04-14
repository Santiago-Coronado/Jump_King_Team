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
let gameStats;

let statsManager; // Initialize the stats manager; // Global variable for stats manager

// Scale of the whole world, to be applied to all objects
// Each unit in the level file will be drawn as these many square pixels
const scale = 14.3;

let debugJump = false;

let gameStartTime = Date.now();
let gameElapsedTime = 0;

class BasePhysics {
    constructor() {
        // The project works only with very small values for velocities and acceleration
        this.walkSpeed = 0.010;
        this.initialJumpSpeed = -0.03;
        this.gravity = 0.0000981;
    }
}

function toggleBackgroundMusic(enabled) {
    // Find all background music elements and adjust volume
    const musicElements = document.querySelectorAll('audio');
    musicElements.forEach(audio => {
        if (!audio.id || !audio.id.includes('effect')) {
            audio.volume = enabled ? 0.5 : 0; // Set to desired volume or mute
        }
    });
}

function updateSoundEffectsVolume(enabled) {
    if (!game.player) return;
    
    // Update player sound effects volume
    if (game.player.jumpSound) game.player.jumpSound.volume = enabled ? 0.5 : 0;
    if (game.player.damageSound) game.player.damageSound.volume = enabled ? 0.5 : 0;
    if (game.player.deathSound) game.player.deathSound.volume = enabled ? 0.5 : 0;
    
}

function isPointInRect(x, y, rect) {
    return x >= rect.x && 
           x <= rect.x + rect.width && 
           y >= rect.y && 
           y <= rect.y + rect.height;
}

// Helper function to handle button press detection
function checkButtonPress(mouseX, mouseY, buttonRect, buttonName) {
    if (isPointInRect(mouseX, mouseY, buttonRect)) {
        game.buttonStates[buttonName].pressed = true;
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
    "?": {objClass: GameObject, 
          label: "empty",
          sprite: null,
          rect: null},      
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
          sheetCols: 7,
          startFrame: [0, 0]},
    "J": {objClass: EnemyJumper,
          label: "jumper",
          sprite: '../assets/Jumper/Jumper_Assets.png',
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
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
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

    gameStats = new GameStats();
    gameStats.startGame(); // Record a new game started
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

       const canvas = document.getElementById('canvas');
    
       canvas.addEventListener('mousedown', event => {
           if (game.state !== 'paused') return;
           
           const rect = canvas.getBoundingClientRect();
           const mouseX = event.clientX - rect.left;
           const mouseY = event.clientY - rect.top;
           
           // Check each button
           checkButtonPress(mouseX, mouseY, game.pauseButtons.home, 'home');
           checkButtonPress(mouseX, mouseY, game.pauseButtons.sound, 'sound');
           checkButtonPress(mouseX, mouseY, game.pauseButtons.effects, 'effects');
       });
       
       canvas.addEventListener('mouseup', event => {
           if (game.state !== 'paused') return;
           
           const rect = canvas.getBoundingClientRect();
           const mouseX = event.clientX - rect.left;
           const mouseY = event.clientY - rect.top;
           
           // Handle button release actions
           if (game.buttonStates.home.pressed) {
               if (isPointInRect(mouseX, mouseY, game.pauseButtons.home)) {
                   // Navigate to home page
                   window.location.href = '../html/PantallaPrincipal.html';
               }
               game.buttonStates.home.pressed = false;
           }
           
           if (game.buttonStates.sound.pressed) {
               if (isPointInRect(mouseX, mouseY, game.pauseButtons.sound)) {
                   // Toggle sound
                   game.soundEnabled = !game.soundEnabled;
                   toggleBackgroundMusic(game.soundEnabled);
               }
               game.buttonStates.sound.pressed = false;
           }
           
           if (game.buttonStates.effects.pressed) {
               if (isPointInRect(mouseX, mouseY, game.pauseButtons.effects)) {
                   // Toggle effects
                   game.effectsEnabled = !game.effectsEnabled;
                   updateSoundEffectsVolume(game.effectsEnabled);
               }
               game.buttonStates.effects.pressed = false;
           }
       });
       
       // Cancel button press when mouse leaves the canvas
       canvas.addEventListener('mouseleave', () => {
           game.buttonStates.home.pressed = false;
           game.buttonStates.sound.pressed = false;
           game.buttonStates.effects.pressed = false;
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

    const currentTime = Date.now();
    if (gameStats && currentTime - gameStartTime > 10000) {
        const sessionTime = currentTime - gameStartTime;
        gameStats.addTimePlayed(sessionTime);
        gameStartTime = currentTime; // Reiniciar para contar los próximos 10 segundos
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (game.state === 'playing') {
        game.update(deltaTime);
    } else if (game.state === 'paused') {
        // Update pause menu fade-in effect
        if (game.pauseAlpha < 0.7) {
            game.pauseAlpha += game.pauseFadeSpeed * deltaTime;
            if (game.pauseAlpha > 0.7) {
                game.pauseAlpha = 0.7;
            }
        }
    }
    game.draw(ctx, scale);
    
    // Draw pause menu if the game is paused
    if (game.state === 'paused') {
        game.drawpause(ctx);
    }

    // Update time for the next frame
    frameStart = frameTime;
    requestAnimationFrame(updateCanvas);
}

// Añade esta función a platformer.js si no existe
function getFinalScore() {
    return game && game.player ? game.player.score : 0;
}

// Call the start function to initiate the game
main();

