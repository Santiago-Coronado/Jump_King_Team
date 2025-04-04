/*
 * BaseLevel Class
 * Enrique Antonio Pires A01424547
 * Santiago Coronado A01785558
 * Juan de Dios Gastelum A01784523
 */

"use strict";

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
                    // Only add a background floor where the power-up would be
                    this.addBackgroundFloor(x, y);
                    return "empty";
                }
                // Create a new instance of the type specified
                let actor = new objClass("skyblue", 1, 1, x, y, item.label, physics);  // Pass physics to the constructor
                // Configurations for each type of cell
                if (actor.type == "player") {
                    // Also instantiate a floor tile below the player
                    this.addBackgroundFloor(x, y);

                    actor.position = actor.position.plus(new Vec(0, -3));
                    actor.size = new Vec(3, 3);

                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, false, 100);
                    this.player = actor;
                    cellType = "empty";
                } else if (actor.type == "princess") {
                    this.addBackgroundFloor(x, y);
                    actor.position = actor.position.plus(new Vec(0, 0));
                    actor.size = new Vec(3, 3);
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, false, 100);
                    this.princess = actor;
                    cellType = "empty";
                } else if (actor.type == "powerup1") {
                    this.addBackgroundFloor(x, y);

                    actor.position = actor.position.plus(new Vec(-1, -1));
                    actor.size = new Vec(2, 2); 
                    
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, true, 100);
                    this.actors.push(actor);
                    cellType = "empty";
                    
                } else if (actor.type == "powerup2") {
                    this.addBackgroundFloor(x, y);

                    actor.position = actor.position.plus(new Vec(-1, -1));
                    actor.size = new Vec(2, 2); 
                    
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, true, 100);
                    this.actors.push(actor);
                    cellType = "empty";
                    
                } else if (actor.type == "powerup3") {
                    this.addBackgroundFloor(x, y);

                    actor.position = actor.position.plus(new Vec(-1, -1));
                    actor.size = new Vec(2, 2); 
                    
                    actor.setSprite(item.sprite, item.rect);
                    actor.sheetCols = item.sheetCols;
                    actor.setAnimation(...item.startFrame, true, 100);
                    this.actors.push(actor);
                    cellType = "empty";
                    
                }else if (actor.type == "wall") {
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