/*
Princess Stuff
*/

"use strict";

class Princess extends AnimatedObject {
    constructor(color, width, height, x, y, physics) {
        super(color || "yellow", width, height, x, y);
        this.physics = physics;
        this.detectionRange = 20; // Range for detecting the player
        this.victorySequenceActive = false;
        this.sequenceStage = 'inactive';
        this.sequenceTimer = 0;
        this.animationTimer = 0;
        this.currentFrame = 0;
        this.isIdling = true;

        this.movement = {
            celebration:{ 
                    status: false,
                    axis: "x",
                    sign: 1,
                    repeat: false,
                    duration: 100,
                    moveFrames: [0,1,2],
                    idleFrames: [3,4,5,6,7] },
            idle: { 
                status: true,
                repeat: true,
                duration: 200,
                frames: [0,1,2]
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

        // Manual animation cycling for idle state
        if (this.isIdling && !this.victorySequenceActive) {
            this.animationTimer += deltaTime;
            
            if (this.animationTimer >= this.movement.idle.duration) {
                this.animationTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.movement.idle.frames.length;
                const frame = this.movement.idle.frames[this.currentFrame];
                
                // Update sprite display properties
                this.frame = frame;
                this.spriteRect.x = frame % this.sheetCols;
                this.spriteRect.y = Math.floor(frame / this.sheetCols);
            }
        }
        
        // Victory sequence logic
        if (!this.victorySequenceActive) {
            // Check if player is nearby to start victory sequence
            if (this.isPlayerNearby(player)) {
                this.isIdling = false;
                this.startVictorySequence(player, game);
            }
        } else {
            // Handle the victory sequence
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
        
        // Disable player controls
        player.disableControls = true;
        
        // Store player's direction and make them face the princess
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
        // Move player toward princess
        const targetX = this.position.x - (player.isFacingRight ? 1.5 : -1.5);
        const moveDirection = targetX > player.position.x ? 1 : -1;
        
        // Move player at a controlled pace
        player.velocity.x = moveDirection * this.physics.walkSpeed * 0.8;
        
        // Update player animation if needed - using player's existing movement structure
        if (player.isFacingRight) {
            player.movement.right.status = true;
            player.movement.left.status = false;
        } else {
            player.movement.right.status = false;
            player.movement.left.status = true;
        }
        
        // If player is close enough to the target position
        if (Math.abs(player.position.x - targetX) < 0.2) {
            player.velocity.x = 0; // Stop player movement
            
            // Reset player movement status
            player.movement.right.status = false;
            player.movement.left.status = false;
            
            // Move to celebration stage
            this.sequenceStage = 'celebrate';
            this.sequenceTimer = 0;

            // Start celebration
            this.movement.celebration.status = true;
            
            // Set animation frames using the moveFrames from celebration
            const celebrationFrames = this.movement.celebration.moveFrames;
            const minFrame = Math.min(...celebrationFrames);
            const maxFrame = Math.max(...celebrationFrames);
            this.setAnimation(minFrame, maxFrame, true, this.movement.celebration.duration);
            
            // Play celebration sound if available
            if (this.celebrateSound) {
                this.celebrateSound.currentTime = 0;
                this.celebrateSound.play().catch(error => console.log("Error playing celebrate sound:", error));
            }
        }
    }

    handleCelebrateStage() {
        // Celebrate for 2 seconds
        if (this.sequenceTimer >= 2000) {
            // Move to kiss stage
            this.sequenceStage = 'kiss';
            this.sequenceTimer = 0;
            
            // Set kiss animation using idle frames (representing the kiss)
            const kissFrames = this.movement.celebration.idleFrames;
            const minFrame = Math.min(...kissFrames);
            const maxFrame = Math.max(...kissFrames);
            this.setAnimation(minFrame, maxFrame, false, 300);
            
            // Play kiss sound if available
            if (this.kissSound) {
                this.kissSound.currentTime = 0;
                this.kissSound.play().catch(error => console.log("Error playing kiss sound:", error));
            }
        }
    }

    handleKissStage(player) {
        // First half of kiss duration - just show the kiss animation, no jump yet
        if (this.sequenceTimer >= 500 && !player.isJumping) {
            // After 500ms of kiss, make player jump in joy
            console.log("Kiss complete, player jumping in joy!");
            player.velocity.y = player.physics.initialJumpSpeed * 1.2;
            player.isJumping = true;
            
            // Set jump animation using player's own jump animation frames
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
        
        // Kiss for 1 second, then move to victory stage
        if (this.sequenceTimer >= 1000) {
            // Move to victory stage
            this.sequenceStage = 'victory';
            this.sequenceTimer = 0;
        }
    }
    

    handleVictoryStage(game) {
        // Display victory for 2 seconds then end game
        if (this.sequenceTimer >= 2000) {
            console.log("Game complete! Victory!");
            
            // Show victory screen
            this.showVictoryScreen();
        }
    }

    showVictoryScreen(){

    }
}