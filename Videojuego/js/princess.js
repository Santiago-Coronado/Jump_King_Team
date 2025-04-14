/*
 * Princess Stuff
 * Enrique Antonio Pires A01424547
 * Santiago Coronado A01785558
 * Juan de Dios Gastelum A01784523
*/

"use strict";

class Princess extends AnimatedObject {
    constructor(color, width, height, x, y, physics) {
        super(color || "yellow", width, height, x, y);
        this.physics = physics;
        this.detectionRange = 20; // Range to detect the player
        this.victorySequenceActive = false;
        this.sequenceStage = 'inactive';
        this.sequenceTimer = 0;
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.isIdling = true;
        this.victoryMusicStarted = false; // Flag to indicate if victory music has started

        this.movement = {
            celebration:{ 
                status: false,
                axis: "x",
                sign: 1,
                repeat: false,
                duration: 100,
                moveFrames: [0, 1, 2],
                idleFrames: [3, 4, 5, 6, 7]
            },
            idle: { 
                status: true,
                repeat: true,
                duration: 200,
                frames: [0, 1, 2]
            }
        };
        this.startIdleAnimation();
    }

    startIdleAnimation() {
        const idleFrames = this.movement.idle.frames;
        const minFrame = Math.min(...idleFrames);
        const maxFrame = Math.max(...idleFrames);
        this.setAnimation(minFrame, maxFrame, true, this.movement.idle.duration);
        this.isIdling = true;
        this.animationTimer = 0;
        this.currentFrame = 0;
        console.log("Princess idle animation started");
    }

    update(deltaTime, player, game) {
        this.updateFrame(deltaTime);

        // Manual cycle through idle animation frames
        if (this.isIdling && !this.victorySequenceActive) {
            this.animationTimer += deltaTime;
            
            if (this.animationTimer >= this.movement.idle.duration) {
                this.animationTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.movement.idle.frames.length;
                const frame = this.movement.idle.frames[this.currentFrame];
                
                // Update properties of sprite image
                this.frame = frame;
                this.spriteRect.x = frame % this.sheetCols;
                this.spriteRect.y = Math.floor(frame / this.sheetCols);
            }
        }
        
        // Logic to check if the player is nearby and start the victory sequence
        if (!this.victorySequenceActive) {
            // Verify player proximity
            if (this.isPlayerNearby(player)) {
                this.isIdling = false;
                this.startVictorySequence(player, game);
            }
        } else {
            // Manage the victory sequence
            this.sequenceTimer += deltaTime;
            this.updateVictorySequence(player, game);
        }
    }

    isPlayerNearby(player) {
        const distance = Math.abs(this.position.x - player.position.x);
        return distance < this.detectionRange;
    }

    startVictorySequence(player, game) {
        this.victorySequenceActive = true;
        this.sequenceStage = 'approaching';
        this.sequenceTimer = 0;
        
        // Disable controls
        player.disableControls = true;
        player.inVictorySequence = true;
        
        // Define direction the player is facing
        player.isFacingRight = this.position.x > player.position.x;
        
        console.log("Victory sequence activated!");
    }

    updateVictorySequence(player, game) {
        switch (this.sequenceStage) {
            case 'approaching':
                this.handleApproachingStage(player);
                break;
            case 'celebrate':
                this.handleCelebrateStage();
                break;
            case 'kiss':
                this.handleKissStage(player);
                break;
            case 'victory':
                this.handleVictoryStage(game);
                break;
        }
    }

    handleApproachingStage(player) {
        // Check if player is in the air (jumping or falling)
        if (player.isJumping || player.velocity.y !== 0) {
            // Let gravity handle the fall naturally - don't modify movement yet
            return;
        }
        
        // Move player towards the princess
        const targetX = this.position.x - (player.isFacingRight ? 1.5 : -1.5);
        const moveDirection = targetX > player.position.x ? 1 : -1;
        
        // Check if we need to keep moving
        if (Math.abs(player.position.x - targetX) > 0.2) {
            // Calculate movement amount (use a fixed amount per frame rather than velocity)
            const moveAmount = moveDirection * this.physics.walkSpeed * 0.02;
            
            // Directly update player position rather than setting velocity
            const newX = player.position.x + moveAmount;
            
            // Check level boundaries
            const levelWidth = player.currentLevel ? player.currentLevel.width : 30;
            const playerWidth = player.size.x;
            
            if (newX >= 0 && newX + playerWidth <= levelWidth) {
                // Directly move the player
                player.position.x = newX;
                
                // Set velocity too (for animation purposes)
                player.velocity.x = moveDirection * this.physics.walkSpeed * 0.6;
                
                // Force walking animation
                if (moveDirection > 0) {
                    player.isFacingRight = true;
                    const rightData = player.movement.right;
                    
                    // Force animation directly
                    const minFrame = Math.min(...rightData.moveFrames);
                    const maxFrame = Math.max(...rightData.moveFrames);
                    player.setAnimation(minFrame, maxFrame, rightData.repeat, rightData.duration);
                    
                    // Force movement status for animation
                    player.movement.right.status = true;
                    player.movement.left.status = false;
                } else {
                    player.isFacingRight = false;
                    const leftData = player.movement.left;
                    
                    const minFrame = Math.min(...leftData.moveFrames);
                    const maxFrame = Math.max(...leftData.moveFrames);
                    player.setAnimation(minFrame, maxFrame, leftData.repeat, leftData.duration);
                    
                    // Force movement status for animation
                    player.movement.right.status = false;
                    player.movement.left.status = true;
                }
            }
        } else {
            // We've reached the target position
            player.velocity.x = 0;
            player.movement.right.status = false;
            player.movement.left.status = false;
            
            // Go to celebrate state
            this.sequenceStage = 'celebrate';
            this.sequenceTimer = 0;
            
            // Rest of the celebration code remains the same...
            this.movement.celebration.status = true;
            const celebrationFrames = this.movement.celebration.moveFrames;
            const minFrame = Math.min(...celebrationFrames);
            const maxFrame = Math.max(...celebrationFrames);
            this.setAnimation(minFrame, maxFrame, true, this.movement.celebration.duration);
            
            if (this.celebrateSound) {
                this.celebrateSound.currentTime = 0;
                this.celebrateSound.play().catch(error => console.log("Error playing celebrate sound:", error));
            }
        }
    }

    handleCelebrateStage() {
        // Celebrate for 2 seconds
        if (this.sequenceTimer >= 2000) {
            // Go to kiss stage
            this.sequenceStage = 'kiss';
            this.sequenceTimer = 0;

            // Animation of kiss
            const kissFrames = this.movement.celebration.idleFrames;
            const minFrame = Math.min(...kissFrames);
            const maxFrame = Math.max(...kissFrames);
            this.setAnimation(minFrame, maxFrame, false, 300);

            // Put the sound effects for the kiss
            if (this.kissSound) {
                this.kissSound.currentTime = 0;
                this.kissSound.play().catch(error => console.log("Error playing kiss sound:", error));
            }
        }
    }

    handleKissStage(player) {
        // First half of the kiss duration: show animation without jump
        if (this.sequenceTimer >= 500 && !player.isJumping) {
            // After 500ms, make the player jump in joy
            console.log("Kiss complete, player jumping in joy!");
            player.velocity.y = player.physics.initialJumpSpeed * 1.2;
            player.isJumping = true;

            // Get the jump animation frames based on direction
            if (player.isFacingRight) {
                const jumpFrames = player.movement.jump.right;
                player.setAnimation(
                    Math.min(...jumpFrames),
                    Math.max(...jumpFrames),
                    true,
                    player.movement.jump.duration
                );
            } else {
                const jumpFrames = player.movement.jump.left;
                player.setAnimation(
                    Math.min(...jumpFrames),
                    Math.max(...jumpFrames),
                    true,
                    player.movement.jump.duration
                );
            }
        }
        
        // After 1 second of kissing, go to victory stage
        if (this.sequenceTimer >= 1000) {
            this.sequenceStage = 'victory';
            this.sequenceTimer = 0;
        }
    }
    
    handleVictoryStage(game) {
        // Wait 2 seconds before showing the victory screen and only execute this once
        if (this.sequenceTimer >= 2000 && !this.victoryMusicStarted) {
            game.persistentPowerUps = { ...game.player.powerUps };
            // Set flag to prevent this code from running multiple times
            this.victoryMusicStarted = true;
            
            // Calculate the total time played if not already calculated
            if (!gameElapsedTime) {
                const now = Date.now();
                gameElapsedTime = now - gameStartTime;
            }
            
            // Record completion
            if (gameStats) {
                gameStats.completeGame(game.player.score, gameElapsedTime);
            }
            // Get references to the HTML elements for the victory overlay
            const overlay = document.getElementById("gameCompleteOverlay");
            const scoreDisplay = document.getElementById("finalScore");
            
            // Format time into minutes and seconds with leading zeros for seconds under 10
            const seconds = Math.floor((gameElapsedTime / 1000) % 60);
            const minutes = Math.floor((gameElapsedTime / 1000) / 60);
            const timeFormatted = `${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
            
            // Update the score display with player's score and elapsed time
            scoreDisplay.textContent = `Puntaje: ${game.player.score} | Tiempo: ${timeFormatted}`;
            // Make the overlay visible
            overlay.style.display = "flex";
            
            // Use requestAnimationFrame to ensure the display change happens before changing opacity
            // This creates a smooth fade-in effect for the overlay
            requestAnimationFrame(() => {
                overlay.style.opacity = "1";
            });
            
            // Stop the background music
            const mainMusic = document.getElementById("bgMusic");
            if (mainMusic) {
                mainMusic.pause();
                mainMusic.currentTime = 0;
            }
            
            // Create and load the victory music
            const victoryMusic = new Audio("../Assets/Music/EndingSong.mp3");
            victoryMusic.volume = 0.5;
            
            // Play the victory music once it's ready
            victoryMusic.addEventListener('canplaythrough', () => {
                victoryMusic.play();
            });
            
            // Start loading the music file
            victoryMusic.load();
            
            // Set up handlers for the restart button
            const restartButton = document.getElementById("restartButton");
            restartButton.onclick = () => {
                // Keep overlay visible during transition
                overlay.style.display = "flex";
                requestAnimationFrame(() => {
                    overlay.style.opacity = "1";
                });
                // Reload the page to restart the game
                location.reload();
            };

            // Set up handlers for the main menu button
            const mainMenuButton = document.getElementById("mainMenuButton");
            mainMenuButton.onclick = () => {
                // Redirect to the main menu page
                window.location.href = "PantallaPrincipal.html";
            };
        }
        if (typeof statsManager !== 'undefined' && statsManager) {
            const finalScore = getFinalScore();
            statsManager.endGame(true, finalScore);            
        }
    }
    // En handleVictoryStage de princess.js
    if (gameStats) {
        // Registrar la partida completa
        gameStats.registrarPartida(
            gameElapsedTime,              // tiempo jugado
            0,                            // muertes durante esta sesión final
            true,                         // partida completada 
            0,                            // enemigos derrotados en esta sesión
            game.player.score,            // puntuación final
            gameElapsedTime               // tiempo de completado
        );
    }
}