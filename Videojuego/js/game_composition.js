/*
 * Game Class
 * Enrique Antonio Pires A01424547
 * Santiago Coronado A01785558
 * Juan de Dios Gastelum A01784523
 */

"use strict";

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

class Game {
    constructor(state, levelIndex) {
        this.state = state;
        this.currentLevelIndex = levelIndex;
        this.physics = new BasePhysics();  // Create an instance of BasePhysics
        
        this.availableLevels = GAME_LEVELS;
        this.loadedlevelPlans = []; // store the generated levels

        this.collectedPowerUps = {
            dash: [],
            charged: [],
            double: []
        };

        this.level = new BaseLevel (this.availableLevels[levelIndex], this.physics, this.collectedPowerUps)
        // store level on loaded levels
        this.loadedlevelPlans[levelIndex] = this.availableLevels[levelIndex];

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

        this.textScore = new TextLabel(70, canvasHeight - 60, "20px 'Press Start 2P', sans-serif", "white");
        this.textSpeedBoost = new TextLabel(70, canvasHeight - 30, "20px 'Press Start 2P', sans-serif", "white");
        this.textLevel = new TextLabel(70, canvasHeight, "20px 'Press Start 2P', sans-serif", "white");
        
        // Set the initial player power-ups
        this.playerPowerUps = {
            charged: false,
            double: false,
            dash: false
        };

        // Set the initial state for the player
        this.statePlayer= 'playing';

        // Pause menu properties
        this.pauseMenuActive = false;
        this.pauseAlpha = 0;
        this.pauseFadeSpeed = 0.005;

        // Sound control
        this.soundEnabled = true;
        this.effectsEnabled = true;

        this.soundImg = new Image();
        this.soundImg.src = '../Assets/Sound.png';
        this.homeImg = new Image(); 
        this.homeImg.src='../Assets/Home.png';
        this.effectImg = new Image();
        this.effectImg.src='../Assets/Effects.png';

        // Button states for interaction
        this.buttonStates = {
            home: { pressed: false },
            sound: { pressed: false },
            effects: { pressed: false }
        };

        // Button dimensions and positions
        this.pauseButtons = {
            home: { x: canvasWidth/2 - 150, y: canvasHeight/2, width: 80, height: 80 },
            sound: { x: canvasWidth/2 - 40, y: canvasHeight/2, width: 80, height: 80 },
            effects: { x: canvasWidth/2 + 70, y: canvasHeight/2, width: 80, height: 80 }
        };
    }

    update(deltaTime) {
        if (this.state === 'playing') {
        if (this.player.isDead) {
            this.player.deathTimer -= deltaTime;
            this.player.updateFrame(deltaTime);
            
            // Check if the player is dead and the death animation is complete
            if (this.player.deathTimer <= 0 && !this.gameOverActive) {
                this.gameOverActive = true;
                this.gameOverAlpha = 0;
            }
            // Check if the game over coloration is active
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
                    this.player.score += 1000; // Increase score by 1000 when collecting a dash power-up
                    this.actors = this.actors.filter(item => item !== actor);
                } else if (actor.type == 'powerup2') {
                    this.player.powerUps.charged = true;
                    this.player.availableMiniLevels.charged = Object.keys(MINI_LEVELS.charged);
                    this.player.score += 1000; // Increase score by 1000 when collecting a charged power-up
                    this.actors = this.actors.filter(item => item !== actor);
                } else if (actor.type == 'powerup3') {
                    this.player.powerUps.double = true;
                    this.player.availableMiniLevels.double = Object.keys(MINI_LEVELS.double);

                    this.collectedPowerUps.charged.push({
                        levelIndex: this.currentLevelIndex, 
                        x: actor.position.x,
                        y: actor.position.y
                    });
                    this.player.score += 1000; // Increase score by 1000 when collecting a double power-up
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
                    //console.log("enemy:",enemy);
                    // Player is stomping the enemy
                    if (enemy.takeDamage) {
                        //console.log("enemy  before takeDamage",enemy.isDying);
                        enemy.takeDamage();
                        this.player.velocity.y = -0.03;
                        //console.log("enemy after takeDamage",enemy.isDying);
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
        let levelPlan;
        // Check if we already have a generated version of this level
        if (this.loadedlevelPlans[levelIndex]) {
            levelPlan = this.loadedlevelPlans[levelIndex];
        } else {
            // Generate new level with randomized areas
            levelPlan = this.fillUndefinedAreas(nextLevel);
            // Store the generated level for future use
            this.loadedlevelPlans[levelIndex] = levelPlan;
        }

        // Crear nuevo nivel
        this.level = new BaseLevel(levelPlan, this.physics, this.collectedPowerUps);
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
        ctx.save()
        this.background.draw(ctx);
        
        // Draw game
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
        
        // Draw HUD
        ctx.fillStyle = '#5a2c0f';
        ctx.fillRect(0, canvasHeight - 100, canvasWidth, 100);

        ctx.textAlign = 'left'; // Force left alignment
        this.textScore.draw(ctx, `Score: ${this.player.score}`);

        // Display speed boost tier
        let boostText = "Speed Boost Tier: 0";
        if (this.player.speedBoostLevel > 0) {
            boostText = `Speed Boost Tier: ${this.player.speedBoostLevel}`;
        }
        this.textSpeedBoost.draw(ctx, boostText);

        // Display current level
        this.textLevel.draw(ctx, `Level: ${this.currentLevelIndex + 1}`);
        
        // Draw powerup bar
        this.powerUpBar.draw(ctx);
        if (this.player.powerUpCooldown) {
            const barWidth = 100;
            const barHeight = 10;
            const cooldownRatio = this.player.cooldownTime / this.player.cooldownDuration;
        
            // Position of bar
            const barX = 625;
            const barY = 360 - 8; 

            // Style of bar
            ctx.fillStyle = 'black';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = 'red';
            ctx.fillRect(barX, barY, barWidth * cooldownRatio, barHeight);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        
            // Numeric timer
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
        ctx.restore(); 
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

    drawpause(ctx) {
        ctx.save();
        if (this.state !== 'paused') return;
    
        ctx.fillStyle = `rgba(0, 0, 0, ${this.pauseAlpha})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        ctx.font = 'bold 36px "Press Start 2P", sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSA', canvasWidth/2, canvasHeight/2 - 80);
        
        if (this.homeImg.complete && this.soundImg.complete && this.effectImg.complete) {
            this.drawPauseButton(ctx, 'home', this.homeImg, this.pauseButtons.home, this.buttonStates.home.pressed);
            this.drawPauseButton(ctx, 'sound', this.soundImg, this.pauseButtons.sound, this.buttonStates.sound.pressed, this.soundEnabled);
            this.drawPauseButton(ctx, 'effects', this.effectImg, this.pauseButtons.effects, this.buttonStates.effects.pressed, this.effectsEnabled);
            
            ctx.font = '14px "Press Start 2P", sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText('Inicio', this.pauseButtons.home.x + 40, this.pauseButtons.home.y + 100);
            ctx.fillText('Música', this.pauseButtons.sound.x + 40, this.pauseButtons.sound.y + 100);
            ctx.fillText('Efectos', this.pauseButtons.effects.x + 40, this.pauseButtons.effects.y + 100);
        } else {
            ctx.font = '14px "Press Start 2P", sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText('Loading buttons...', canvasWidth/2, canvasHeight/2 + 20);
        }

        // Display game statistics
    if (gameStats) {
        const stats = gameStats.getStats();
        const statsY = this.pauseButtons.home.y - 100; // Position below buttons
        
        ctx.font = 'bold 20px "Press Start 2P", sans-serif';
        ctx.fillStyle = '#ffd700'; // Gold color for the heading
        ctx.fillText('ESTADÍSTICAS', canvasWidth/2, statsY);
        
        ctx.font = '12px "Press Start 2P", sans-serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        
        const leftColX = canvasWidth/2 - 180;
        const rightColX = canvasWidth/2 + 20;
        
        // Left column stats
        ctx.fillText(`Tiempo Total: ${stats.totalTimePlayed.formatted}`, leftColX, statsY + 30);
        ctx.fillText(`Muertes: ${stats.deaths}`, leftColX, statsY + 55);
        ctx.fillText(`Partidas Jugadas: ${stats.gamesPlayed}`, leftColX, statsY + 80);
        
        // Right column stats
        ctx.fillText(`Partidas Completadas: ${stats.gamesCompleted}`, rightColX, statsY + 30);
        ctx.fillText(`Mejor Tiempo: ${stats.personalRecord.bestTime.formatted}`, rightColX, statsY + 55);
        ctx.fillText(`Mejor Puntaje: ${stats.personalRecord.bestScore}`, rightColX, statsY + 80);
        ctx.fillText(`Enemigos Derrotados: ${stats.enemiesDefeated}`, rightColX, statsY + 105);
    }
        
        ctx.font = '14px "Press Start 2P", sans-serif';
        ctx.fillText('Presiona ESC para renaudar', canvasWidth/2, canvasHeight/2 + 150);
        ctx.textAlign = 'left';
        ctx.restore();
    }
    
    drawPauseButton(ctx, type, img, buttonPos, isPressed, isEnabled = true) {
        if (!img.complete) return; // Wait until image is loaded
        
        const spriteWidth = img.width / 3; // Each sprite sheet has 3 states
        let spriteIndex = 0; // Default: enabled
        
        if (isPressed) {
            spriteIndex = 1; // Pressed state
        } else if (!isEnabled) {
            spriteIndex = 2; // Disabled state
        }
        
        ctx.drawImage(
            img,
            spriteIndex * spriteWidth, 0, // Source x, y
            spriteWidth, img.height, // Source width, height
            buttonPos.x, buttonPos.y, // Destination x, y
            buttonPos.width, buttonPos.height // Destination width, height
        );
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

            // Clear loaded levels
            this.loadedlevelPlans = [];

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
            this.pauseAlpha = 0; // Reset fade-in effect
            this.statePlayer = 'paused'; 
            this.pauseAlpha = 0;
        } else if(this.state == 'paused'){
            this.state = 'playing';
            this.statePlayer = 'playing'; 
            frameStart=document.timeline.currentTime;
        }
}
}