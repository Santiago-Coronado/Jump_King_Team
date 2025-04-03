-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS KnightsFall;
USE KnightsFall;

-- Tabla Usuario
CREATE TABLE Usuario (
    id_usuario INT UNSIGNED AUTO_INCREMENT NOT NULL,
    nombre_usuario VARCHAR(20) NOT NULL,
    contraseña VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Jugador
CREATE TABLE Jugador (
    id_jugador INT UNSIGNED AUTO_INCREMENT NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    velocidad FLOAT,
    altura_salto FLOAT,
    posicion_x FLOAT,
    posicion_y FLOAT,
    partidas_jugadas INT,
    partidas_completadas INT,
    saltos_hechos INT,
    enemigos_derrotados INT,
    mejor_tiempo TIMESTAMP,
    mejor_puntuacion INT,
    muertes INT,
    powerups_obtenidos INT,
    PRIMARY KEY (id_jugador),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla PowerUp
CREATE TABLE PowerUp (
    id_powerup INT UNSIGNED AUTO_INCREMENT NOT NULL,
    tipo ENUM('salto doble', 'salto cargado', 'dash') NOT NULL,
    tiempo_cooldown TIMESTAMP,
    PRIMARY KEY (id_powerup)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relación Jugador - PowerUp
CREATE TABLE Jugador_PowerUp (
    id_jugador INT UNSIGNED NOT NULL,
    id_powerup INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_jugador, id_powerup),
    FOREIGN KEY (id_jugador) REFERENCES Jugador(id_jugador),
    FOREIGN KEY (id_powerup) REFERENCES PowerUp(id_powerup)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Partida
CREATE TABLE Partida (
    id_partida INT UNSIGNED AUTO_INCREMENT NOT NULL,
    id_puntuacion INT UNSIGNED,
    num_pantallas INT,
    tiempo TIMESTAMP,
    PRIMARY KEY (id_partida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relación Partida - Jugador
CREATE TABLE Partida_Jugador (
    id_partida INT UNSIGNED NOT NULL,
    id_jugador INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_partida, id_jugador),
    FOREIGN KEY (id_partida) REFERENCES Partida(id_partida),
    FOREIGN KEY (id_jugador) REFERENCES Jugador(id_jugador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Pantallas
CREATE TABLE Pantallas (
    id_pantalla INT UNSIGNED AUTO_INCREMENT NOT NULL,
    id_partida INT UNSIGNED NOT NULL,
    plataformas TEXT,
    num_enemigos INT,
    posicion_powerup_x FLOAT,
    posicion_powerup_y FLOAT,
    posicion_powerup_booleano TINYINT,
    tipo_powerup_booleano TINYINT,
    valor_puntuacion INT,
    PRIMARY KEY (id_pantalla),
    FOREIGN KEY (id_partida) REFERENCES Partida(id_partida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Plataforma
CREATE TABLE Plataforma (
    id_plataforma INT UNSIGNED AUTO_INCREMENT NOT NULL,
    id_pantalla INT UNSIGNED NOT NULL,
    posicion_x FLOAT,
    posicion_y FLOAT,
    longitud INT,
    ancho INT,
    PRIMARY KEY (id_plataforma),
    FOREIGN KEY (id_pantalla) REFERENCES Pantallas(id_pantalla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Enemigo
CREATE TABLE Enemigo (
    id_enemigo INT UNSIGNED AUTO_INCREMENT NOT NULL,
    tipo ENUM('Esqueleto', 'demonio', 'Jumper') NOT NULL,
    valor_puntuacion INT,
    posicion_x FLOAT,
    posicion_y FLOAT,
    PRIMARY KEY (id_enemigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relación Pantalla - Enemigo
CREATE TABLE Pantalla_Enemigo (
    id_pantalla INT UNSIGNED NOT NULL,
    id_enemigo INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_pantalla, id_enemigo),
    FOREIGN KEY (id_pantalla) REFERENCES Pantallas(id_pantalla),
    FOREIGN KEY (id_enemigo) REFERENCES Enemigo(id_enemigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Relación Pantalla - PowerUp
CREATE TABLE Pantalla_PowerUp (
    id_pantalla INT UNSIGNED NOT NULL,
    id_powerup INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_pantalla, id_powerup),
    FOREIGN KEY (id_pantalla) REFERENCES Pantallas(id_pantalla),
    FOREIGN KEY (id_powerup) REFERENCES PowerUp(id_powerup)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla Puntuación
CREATE TABLE Puntuacion (
    id_puntuacion INT UNSIGNED AUTO_INCREMENT NOT NULL,
    id_pantalla INT UNSIGNED,
    total INT,
    puntos_thresholds ENUM('1500', '3000', '4500'),
    porcentaje_thresholds ENUM('2.5%', '5%', '7.5%'),
    PRIMARY KEY (id_puntuacion),
    FOREIGN KEY (id_pantalla) REFERENCES Pantallas(id_pantalla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;