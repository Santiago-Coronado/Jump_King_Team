-- CREACIÓN DE BASE DE DATOS COMIENZA AQUÍ

-- Crear base de datos y usarla
CREATE DATABASE IF NOT EXISTS KnightFallDB;
USE KnightFallDB;

-- Tabla Usuario
CREATE TABLE Usuario (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    contraseña VARCHAR(255) NOT NULL
) ENGINE=InnoDB CHARSET = utf8mb4;

-- Tabla Jugador con powerups globales
CREATE TABLE Jugador (
    id_jugador INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    partidas_jugadas INT UNSIGNED DEFAULT 0,
    partidas_completadas INT UNSIGNED DEFAULT 0,
    enemigos_derrotados INT UNSIGNED DEFAULT 0,
    mejor_tiempo TIME,
    mejor_puntuacion INT,
    muertes INT DEFAULT 0,
    doublejump_obtenido BOOLEAN,
    chargedjump_obtenido BOOLEAN,
    dash_obtenido BOOLEAN,
    CONSTRAINT fk_usuario_jugador
        FOREIGN KEY (id_usuario)
        REFERENCES Usuario(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- Tabla Partida
CREATE TABLE Partida (
    id_partida INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    puntuacion INT,
    tiempo TIME,
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    duracion_segundos INT
) ENGINE=InnoDB CHARSET=utf8mb4;

-- Tabla intermedia Partida_Jugador
CREATE TABLE Partida_Jugador (
    id_partida INT UNSIGNED,
    id_jugador INT UNSIGNED,
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_partida, id_jugador),
    CONSTRAINT fk_partida
        FOREIGN KEY (id_partida)
        REFERENCES Partida(id_partida)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
	CONSTRAINT fk_jugador
        FOREIGN KEY (id_jugador)
        REFERENCES Jugador(id_jugador)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB CHARSET=utf8mb4;

-- CONSULTAS COMIENZAN AQUÍ

-- Consultar jugadores y sus power-ups globales 
SELECT u.nombre_usuario, j.doublejump_obtenido, j.chargedjump_obtenido, j.dash_obtenido
FROM KnightFallDB.Jugador j
INNER JOIN KnightFallDB.Usuario u USING (id_usuario);

-- Consultar partidas y a qué jugador pertenecen
SELECT pj.id_partida, pj.id_jugador, p.puntuacion
FROM KnightFallDB.Partida_Jugador pj
JOIN KnightFallDB.Partida p USING (id_partida);

-- Consultar partidas y a qué jugador pertenecen 
SELECT pj.id_partida, pj.id_jugador, p.puntuacion, u.nombre_usuario
FROM KnightFallDB.Partida_Jugador pj
JOIN KnightFallDB.Partida AS p USING (id_partida)
JOIN KnightFallDB.Jugador AS j USING (id_jugador)
JOIN KnightFallDB.Usuario AS u USING (id_usuario);

-- Buscar jugadores que hayan desbloqueado "dash"
SELECT * FROM KnightFallDB.Jugador
WHERE KnightFallDB.Jugador.dash_obtenido = TRUE;

-- Buscar jugadores que hayan desbloqueado "dash" 
SELECT j.id_jugador, u.nombre_usuario, j.partidas_completadas, j.mejor_puntuacion
FROM KnightFallDB.Jugador AS j
JOIN KnightFallDB.Usuario AS u USING (id_usuario)
WHERE j.dash_obtenido = TRUE;