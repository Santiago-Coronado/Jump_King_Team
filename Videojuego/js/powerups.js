/*
 * Powerup Classes
 */

"use strict";

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