/*
 * Game Statistics Tracking
 * Tracks player performance across game sessions via external server
 */

"use strict";

class GameStats {
    constructor() {
        // Initialize with default values
        this.totalTimePlayed = 0; // in milliseconds
        this.deaths = 0;
        this.gamesCompleted = 0;
        this.gamesPlayed = 0;
        this.bestTime = Infinity; // in milliseconds
        this.bestScore = 0;
        this.enemiesDefeated = 0;
        
        // Load saved stats from server when instantiated
        this.initialized = this.loadFromServer().catch(err => {
            console.error('Failed to initialize stats from server:', err);
        });
    }
    
    // Format time from milliseconds to hours, minutes, seconds object
    formatTime(milliseconds) {
        const seconds = Math.floor((milliseconds / 1000) % 60);
        const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        
        return {
            hours,
            minutes,
            seconds,
            formatted: `${hours}h ${minutes}m ${seconds < 10 ? "0" : ""}${seconds}s`
        };
    }
    
    // Add gameplay time to total
    async addTimePlayed(milliseconds) {
        await this.initialized;
        this.totalTimePlayed += milliseconds;
        await this.saveToServer();
    }
    
    // Record a player death
    async recordDeath() {
        await this.initialized;
        this.deaths++;
        await this.saveToServer();
    }
    
    // Start tracking a new game session
    async startGame() {
        await this.initialized;
        this.gamesPlayed++;
        await this.saveToServer();
    }
    
    // Complete a game with final score and time
    async completeGame(score, timeInMilliseconds) {
        await this.initialized;
        this.gamesCompleted++;
        
        // Update best time if this run was faster
        if (timeInMilliseconds < this.bestTime) {
            this.bestTime = timeInMilliseconds;
        }
        
        // Update best score if this run scored higher
        if (score > this.bestScore) {
            this.bestScore = score;
        }
        
        await this.saveToServer();
    }
    
    // Record an enemy defeat
    async recordEnemyDefeated() {
        await this.initialized;
        this.enemiesDefeated++;
        await this.saveToServer();
    }
    
    // Get all stats as an object for API requests
    getStats() {
        const formattedTotalTime = this.formatTime(this.totalTimePlayed);
        const formattedBestTime = this.bestTime !== Infinity ? 
            this.formatTime(this.bestTime) : { hours: 0, minutes: 0, seconds: 0, formatted: "N/A" };
        
        return {
            totalTimePlayed: {
                hours: formattedTotalTime.hours,
                minutes: formattedTotalTime.minutes,
                seconds: formattedTotalTime.seconds,
                formatted: formattedTotalTime.formatted
            },
            deaths: this.deaths,
            gamesCompleted: this.gamesCompleted,
            gamesPlayed: this.gamesPlayed,
            personalRecord: {
                bestTime: {
                    hours: formattedBestTime.hours,
                    minutes: formattedBestTime.minutes,
                    seconds: formattedBestTime.seconds,
                    formatted: formattedBestTime.formatted
                },
                bestScore: this.bestScore
            },
            enemiesDefeated: this.enemiesDefeated
        };
    }
    
    // Save stats to server
    async saveToServer(url = '/api/save-stats') {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.getStats())
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving stats to server:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Load stats from server
    async loadFromServer(url = '/api/get-stats') {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Server response: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.success) {
                // Update local stats from server data
                const stats = data.stats;
                
                if (stats.totalTimePlayed) {
                    // Convert hours/minutes/seconds to milliseconds
                    const hours = stats.totalTimePlayed.hours || 0;
                    const minutes = stats.totalTimePlayed.minutes || 0;
                    const seconds = stats.totalTimePlayed.seconds || 0;
                    
                    this.totalTimePlayed = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
                }
                
                this.deaths = stats.deaths || 0;
                this.gamesCompleted = stats.gamesCompleted || 0;
                this.gamesPlayed = stats.gamesPlayed || 0;
                
                if (stats.personalRecord && stats.personalRecord.bestTime) {
                    const hours = stats.personalRecord.bestTime.hours || 0;
                    const minutes = stats.personalRecord.bestTime.minutes || 0;
                    const seconds = stats.personalRecord.bestTime.seconds || 0;
                    
                    this.bestTime = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
                    if (this.bestTime === 0) this.bestTime = Infinity;
                }
                
                this.bestScore = stats.personalRecord?.bestScore || 0;
                this.enemiesDefeated = stats.enemiesDefeated || 0;
                
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('Error loading stats from server:', error);
            return { success: false, error: error.message };
        }
    }
}