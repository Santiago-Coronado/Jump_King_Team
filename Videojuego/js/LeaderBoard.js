document.addEventListener('DOMContentLoaded', function() {
    const contentArea = document.getElementById('content-area');
    const userInfo = document.getElementById('user-info');
    
    // Obtener ID de usuario (si existe)
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    // Mostrar la plantilla de estadísticas
    const statsTemplate = document.getElementById('stats-template');
    contentArea.innerHTML = '';
    contentArea.appendChild(statsTemplate.content.cloneNode(true));
    
    if (userId && username) {
        // Usuario conectado - mostrar su nombre y cargar estadísticas del servidor
        userInfo.innerHTML = `Jugador: <span class="username">${username}</span>`;
        loadUserStats(userId);
    } else {
        // Usuario no conectado - mostrar estadísticas locales
        userInfo.innerHTML = `Jugador: <span class="username">Anónimo</span> <small>(estadísticas guardadas localmente)</small>`;
        loadLocalStats();
    }
    // Load leaderboard for all users
    loadLeaderboard();
});

// Cargar estadísticas desde localStorage
function loadLocalStats() {
    try {
        const savedStats = localStorage.getItem('knightsfall_stats');
        
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            updateStatsDisplay(stats);
        } else {
            // No hay estadísticas guardadas
            document.getElementById('tiempo-total').textContent = '00h 00m 00s';
            document.getElementById('partidas-jugadas').textContent = '0';
            document.getElementById('partidas-completadas').textContent = '0';
            document.getElementById('muertes').textContent = '0';
            document.getElementById('enemigos-derrotados').textContent = '0';
            document.getElementById('mejor-tiempo').textContent = 'N/A';
            document.getElementById('mejor-puntuacion').textContent = '0';
            
            document.getElementById('historial-content').innerHTML = 
                '<p>No hay historial de partidas disponible.</p>';
        }
    } catch (error) {
        console.error('Error al cargar estadísticas locales:', error);
        document.getElementById('content-area').innerHTML = `
            <div class="error-message">
                Error al cargar estadísticas locales: ${error.message}
            </div>
        `;
    }
}

function saveStatsToLocalStorage(stats) {
    try {
        localStorage.setItem('knightsfall_stats', JSON.stringify(stats));
        console.log('Stats saved to localStorage:', stats);
    } catch (error) {
        console.error('Error saving stats to localStorage:', error);
    }
}

// Modify your loadUserStats function:
async function loadUserStats(userId) {
    try {
        console.log('Loading stats for user ID:', userId);
        // Api request to get user stats
        const response = await fetch(`/api/stats/${userId}`);
        
        if (!response.ok) {
            throw new Error(`Error al cargar estadísticas: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Server response:', data);
        
        if (data.success) {
            updateStatsDisplay(data.stats);
            // Save stats to localStorage as backup
            saveStatsToLocalStorage(data.stats);
        } else {
            throw new Error(data.message || 'Error desconocido al cargar estadísticas');
        }
    } catch (error) {
        console.error('Error al cargar estadísticas del servidor:', error);
        // if there's an error loading from the server, try to load local stats
        loadLocalStats();
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard');
        
        if (!response.ok) {
            throw new Error(`Error al cargar leaderboard: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.leaderboard) {
            displayLeaderboard(data.leaderboard);
        } else {
            throw new Error(data.message || 'Error desconocido al cargar leaderboard');
        }
    } catch (error) {
        console.error('Error al cargar leaderboard:', error);
        document.getElementById('leaderboard-content').innerHTML = 
            '<p class="error-message">No se pudo cargar el leaderboard.</p>';
    }
}

function displayLeaderboard(leaderboard) {
    if (!leaderboard || leaderboard.length === 0) {
        document.getElementById('leaderboard-content').innerHTML = 
            '<p>No hay datos de leaderboard disponibles.</p>';
        return;
    }
    
    const leaderboardTable = document.createElement('table');
    leaderboardTable.className = 'data-table';
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Posición', 'Jugador', 'Mejor Tiempo', 'Mejor Puntuación'];
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    leaderboardTable.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    leaderboard.forEach(player => {
        const row = document.createElement('tr');
        
        // Rank
        const rankCell = document.createElement('td');
        rankCell.textContent = player.rank;
        row.appendChild(rankCell);
        
        // Username
        const usernameCell = document.createElement('td');
        usernameCell.textContent = player.username;
        row.appendChild(usernameCell);
        
        // Best time
        const timeCell = document.createElement('td');
        timeCell.textContent = formatTimeDisplay(player.best_time);
        row.appendChild(timeCell);
        
        // Best score
        const scoreCell = document.createElement('td');
        scoreCell.textContent = player.best_score;
        row.appendChild(scoreCell);
        
        tbody.appendChild(row);
    });
    
    leaderboardTable.appendChild(tbody);
    document.getElementById('leaderboard-content').innerHTML = '';
    document.getElementById('leaderboard-content').appendChild(leaderboardTable);
}

function updateStatsDisplay(stats) {
    // Actualizar estadísticas generales
    document.getElementById('tiempo-total').textContent = formatTimeDisplay(stats.tiempo_total_jugado);
    document.getElementById('partidas-jugadas').textContent = stats.partidas_jugadas;
    document.getElementById('partidas-completadas').textContent = stats.partidas_completadas;
    document.getElementById('muertes').textContent = stats.muertes;
    document.getElementById('enemigos-derrotados').textContent = stats.enemigos_derrotados;
    
    // Actualizar récord personal
    document.getElementById('mejor-tiempo').textContent = 
        stats.record_personal.mejor_tiempo ? 
        formatTimeDisplay(stats.record_personal.mejor_tiempo) : 'N/A';
    document.getElementById('mejor-puntuacion').textContent = 
        stats.record_personal.mejor_puntaje || stats.record_personal.mejor_puntuacion || 0;
}

// Función para formatear tiempo en formato legible
function formatTimeDisplay(timeObj) {
    if (!timeObj) return 'N/A';
    
    const hours = timeObj.hours || 0;
    const minutes = timeObj.minutes || 0;
    const seconds = timeObj.seconds || 0;
    
    return `${hours}h ${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
}

// Función para formatear fecha
function formatDateDisplay(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date)) {
            return dateString; // Si no es una fecha válida, devolver el texto original
        }
        return date.toLocaleString();
    } catch (error) {
        return dateString;
    }
}