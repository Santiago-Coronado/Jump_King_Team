/*
Princess Stuff
*/

"use strict";

class Princess extends AnimatedObject {
    constructor(color, width, height, x, y, physics) {
        super(color || "yellow", width, height, x, y);
        this.physics = physics;
        this.detectionRange = 20; // Rango para detectar al jugador
        this.victorySequenceActive = false;
        this.sequenceStage = 'inactive';
        this.sequenceTimer = 0;
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.isIdling = true;
        this.victoryMusicStarted = false; // Bandera para evitar múltiples instancias del audio

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

        // Ciclo manual de animación en estado idle
        if (this.isIdling && !this.victorySequenceActive) {
            this.animationTimer += deltaTime;
            
            if (this.animationTimer >= this.movement.idle.duration) {
                this.animationTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.movement.idle.frames.length;
                const frame = this.movement.idle.frames[this.currentFrame];
                
                // Actualiza las propiedades de la imagen del sprite
                this.frame = frame;
                this.spriteRect.x = frame % this.sheetCols;
                this.spriteRect.y = Math.floor(frame / this.sheetCols);
            }
        }
        
        // Lógica de la secuencia de victoria
        if (!this.victorySequenceActive) {
            // Verifica si el jugador está cerca para iniciar la secuencia
            if (this.isPlayerNearby(player)) {
                this.isIdling = false;
                this.startVictorySequence(player, game);
            }
        } else {
            // Maneja la secuencia de victoria
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
        
        // Deshabilita el control del jugador
        player.disableControls = true;
        
        // Define la dirección del jugador para que mire a la princesa
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
        // Mueve al jugador hacia la princesa
        const targetX = this.position.x - (player.isFacingRight ? 1.5 : -1.5);
        const moveDirection = targetX > player.position.x ? 1 : -1;
        
        // Mueve al jugador a un ritmo controlado
        player.velocity.x = moveDirection * this.physics.walkSpeed * 0.8;
        
        // Actualiza la animación del jugador según su dirección
        if (player.isFacingRight) {
            player.movement.right.status = true;
            player.movement.left.status = false;
        } else {
            player.movement.right.status = false;
            player.movement.left.status = true;
        }
        
        // Cuando el jugador esté lo suficientemente cerca de la posición objetivo
        if (Math.abs(player.position.x - targetX) < 0.2) {
            player.velocity.x = 0; // Detiene al jugador
            
            // Resetea el estado de movimiento del jugador
            player.movement.right.status = false;
            player.movement.left.status = false;
            
            // Pasa a la etapa de celebración
            this.sequenceStage = 'celebrate';
            this.sequenceTimer = 0;

            // Inicia la celebración
            this.movement.celebration.status = true;
            
            // Configura la animación usando los moveFrames de celebración
            const celebrationFrames = this.movement.celebration.moveFrames;
            const minFrame = Math.min(...celebrationFrames);
            const maxFrame = Math.max(...celebrationFrames);
            this.setAnimation(minFrame, maxFrame, true, this.movement.celebration.duration);
            
            // Reproduce el sonido de celebración si está disponible
            if (this.celebrateSound) {
                this.celebrateSound.currentTime = 0;
                this.celebrateSound.play().catch(error => console.log("Error playing celebrate sound:", error));
            }
        }
    }

    handleCelebrateStage() {
        // Celebra durante 2 segundos
        if (this.sequenceTimer >= 2000) {
            // Pasa a la etapa del beso
            this.sequenceStage = 'kiss';
            this.sequenceTimer = 0;
            
            // Configura la animación del beso usando idleFrames (representa el beso)
            const kissFrames = this.movement.celebration.idleFrames;
            const minFrame = Math.min(...kissFrames);
            const maxFrame = Math.max(...kissFrames);
            this.setAnimation(minFrame, maxFrame, false, 300);
            
            // Reproduce el sonido del beso si está disponible
            if (this.kissSound) {
                this.kissSound.currentTime = 0;
                this.kissSound.play().catch(error => console.log("Error playing kiss sound:", error));
            }
        }
    }

    handleKissStage(player) {
        // Primera mitad de la duración del beso: se muestra la animación sin salto
        if (this.sequenceTimer >= 500 && !player.isJumping) {
            // Tras 500ms del beso, se hace que el jugador salte de alegría
            console.log("Kiss complete, player jumping in joy!");
            player.velocity.y = player.physics.initialJumpSpeed * 1.2;
            player.isJumping = true;
            
            // Configura la animación de salto usando los frames correspondientes del jugador
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
        
        // Tras 1 segundo de beso, pasa a la etapa de victoria
        if (this.sequenceTimer >= 1000) {
            this.sequenceStage = 'victory';
            this.sequenceTimer = 0;
        }
    }
    
    handleVictoryStage(game) {
        if (this.sequenceTimer >= 2000 && !this.victoryMusicStarted) {
            this.victoryMusicStarted = true;
    
            if (!gameElapsedTime) {
                const now = Date.now();
                gameElapsedTime = now - gameStartTime;
            }
        
            const overlay = document.getElementById("gameCompleteOverlay");
            const scoreDisplay = document.getElementById("finalScore");
        
            const seconds = Math.floor((gameElapsedTime / 1000) % 60);
            const minutes = Math.floor((gameElapsedTime / 1000) / 60);
            const timeFormatted = `${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`;
        
            scoreDisplay.textContent = `Puntaje: ${game.player.score} | Tiempo: ${timeFormatted}`;
            overlay.style.display = "flex";
        
            requestAnimationFrame(() => {
                overlay.style.opacity = "1";
            });
        
            const mainMusic = document.getElementById("bgMusic");
            if (mainMusic) {
                mainMusic.pause();
                mainMusic.currentTime = 0;
            }
        
            const victoryMusic = new Audio("../Assets/Music/EndingSong.mp3");
            victoryMusic.volume = 0.5;
        
            victoryMusic.addEventListener('canplaythrough', () => {
                victoryMusic.play();
            });
        
            victoryMusic.load();
        
            const restartButton = document.getElementById("restartButton");
            restartButton.onclick = () => {
                overlay.style.display = "flex";
                requestAnimationFrame(() => {
                    overlay.style.opacity = "1";
                });
                location.reload();
            };
        
            const mainMenuButton = document.getElementById("mainMenuButton");
            mainMenuButton.onclick = () => {
                window.location.href = "PantallaPrincipal.html";
            };
        }
    }
}