/*
 * General classes
 * Enrique Antonio Pires A01424547
 * Santiago Coronado A01785558
 * Juan de Dios Gastelum A01784523
 * 
 */

"use strict";

class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    plus(other) {
        return new Vec(this.x + other.x, this.y + other.y);
    }

    minus(other) {
        return new Vec(this.x - other.x, this.y - other.y);
    }

    times(factor) {
        return new Vec(this.x * factor, this.y * factor);
    }

    get length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
}


class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}


class GameObject {
    constructor(color, width, height, x, y, type) {
        this.position = new Vec(x, y);
        this.size = new Vec(width, height);
        this.color = color;
        this.type = type;

        // Sprite properties
        this.spriteImage = undefined;
        this.spriteRect = undefined;
    }

    setSprite(spritePath, rect) {
        if (spritePath && rect) {
            this.spriteImage = new Image();
            this.spriteImage.src = spritePath;
            this.spriteRect = rect;
        } else {
            this.spriteImage = null;
            this.spriteRect = null;
        }
    }

    draw(ctx, scale) {
        if (this.spriteImage) {
            // Draw a sprite if the object has one defined
            if (this.spriteRect) {
                ctx.drawImage(this.spriteImage,
                              this.spriteRect.x * this.spriteRect.width,
                              this.spriteRect.y * this.spriteRect.height,
                              this.spriteRect.width, this.spriteRect.height,
                              this.position.x * scale, this.position.y * scale,
                              this.size.x * scale, this.size.y * scale);
            } else {
                ctx.drawImage(this.spriteImage,
                              this.position.x * scale, this.position.y * scale,
                              this.size.x * scale, this.size.y * scale);
            }
        } else {
            // If there is no sprite asociated, just draw a color square
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x * scale, this.position.y * scale,
                         this.size.x * scale, this.size.y * scale);
        }
    }

    update() {

    }
}

class AnimatedObject extends GameObject {
    constructor(color, width, height, x, y, type) {
        super(color, width, height, x, y, type);
        // Animation properties
        this.frame = 0;
        this.minFrame = 0;
        this.maxFrame = 0;
        this.sheetCols = 0;

        this.repeat = true;
        this.animationComplete = false;

        // Delay between frames (in milliseconds)
        this.frameDuration = 100;
        this.totalTime = 0;
    }

    setAnimation(minFrame, maxFrame, repeat, duration) {
        this.minFrame = minFrame;
        this.maxFrame = maxFrame;
        this.frame = minFrame;
        this.repeat = repeat;
        this.totalTime = 0;
        this.frameDuration = duration;
        this.animationComplete = false; // Reset flag when starting new animation
    }

    updateFrame(deltaTime) {
        this.totalTime += deltaTime;
        if (this.totalTime > this.frameDuration) {
            // Check if animation should complete
            if (!this.repeat && this.frame >= this.maxFrame) {
                this.animationComplete = true;
                return;
            }

            // Loop around the animation frames if the animation is set to repeat
            // Otherwise stay on the last frame
            let restartFrame = (this.repeat ? this.minFrame : this.frame);
            this.frame = this.frame < this.maxFrame ? this.frame + 1 : restartFrame;
            this.spriteRect.x = this.frame % this.sheetCols;
            this.spriteRect.y = Math.floor(this.frame / this.sheetCols);
            this.totalTime = 0;
        }
    }
}


class TextLabel {
    constructor(x, y, font, color) {
        this.x = x;
        this.y = y;
        this.font = font;
        this.color = color;
    }

    draw(ctx, text) {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.fillText(text, this.x, this.y);
    }
}


// Simple collision detection between rectangles
function overlapRectangles(actor1, actor2) {
    return actor1.position.x + actor1.size.x > actor2.position.x &&
           actor1.position.x < actor2.position.x + actor2.size.x &&
           actor1.position.y + actor1.size.y > actor2.position.y &&
           actor1.position.y < actor2.position.y + actor2.size.y;
}

class PowerUpBar {
    constructor() {
        this.sprite = new Image();
        this.sprite.src = '../Assets/PowerUpBar_Combinations.png';

        this.frameCount = 8;
        this.currentFrame = 0;

        this.frameWidth = 112;
        this.frameHeight = 40;

        this.scale = 2;
        this.displayWidth = this.frameWidth * this.scale;
        this.displayHeight = this.frameHeight * this.scale;

        this.position = {
            x: canvasWidth - this.displayWidth - 10,
            y: canvasHeight - this.displayHeight - 10
        };
    }

    draw(ctx) {
        if (!this.sprite.complete) return;

        ctx.drawImage(
            this.sprite,
            this.currentFrame * this.frameWidth, 0,
            this.frameWidth, this.frameHeight,
            this.position.x, this.position.y,
            this.displayWidth, this.displayHeight
        );
    }

    updateFrame(charged, double, dash) {
        // Generar un índice basado en las combinaciones exactas del spritesheet
        if (!charged && !double && !dash) {
            this.currentFrame = 0;
        } else if (charged && !double && !dash) {
            this.currentFrame = 1;
        } else if (!charged && double && !dash) {
            this.currentFrame = 2;
        } else if (!charged && !double && dash) {
            this.currentFrame = 3;
        } else if (charged && double && !dash) {
            this.currentFrame = 4;
        } else if (charged && !double && dash) {
            this.currentFrame = 5;
        } else if (!charged && double && dash) {
            this.currentFrame = 6;
        } else if (charged && double && dash) {
            this.currentFrame = 7;
        }
    }
}