-- CREACIÓN DE BASE DE DATOS COMIENZA AQUÍ

-- Crear base de datos y usarla
CREATE DATABASE IF NOT EXISTS KnightFallDB_V2;
USE KnightFallDB_V2;

-- Tabla Usuario
CREATE TABLE Usuario (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    contraseña VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- Tabla Jugador (sin power-ups globales)
CREATE TABLE Jugador (
    id_jugador INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    partidas_jugadas INT UNSIGNED DEFAULT 0,
    partidas_completadas INT UNSIGNED DEFAULT 0,
    enemigos_derrotados INT UNSIGNED DEFAULT 0,
    mejor_tiempo TIME,
    mejor_puntuacion INT,
    muertes INT DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
) ENGINE=InnoDB;

-- Tabla Partida
CREATE TABLE Partida (
    id_partida INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    puntuacion INT,
    tiempo TIME,
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    duracion_segundos INT
) ENGINE=InnoDB;

-- Tabla intermedia Partida_Jugador con powerups obtenidos en esa partida
CREATE TABLE Partida_Jugador (
    id_partida INT UNSIGNED,
    id_jugador INT UNSIGNED,
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    powerups_obtenidos JSON DEFAULT NULL,  -- Aquí se guardarán los power-ups obtenidos en la partida
    PRIMARY KEY (id_partida, id_jugador),
    FOREIGN KEY (id_partida) REFERENCES Partida(id_partida),
    FOREIGN KEY (id_jugador) REFERENCES Jugador(id_jugador)
) ENGINE=InnoDB;

-- INSERCIÓN DE DATOS DE PRUEBA COMIENZA AQUÍ

-- Insertar usuarios
INSERT INTO Usuario (nombre_usuario, contraseña) VALUES
('juanD', '1234pass'),
('lupita99', 'securepass'),
('elgamer', 'g4m3r');

-- Insertar jugadores (sin campo de power-ups globales)
INSERT INTO Jugador (id_usuario, partidas_jugadas, partidas_completadas, enemigos_derrotados, mejor_tiempo, mejor_puntuacion, muertes) VALUES
(1, 10, 7, 130, '00:04:35', 9000, 3),
(2, 5, 5, 70, '00:03:50', 8700, 2),
(3, 2, 1, 15, '00:08:10', 3000, 5);

-- Insertar partidas
INSERT INTO Partida (puntuacion, tiempo) VALUES
(8500, '00:05:00'),
(8700, '00:04:40'),
(3000, '00:09:10');

-- Insertar registros de Partida_Jugador con power-ups obtenidos en la partida
INSERT INTO Partida_Jugador (id_partida, id_jugador, powerups_obtenidos) VALUES
(1, 1, '["dash", "charged"]'),
(2, 2, '["double"]'),
(3, 3, '["dash", "double", "charged"]');

-- CONSULTAS COMIENZAN AQUÍ

-- Consultar power-ups obtenidos en cada partida, junto al jugador y la partida
SELECT pj.id_partida, pj.id_jugador, pj.powerups_obtenidos, p.puntuacion
FROM Partida_Jugador pj
JOIN Partida p ON pj.id_partida = p.id_partida;

-- Buscar partidas en las que el jugador obtuvo el power-up "dash"
SELECT *
FROM Partida_Jugador
WHERE JSON_CONTAINS(powerups_obtenidos, '"dash"');

-- Consultar información del jugador (sin power-ups globales)
SELECT u.nombre_usuario, j.partidas_jugadas, j.enemigos_derrotados
FROM Jugador j
JOIN Usuario u ON j.id_usuario = u.id_usuario;