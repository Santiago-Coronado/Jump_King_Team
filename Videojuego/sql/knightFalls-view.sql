USE knightfalldb;
CREATE VIEW LeaderboardView AS
SELECT 
    u.id_usuario,
    u.nombre_usuario,
    j.mejor_tiempo,
    j.mejor_puntuacion,
    j.partidas_completadas
FROM 
    Jugador j
JOIN 
    Usuario u ON j.id_usuario = u.id_usuario
WHERE 
    j.partidas_completadas > 0 
    AND j.mejor_tiempo IS NOT NULL
ORDER BY 
    j.mejor_tiempo ASC, 
    j.mejor_puntuacion DESC;

-- Vista para estadísticas completas de jugador
CREATE VIEW JugadorEstadisticasCompletas AS
SELECT 
    u.id_usuario,
    u.nombre_usuario,
    j.tiempo_total_jugado,
    j.muertes,
    j.partidas_completadas,
    j.partidas_jugadas,
    j.mejor_tiempo,
    j.mejor_puntuacion,
    j.enemigos_derrotados,
    j.doublejump_obtenido,
    j.chargedjump_obtenido,
    j.dash_obtenido
FROM 
    Jugador j
JOIN 
    Usuario u ON j.id_usuario = u.id_usuario;