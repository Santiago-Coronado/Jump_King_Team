import express from 'express'
import fs from 'fs'
import mysql from 'mysql2/promise'

const app = express()
const port = 5000

app.use(express.json())
app.use('/html', express.static('../html'))
app.use('/js', express.static('../js'))
app.use('/css', express.static('../css'))
app.use('/Assets', express.static('../Assets'))
app.use('/GDD_Images', express.static('../GDD_Images'))
app.use('/html_Images', express.static('../html_Images'))

// Helper function to convert milliseconds to MySQL TIME format
function millisecondsToMySQLTime(milliseconds) {
    if (!milliseconds || milliseconds === Infinity) {
        return null;
    }
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Helper function to convert MySQL TIME to time object
function mysqlTimeToTimeObject(mysqlTime) {
    if (!mysqlTime) {
        return null;
    }
    
    // Parse MySQL TIME format (HH:MM:SS)
    const parts = mysqlTime.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    return {
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}

// Helper function to convert time string to seconds
function timeToSeconds(timeString) {
    if (!timeString) return 0;
    try {
        const parts = timeString.split(':');
        if (parts.length !== 3) return 0;
        return (parseInt(parts[0], 10) * 3600) + (parseInt(parts[1], 10) * 60) + parseInt(parts[2], 10);
    } catch (error) {
        console.error('Error convirtiendo tiempo a segundos:', error);
        return 0;
    }
}

// Helper function to convert seconds to time string
function secondsToTimeString(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function connectToKnightsFallDB(){
    return await mysql.createConnection({
        host:'localhost',
        user: 'Tony_pi',
        password: 'asdf1234',
        database: 'knightfalldb'
    });
}

// Routes definition and handling
app.get('/', (request, response) => {
    response.redirect('/html/PantallaPrincipal.html');
});

app.get('/api/stats/:userId', async (req, res) => {
    let connection = null;
    try{
        const userId = req.params.userId;
        console.log('Requested stats for user ID:', userId);

        if(!userId) {
            return res.status(400).json({success: false, message: "El ID de usuario es requerido"});
        }
        connection = await connectToKnightsFallDB();
        
        // First, look for user by ID or name
        const [userRows] = await connection.query(
            'SELECT * FROM JugadorEstadisticasCompletas WHERE nombre_usuario = ? OR id_usuario = ?',
            [userId, isNaN(parseInt(userId)) ? 0 : parseInt(userId)]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({success: false, message: "Usuario no encontrado"});
        }
        
        const dbUserId = userRows[0].id_usuario;
        const userName = userRows[0].nombre_usuario;
        
        // Then get the player stats using the user ID
        const [rows] = await connection.query('SELECT * FROM JugadorView WHERE id_usuario = ?', [dbUserId]);
        
        if(rows.length === 0) {
            // Return default stats if player record doesn't exist yet
            return res.json({
                success: true,
                stats: {
                    tiempo_total_jugado: {hours: 0, minutes: 0, seconds: 0},
                    muertes: 0,
                    partidas_completadas: 0,
                    partidas_jugadas: 0,
                    record_personal: {
                        mejor_tiempo: null,
                        mejor_puntuacion: 0,
                    },
                    enemigos_derrotados: 0,
                    doublejump_obtenido: false,
                    chargedjump_obtenido: false,
                    dash_obtenido: false
                },
                nombre_usuario: userName
            });
        }
        
        const stats = rows[0];
        const formattedStats = {
            tiempo_total_jugado: mysqlTimeToTimeObject(stats.tiempo_total_jugado) || {hours: 0, minutes: 0, seconds: 0},
            muertes: stats.muertes || 0,
            partidas_completadas: stats.partidas_completadas || 0,
            partidas_jugadas: stats.partidas_jugadas || 0,
            record_personal: {
                mejor_tiempo: mysqlTimeToTimeObject(stats.mejor_tiempo) || null,
                mejor_puntuacion: stats.mejor_puntuacion || 0,
            },
            enemigos_derrotados: stats.enemigos_derrotados || 0,
            doublejump_obtenido: stats.doublejump_obtenido === 1 || false,
            chargedjump_obtenido: stats.chargedjump_obtenido === 1 || false,
            dash_obtenido: stats.dash_obtenido === 1 || false
        };
        
        console.log('Returning stats for user:', userName, formattedStats);
        
        res.json({
            success: true,
            stats: formattedStats,
            nombre_usuario: userName
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({success: false, message: "Error interno del servidor"});
    }
    finally {
        if(connection) connection.end();
    }
});

//Update player stats
app.post('/api/stats/update', async (req, res) => {
    let connection = null;
    
    try {
        const { id_usuario, stats, nombre_usuario } = req.body;
        console.log('ID de usuario:', id_usuario);
        console.log('Estadísticas:', stats);
        
        if (!id_usuario || !stats) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario y estadísticas son requeridos"
            });
        }

        const userName = nombre_usuario || `Player_${String(id_usuario).substring(0, 5)}`;
        
        connection = await connectToKnightsFallDB();
        
        // First, check if the user exists in Usuario table by username
        const [userRows] = await connection.query(
            'SELECT * FROM usuarioIDView WHERE nombre_usuario = ?',
            [userName]
        );
        
        let userId;
        
        // If user doesn't exist, create it
        if (userRows.length === 0) {
            const [insertResult] = await connection.query(
                'INSERT INTO Usuario (nombre_usuario, contraseña) VALUES (?, ?)',
                [userName, 'default_password'] // Use a default password
            );
            userId = insertResult.insertId;
            console.log('Created new user with ID:', userId);
        } else {
            userId = userRows[0].id_usuario;
            console.log('Found existing user with ID:', userId);
        }
        
        // Now check if player stats exist
        const [playerRows] = await connection.query(
            'SELECT * FROM JugadorView WHERE id_usuario = ?',
            [userId]
        );
        
        if (playerRows.length === 0) {
            // Insert new player stats
            await connection.query(
                `INSERT INTO Jugador 
                (id_usuario, partidas_jugadas, partidas_completadas, enemigos_derrotados, 
                mejor_puntuacion, muertes, doublejump_obtenido, chargedjump_obtenido, dash_obtenido, mejor_tiempo, tiempo_total_jugado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,  
                    stats.partidas_jugadas || 0,
                    stats.partidas_completadas || 0,
                    stats.enemigos_derrotados || 0,
                    stats.record_personal?.mejor_puntuacion || 0,
                    stats.muertes || 0,
                    stats.doublejump_obtenido || false,
                    stats.chargedjump_obtenido || false,
                    stats.dash_obtenido || false,
                    millisecondsToMySQLTime(stats.record_personal?.mejor_tiempo?
                        (stats.record_personal.mejor_tiempo.hours * 3600000 + 
                        stats.record_personal.mejor_tiempo.minutes * 60000 + 
                        stats.record_personal.mejor_tiempo.seconds * 1000) : null),
                    millisecondsToMySQLTime(stats.tiempo_total_jugado ? 
                        (stats.tiempo_total_jugado.hours * 3600000 + 
                            stats.tiempo_total_jugado.minutes * 60000 + 
                            stats.tiempo_total_jugado.seconds * 1000) : 0)
                ]
            );
            console.log('Created new player stats record');
        } else {
            // Update existing player stats
            await connection.query(
                `UPDATE Jugador SET 
                partidas_jugadas = ?,
                partidas_completadas = ?,
                enemigos_derrotados = ?,
                mejor_puntuacion = ?,
                muertes = ?,
                doublejump_obtenido = ?,
                chargedjump_obtenido = ?,
                dash_obtenido = ?,
                mejor_tiempo = ?,
                tiempo_total_jugado = ?
                WHERE id_usuario = ?`,
                [
                    stats.partidas_jugadas || 0,
                    stats.partidas_completadas || 0,
                    stats.enemigos_derrotados || 0,
                    stats.record_personal?.mejor_puntuacion || 0,
                    stats.muertes || 0,
                    stats.doublejump_obtenido || false,
                    stats.chargedjump_obtenido || false,
                    stats.dash_obtenido || false,
                    millisecondsToMySQLTime(stats.record_personal?.mejor_tiempo ? 
                        (stats.record_personal.mejor_tiempo.hours * 3600000 + 
                         stats.record_personal.mejor_tiempo.minutes * 60000 + 
                         stats.record_personal.mejor_tiempo.seconds * 1000) : null),
                    millisecondsToMySQLTime(stats.tiempo_total_jugado ? 
                        (stats.tiempo_total_jugado.hours * 3600000 + 
                         stats.tiempo_total_jugado.minutes * 60000 + 
                         stats.tiempo_total_jugado.seconds * 1000) : 0),
                    userId
                ]
            );
            console.log('Updated existing player stats record');
        }
        
        res.json({
            success: true,
            message: "Estadísticas actualizadas correctamente",
            userId: userId,  // Return the database ID to the client
            userName: userName
        });
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
        res.status(500).json({
            success: false,
            message: "Error en el servidor"
        });
    } finally {
        if (connection) {
            connection.end();
            console.log('Conexión cerrada');
        }
    }
});

// Increment player stats
app.post('/api/stats/increment', async (req, res) => {
    let connection = null;
    
    try {
        const { 
            id_usuario, 
            nombre_usuario,
            tiempo_jugado, 
            muertes, 
            partida_completada, 
            enemigos_derrotados, 
            puntuacion,
            tiempo_completado,
            doublejump_obtenido,
            chargedjump_obtenido,
            dash_obtenido
        } = req.body;
        
        console.log('Registrando partida para usuario:', id_usuario);
        console.log('Datos recibidos:', {
            tiempo_jugado,
            muertes,
            partida_completada,
            enemigos_derrotados,
            puntuacion,
            tiempo_completado,
            doublejump_obtenido,
            chargedjump_obtenido,
            dash_obtenido
        });
        
        if (!id_usuario) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario es requerido"
            });
        }

        const userName = nombre_usuario || `Player_${String(id_usuario).substring(0, 5)}`;
        
        connection = await connectToKnightsFallDB();
        
        // First, get or create Usuario
        const [userRows] = await connection.query(
            'SELECT * FROM UsuarioIDView WHERE nombre_usuario = ?',
            [userName]
        );
        
        let userId;
        
        if (userRows.length === 0) {
            const [insertResult] = await connection.query(
                'INSERT INTO Usuario (nombre_usuario, contraseña) VALUES (?, ?)',
                [userName, 'default_password']
            );
            userId = insertResult.insertId;
        } else {
            userId = userRows[0].id_usuario;
        }
        
        // Then look for existing player stats
        const [playerRows] = await connection.query(
            'SELECT * FROM JugadorView WHERE id_usuario = ?',
            [userId]
        );
        
        // Time format for MySQL
        const tiempoJugadoSQL = tiempo_jugado ? 
            `${String(tiempo_jugado.hours).padStart(2, '0')}:${String(tiempo_jugado.minutes).padStart(2, '0')}:${String(tiempo_jugado.seconds).padStart(2, '0')}` : 
            '00:00:00';

        // Time completed for MySQL
        const tiempoCompletadoSQL = partida_completada && tiempo_completado ? 
            `${String(tiempo_completado.hours).padStart(2, '0')}:${String(tiempo_completado.minutes).padStart(2, '0')}:${String(tiempo_completado.seconds).padStart(2, '0')}` : 
            null;
            
        console.log('Tiempo jugado SQL:', tiempoJugadoSQL);
        console.log('Tiempo completado SQL:', tiempoCompletadoSQL);
        
        if (playerRows.length === 0) {
            // Create new player record
            console.log('Creando nuevo jugador con tiempos iniciales');
            await connection.query(
                `INSERT INTO Jugador 
                (id_usuario, partidas_jugadas, partidas_completadas, enemigos_derrotados, 
                mejor_puntuacion, muertes, doublejump_obtenido, chargedjump_obtenido, dash_obtenido,
                mejor_tiempo, tiempo_total_jugado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    1,  // First game
                    partida_completada ? 1 : 0,
                    enemigos_derrotados || 0,
                    puntuacion || 0,  // Always save score regardless of completion
                    muertes || 0,
                    doublejump_obtenido || false,
                    chargedjump_obtenido || false,
                    dash_obtenido || false,
                    tiempoCompletadoSQL,
                    tiempoJugadoSQL
                ]
            );
        } else {
            // Update existing player stats
            console.log('Actualizando jugador existente');
            const updateQuery = `
                UPDATE Jugador SET 
                partidas_jugadas = partidas_jugadas + 1,
                partidas_completadas = partidas_completadas + ?,
                enemigos_derrotados = enemigos_derrotados + ?,
                mejor_puntuacion = GREATEST(IFNULL(mejor_puntuacion, 0), ?),
                muertes = muertes + ?,
                mejor_tiempo = CASE
                    WHEN mejor_tiempo IS NULL OR ? < mejor_tiempo THEN ?
                    ELSE mejor_tiempo
                END,
                tiempo_total_jugado = ?,
                doublejump_obtenido = GREATEST(doublejump_obtenido, ?),
                chargedjump_obtenido = GREATEST(chargedjump_obtenido, ?),
                dash_obtenido = GREATEST(dash_obtenido, ?)
                WHERE id_usuario = ?`;
                
            console.log('SQL query:', updateQuery);
            
            // Calculate total time
            const [currentTimeRow] = await connection.query(
                'SELECT * FROM TiempoJugadoView WHERE id_usuario = ?',
                [userId]
            );
            
            let newTotalTime;
            if (currentTimeRow[0] && currentTimeRow[0].tiempo_total_jugado) {
                // Convert current DB time to seconds
                const currentTimeSeconds = timeToSeconds(currentTimeRow[0].tiempo_total_jugado);
                
                // Convert session time to seconds
                const sessionTimeSeconds = tiempo_jugado ? 
                    (tiempo_jugado.hours * 3600) + (tiempo_jugado.minutes * 60) + tiempo_jugado.seconds : 0;
                
                // Add them together
                const totalSeconds = currentTimeSeconds + sessionTimeSeconds;
                
                // Convert back to HH:MM:SS
                newTotalTime = secondsToTimeString(totalSeconds);
                
                console.log('Tiempo actual (segundos):', currentTimeSeconds);
                console.log('Tiempo añadido (segundos):', sessionTimeSeconds);
                console.log('Total (segundos):', totalSeconds);
                console.log('Nuevo tiempo total calculado:', newTotalTime);
            } else {
                // Si no hay tiempo existente, usamos el tiempo de esta partida
                newTotalTime = tiempoJugadoSQL;
                console.log('No hay tiempo previo, usando:', newTotalTime);
            }
            
            await connection.query(
                updateQuery,
                [ 
                    partida_completada ? 1 : 0,
                    enemigos_derrotados || 0,
                    puntuacion || 0,  // Always update best score regardless of completion
                    muertes || 0,
                    partida_completada ? tiempoCompletadoSQL : null,
                    partida_completada ? tiempoCompletadoSQL : null,
                    newTotalTime,
                    doublejump_obtenido ? 1 : 0,
                    chargedjump_obtenido ? 1 : 0,
                    dash_obtenido ? 1 : 0,
                    userId
                ]
            );
        }
        
        // Insert into Partida
        const [partidaResult] = await connection.query(
            `INSERT INTO Partida (puntuacion, tiempo, duracion_segundos) 
             VALUES (?, ?, ?)`,
            [
                puntuacion || 0,
                tiempoCompletadoSQL,
                tiempo_jugado ? (tiempo_jugado.hours * 3600 + tiempo_jugado.minutes * 60 + tiempo_jugado.seconds) : 0
            ]
        );
        
        const partidaId = partidaResult.insertId;
        
        // Get the player's id_jugador
        const [jugadorRow] = await connection.query(
            'SELECT * FROM JugadorIDView WHERE id_usuario = ?', 
            [userId]
        );
        
        const jugadorId = jugadorRow[0].id_jugador;
        
        // Insert into Partida_Jugador junction table
        await connection.query(
            `INSERT INTO Partida_Jugador (id_partida, id_jugador) 
             VALUES (?, ?)`,
            [partidaId, jugadorId]
        );
        
        // Check if the player record was updated correctly
        const [updatedPlayerRow] = await connection.query(
            'SELECT * FROM VerificacionActualizacionView WHERE id_usuario = ?',
            [userId]
        );
        
        console.log('Valores actualizados:', {
            tiempo_total_jugado: updatedPlayerRow[0].tiempo_total_jugado,
            mejor_tiempo: updatedPlayerRow[0].mejor_tiempo,
            mejor_puntuacion: updatedPlayerRow[0].mejor_puntuacion,
            doublejump_obtenido: updatedPlayerRow[0].doublejump_obtenido,
            chargedjump_obtenido: updatedPlayerRow[0].chargedjump_obtenido,
            dash_obtenido: updatedPlayerRow[0].dash_obtenido
        });
        
        res.json({
            success: true,
            message: "Partida registrada correctamente",
            userId: userId,
            userName: userName
        });
    } catch (error) {
        console.error('Error al registrar partida:', error);
        console.error('Detalles del error:', error.stack);
        res.status(500).json({
            success: false,
            message: "Error en el servidor: " + error.message
        });
    } finally {
        if (connection) {
            connection.end();
            console.log('Conexión cerrada');
        }
    }
});


// Get leaderboard data
app.get('/api/leaderboard', async (req, res) => {
    let connection = null;
    
    try {
        connection = await connectToKnightsFallDB();
        
        // Query to get top 5 players by completed games with best time and score
        const [rows] = await connection.query(`
            SELECT * FROM LeaderboardView LIMIT 5
        `);
        
        // Format the leaderboard data
        const leaderboard = rows.map((player, index) => {
            return {
                rank: index + 1,
                username: player.nombre_usuario,
                best_time: mysqlTimeToTimeObject(player.mejor_tiempo),
                best_score: player.mejor_puntuacion,
            };
        });
        
        res.json({
            success: true,
            leaderboard: leaderboard
        });
    } catch (error) {
        console.error('Error al obtener leaderboard:', error);
        res.status(500).json({
            success: false,
            message: "Error al obtener el leaderboard"
        });
    } finally {
        if (connection) connection.end();
    }
});
// Añade este endpoint a tu archivo stats.js

// Get graph data for leaderboard visualization
app.get('/api/leaderboard/graph', async (req, res) => {
    let connection = null;
    
    try {
        connection = await connectToKnightsFallDB();
        
        // Query to get top 5 players by completed games with best time and score
        const [rows] = await connection.query(`
            SELECT * FROM LeaderboardView 
        `);
        
        // Format the data for the graph
        const graphData = rows.map(player => {
            // Convert MySQL time (HH:MM:SS) to total seconds for X-axis
            let totalSeconds = 0;
            if (player.mejor_tiempo) {
                const timeParts = player.mejor_tiempo.split(':');
                totalSeconds = parseInt(timeParts[0]) * 3600 + 
                               parseInt(timeParts[1]) * 60 + 
                               parseInt(timeParts[2]);
            }
            
            // Format time for tooltip display
            const timeObj = mysqlTimeToTimeObject(player.mejor_tiempo);
            const timeFormatted = timeObj ? 
                `${timeObj.hours}h ${timeObj.minutes}m ${timeObj.seconds}s` : 
                'N/A';
            
            return {
                x: totalSeconds,               // X-axis: tiempo en segundos (menor es mejor)
                y: player.mejor_puntuacion,    // Y-axis: puntuación (mayor es mejor)
                username: player.nombre_usuario,
                timeFormatted: timeFormatted
            };
        });
        
        res.json({
            success: true,
            graphData: graphData
        });
    } catch (error) {
        console.error('Error al obtener datos para gráfica:', error);
        res.status(500).json({
            success: false,
            message: "Error al obtener datos para la gráfica"
        });
    } finally {
        if (connection) connection.end();
    }
});


app.get('/api/auth/daily-logins', async (req, res) => {
    let connection = null;
    try {
        connection = await connectToKnightsFallDB();

        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6); 
        
        const formatSQLDate = (date) => {
            return date.toISOString().split('T')[0];
        };
        
        const startDate = formatSQLDate(sevenDaysAgo);
        const endDate = formatSQLDate(today);
        
        
        const [rows] = await connection.query(`
            SELECT
                DATE(fecha_login) AS fecha,
                COUNT(DISTINCT id_usuario) AS usuarios_conectados
            FROM
                Login_History
            WHERE
                DATE(fecha_login) >= DATE(?) AND DATE(fecha_login) <= DATE(?)
            GROUP BY
                DATE(fecha_login)
            ORDER BY
                fecha ASC
        `, [startDate, endDate]);

        
        // Crear un array con todas las fechas en el rango (7 días)
        const dateRange = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(sevenDaysAgo);
            date.setDate(sevenDaysAgo.getDate() + i);
            dateRange.push({
                fecha: formatSQLDate(date),
                usuarios_conectados: 0 
            });
        }
        
        // Reemplazar con datos reales donde existan
        const usersByDate = {};
        rows.forEach(row => {
            const fechaStr = row.fecha instanceof Date ? formatSQLDate(row.fecha) : String(row.fecha);
            const usuarios = parseInt(row.usuarios_conectados);
            usersByDate[fechaStr] = isNaN(usuarios) ? 0 : usuarios;
        });
        
        // Combinar con el rango completo de fechas
        const completeData = dateRange.map(item => {
            return {
                fecha: item.fecha,
                usuarios_conectados: usersByDate[item.fecha] || 0
            };
        });
        
        console.log('Datos finales enviados al cliente:', completeData);
        
        res.json({
            success: true,
            dailyLogins: completeData
        });
    } catch (error) {
        console.error('Error al obtener los usuarios únicos por día:', error);
        console.error('Detalles del error:', error.stack);
        res.status(500).json({
            success: false,
            message: "Error al obtener los datos de usuarios únicos por día: " + error.message
        });
    } finally {
        if (connection) connection.end();
    }
});

app.get('/api/powerups/stats', async (req, res) => {
    let connection = null;
    
    try {
        connection = await connectToKnightsFallDB();
        
        // Query to get power-up stats
        const [rows] = await connection.query(`
            SELECT 
                SUM(CASE WHEN doublejump_obtenido = 1 THEN 1 ELSE 0 END) as doublejump_count,
                SUM(CASE WHEN chargedjump_obtenido = 1 THEN 1 ELSE 0 END) as chargedjump_count,
                SUM(CASE WHEN dash_obtenido = 1 THEN 1 ELSE 0 END) as dash_count,
                COUNT(*) as total_players
            FROM Jugador
            WHERE id_jugador IS NOT NULL
        `);
        
        if (rows.length === 0 || !rows[0].total_players) {
            return res.json({
                success: true,
                powerupStats: {
                    labels: ['Double Jump', 'Charged Jump', 'Dash'],
                    percentages: [0, 0, 0],
                    counts: [0, 0, 0],
                    totalPlayers: 0
                }
            });
        }
        
        const stats = rows[0];
        const totalPlayers = stats.total_players || 0;
        
        // Calculate percentages
        const powerupStats = {
            labels: ['Double Jump', 'Charged Jump', 'Dash'],
            percentages: [
                totalPlayers > 0 ? Math.round((stats.doublejump_count / totalPlayers) * 100) : 0,
                totalPlayers > 0 ? Math.round((stats.chargedjump_count / totalPlayers) * 100) : 0,
                totalPlayers > 0 ? Math.round((stats.dash_count / totalPlayers) * 100) : 0
            ],
            counts: [
                stats.doublejump_count || 0,
                stats.chargedjump_count || 0,
                stats.dash_count || 0
            ],
            totalPlayers: totalPlayers
        };
        
        res.json({
            success: true,
            powerupStats: powerupStats
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de power-ups:', error);
        res.status(500).json({
            success: false,
            message: "Error al obtener estadísticas de power-ups"
        });
    } finally {
        if (connection) connection.end();
    }
});


/* Login stuff */
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    let connection = null;
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Usuario y contraseña son requeridos"
        });
      }
      
      connection = await connectToKnightsFallDB();
      
      // Find user in database
      const [users] = await connection.query(
        'SELECT * FROM AutenticacionUsuarioView WHERE nombre_usuario = ?',
        [username]
      );
      
      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas"
        });
      }
      
      const user = users[0];
      
      // Password check 
      if (password === user.contraseña) {
        // Update last login time directly
        await connection.query(
            'UPDATE Usuario SET ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = ?',
            [user.id_usuario]
          );
        return res.json({
          success: true,
          userId: user.id_usuario,
          userName: user.nombre_usuario
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Contraseña incorrecta"
        });
      }
    } catch (error) {
      console.error('Error de login:', error);
      res.status(500).json({
        success: false,
        message: "Error en el servidor"
      });
    } finally {
      if (connection) connection.end();
    }
  });
  
  // Registration endpoint
  app.post('/api/auth/register', async (req, res) => {
    let connection = null;
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Usuario y contraseña son requeridos"
        });
      }
      
      connection = await connectToKnightsFallDB();
      
      // Check if user already exists
      const [existingUsers] = await connection.query(
        'SELECT * FROM UsuarioIDView WHERE nombre_usuario = ?',
        [username]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "El usuario ya existe"
        });
      }
      
      // Create new user with plain text password
      const [result] = await connection.query(
        'INSERT INTO Usuario (nombre_usuario, contraseña) VALUES (?, ?)',
        [username, password]
      );
      
      res.json({
        success: true,
        userId: result.insertId,
        userName: username
      });
    } catch (error) {
      console.error('Error de registro:', error);
      res.status(500).json({
        success: false,
        message: "Error en el servidor"
      });
    } finally {
      if (connection) connection.end();
    }
  });



  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
});