/*
 * Game Statistics Tracking
 * Tracks player performance across game sessions via external server
 */

"use strict";

class GameStats {
    constructor(userId, userName = "Player_" + Math.floor(Math.random() * 1000000)) {

        const storeUser = getCurrentUser();
        // El ID del usuario es necesario para la comunicación con el servidor
        this.userId = storeUser.id_usuario || userId || "guest_" + Math.floor(Math.random() * 1000000); // Fallback to a guest ID if none is provided
        this.userName = storeUser.nombre_usuario || userName;
        // Initialize with default values

        localStorage.setItem('userId', this.userId);
        localStorage.setItem('username', this.userName)

        this.totalTimePlayed = 0; // in milliseconds
        this.deaths = 0;
        this.gamesCompleted = 0;
        this.gamesPlayed = 0;
        this.bestTime = Infinity; // in milliseconds
        this.bestScore = 0;
        this.enemiesDefeated = 0;

        this.doubleJumpObtained = false;
        this.chargedJumpObtained = false;
        this.dashObtained = false;
        
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
            enemiesDefeated: this.enemiesDefeated,
            doublejump_obtenido: this.doubleJumpObtained,
            chargedjump_obtenido: this.chargedJumpObtained,
            dash_obtenido: this.dashObtained
        };
    }
    
    // Save stats to server
    async saveToServer(url = '/api/stats/update') {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_usuario: this.userId,
                    nombre_usuario: this.userName,
                    stats: {
                        tiempo_total_jugado: {
                            hours: this.formatTime(this.totalTimePlayed).hours,
                            minutes: this.formatTime(this.totalTimePlayed).minutes,
                            seconds: this.formatTime(this.totalTimePlayed).seconds
                        },
                        muertes: this.deaths,
                        partidas_completadas: this.gamesCompleted,
                        partidas_jugadas: this.gamesPlayed,
                        record_personal: {
                            mejor_tiempo: this.bestTime !== Infinity ? {
                                hours: this.formatTime(this.bestTime).hours,
                                minutes: this.formatTime(this.bestTime).minutes,
                                seconds: this.formatTime(this.bestTime).seconds
                            } : null,
                            mejor_puntuacion: this.bestScore
                        },
                        enemigos_derrotados: this.enemiesDefeated,
                        doublejump_obtenido: this.doubleJumpObtained,
                        chargedjump_obtenido: this.chargedJumpObtained,
                        dash_obtenido: this.dashObtained
                    }
                })
            });
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Update local userId with server userId if available
        if (responseData.userId) {
            this.userId = responseData.userId;
            localStorage.setItem('userId', this.userId);
            console.log('Updated userId from server:', this.userId);
        }
        
        return responseData;
            return await response.json();
        } catch (error) {
            console.error('Error saving stats to server:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Load stats from server
    async loadFromServer(url = '/api/stats/') {
        try {
            const response = await fetch(`${url}${this.userId}`);
            if (!response.ok) {
                // Si el jugador no existe, las estadísticas se mantendrán en cero
                if (response.status === 404) {
                    console.log('No se encontraron estadísticas previas, usando valores iniciales');
                    return { success: true, stats: this.getStats() };
                }
                
                throw new Error(`Server response: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.success) {
                // Adaptar el formato de la API a nuestro formato interno
                const stats = data.stats;
                
                // Si el servidor nos devuelve un nombre de usuario, lo usamos
                if (data.nombre_usuario) {
                    this.userName = data.nombre_usuario;
                    localStorage.setItem('username', this.userName);
                }
                localStorage.setItem('knightsfall_stats', JSON.stringify(stats));

                
                // Convertir tiempo total jugado de formato API a milisegundos
                if (stats.tiempo_total_jugado) {
                    const hours = stats.tiempo_total_jugado.hours || 0;
                    const minutes = stats.tiempo_total_jugado.minutes || 0;
                    const seconds = stats.tiempo_total_jugado.seconds || 0;
                    
                    this.totalTimePlayed = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
                }
                
                // Asignar otros valores
                this.deaths = stats.muertes || 0;
                this.gamesCompleted = stats.partidas_completadas || 0;
                this.gamesPlayed = stats.partidas_jugadas || 0;

                this.doubleJumpObtained = stats.doublejump_obtenido || false;
                this.chargedJumpObtained = stats.chargedjump_obtenido || false;
                this.dashObtained = stats.dash_obtenido || false;
                
                // Asignar mejor tiempo
                if (stats.record_personal && stats.record_personal.mejor_tiempo) {
                    const hours = stats.record_personal.mejor_tiempo.hours || 0;
                    const minutes = stats.record_personal.mejor_tiempo.minutes || 0;
                    const seconds = stats.record_personal.mejor_tiempo.seconds || 0;
                    
                    this.bestTime = (hours * 3600000) + (minutes * 60000) + (seconds * 1000);
                    if (this.bestTime === 0) this.bestTime = Infinity;
                }
                
                // Asignar mejor puntuación
                this.bestScore = stats.record_personal?.mejor_puntuacion || 0;
                
                // Asignar enemigos derrotados
                this.enemiesDefeated = stats.enemigos_derrotados || 0;
                
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('Error loading stats from server:', error);
            return { success: false, error: error.message };
        }
    }

    async setDoubleJumpObtained(obtained) {
        await this.initialized;
        this.doubleJumpObtained = obtained;
        await this.saveToServer();
    }
    
    async setChargedJumpObtained(obtained) {
        await this.initialized;
        this.chargedJumpObtained = obtained;
        await this.saveToServer();
    }
    
    async setDashObtained(obtained) {
        await this.initialized;
        this.dashObtained = obtained;
        await this.saveToServer();
    }
    
    async registrarPartida(tiempoJugado, muertes, completada, enemigosDefeated, puntuacion, tiempoCompletado) {
        await this.initialized; // Esperar a que se inicialicen las estadísticas
        
        try {
            const statsData = {
                id_usuario: this.userId,
                nombre_usuario: this.userName,
                tiempo_jugado: this.formatTime(tiempoJugado),
                muertes: muertes || 0,
                partida_completada: completada ? 1 : 0,
                enemigos_derrotados: enemigosDefeated || 0,
                puntuacion: puntuacion,
                tiempo_completado: completada ? this.formatTime(tiempoCompletado) : null,
                doublejump_obtenido: this.doubleJumpObtained,
                chargedjump_obtenido: this.chargedJumpObtained,
                dash_obtenido: this.dashObtained
            };
            
            const response = await fetch('/api/stats/increment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statsData)
            });
            
            if (!response.ok) {
                throw new Error(`Error al registrar partida: ${response.status}`);
            }
            
            // Recargar estadísticas para tener los valores actualizados
            await this.loadFromServer();
            
            return await response.json();
        } catch (error) {
            console.error('Error al registrar partida:', error);
            throw error;
        }
    }
}

// Auxiliary function to get the current user
function getCurrentUser() {
    let userId = localStorage.getItem('userId');
    let username = localStorage.getItem('username');

    // Only generate new IDs if they don't exist in localStorage
    if (!userId) {
        // Generate a numeric ID for new users
        userId = Math.floor(Math.random() * 100000);
        localStorage.setItem('userId', userId);
    } else {
        // Make sure it's a number when it's a number (localStorage stores everything as strings)
        if (!isNaN(parseInt(userId))) {
            userId = parseInt(userId);
        }
    }
    
    if (!username) {
        // Generate a username with a random number
        username = "Player_" + Math.floor(Math.random() * 10000);
        localStorage.setItem('username', username);
    }
    
    return {
        id_usuario: userId,
        nombre_usuario: username
    };
}




