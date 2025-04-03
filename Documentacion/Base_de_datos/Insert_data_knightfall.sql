
-- Inserts para la tabla Usuario
INSERT INTO Usuario (nombre_usuario, contraseña) VALUES 
('player1', 'pass123'),
('knight2022', 'secure456'),
('gameMaster', 'master789'),
('dragonSlayer', 'dragon123'),
('shadowKnight', 'shadow456');

-- Inserts para la tabla Jugador (corrigiendo el formato de TIMESTAMP)
INSERT INTO Jugador (id_usuario, velocidad, altura_salto, posicion_x, posicion_y, partidas_jugadas, partidas_completadas, saltos_hechos, enemigos_derrotados, mejor_tiempo, mejor_puntuacion, muertes, powerups_obtenidos) VALUES 
(1, 5.5, 3.2, 10.0, 15.0, 25, 18, 1500, 350, '2024-04-01 00:15:30', 8500, 30, 45),
(2, 6.0, 3.5, 8.5, 12.0, 15, 10, 800, 200, '2024-04-01 00:18:45', 6200, 20, 30),
(3, 5.8, 3.0, 12.0, 16.5, 30, 25, 2000, 500, '2024-04-01 00:12:15', 9800, 15, 60),
(4, 5.2, 2.8, 9.0, 14.0, 10, 8, 600, 150, '2024-04-01 00:20:30', 5500, 12, 25),
(5, 6.2, 3.8, 11.5, 18.0, 40, 32, 2500, 600, '2024-04-01 00:10:45', 12000, 25, 75);

-- Inserts para la tabla PowerUp (corrigiendo el formato de TIMESTAMP)
INSERT INTO PowerUp (tipo, tiempo_cooldown) VALUES 
('salto doble', '2024-04-01 00:00:15'),
('salto cargado', '2024-04-01 00:00:20'),
('dash', '2024-04-01 00:00:10'),
('salto doble', '2024-04-01 00:00:18'),
('salto cargado', '2024-04-01 00:00:25');

-- Inserts para la tabla Partida (corrigiendo el formato de TIMESTAMP)
INSERT INTO Partida (num_pantallas, tiempo) VALUES 
(5, '2024-04-01 00:10:30'),
(3, '2024-04-01 00:08:15'),
(7, '2024-04-01 00:15:45'),
(4, '2024-04-01 00:12:20'),
(6, '2024-04-01 00:14:10');

-- Inserts para la tabla Pantallas
INSERT INTO Pantallas (id_partida, plataformas, num_enemigos, posicion_powerup_x, posicion_powerup_y, posicion_powerup_booleano, tipo_powerup_booleano, valor_puntuacion) VALUES 
(1, 'plataforma_inicial,plataforma_media,plataforma_final', 3, 150.5, 80.5, 1, 1, 500),
(1, 'plataforma_inicial,plataforma_final', 4, 200.0, 90.0, 1, 0, 600),
(2, 'plataforma_inicial,plataforma_media,plataforma_alta', 2, 180.5, 85.0, 0, 1, 400),
(3, 'plataforma_inicial,plataforma_baja,plataforma_final', 5, 220.0, 75.5, 1, 1, 700),
(4, 'plataforma_inicial,plataforma_media', 3, 160.0, 70.0, 1, 0, 450);

-- Inserts para la tabla Plataforma
INSERT INTO Plataforma (id_pantalla, posicion_x, posicion_y, longitud, ancho) VALUES 
(1, 50.0, 30.0, 200, 20),
(1, 250.0, 60.0, 150, 20),
(1, 450.0, 90.0, 180, 20),
(2, 100.0, 40.0, 220, 20),
(2, 350.0, 80.0, 160, 20),
(3, 80.0, 35.0, 190, 20),
(3, 300.0, 70.0, 200, 20),
(4, 120.0, 45.0, 210, 20),
(5, 180.0, 50.0, 230, 20);

-- Inserts para la tabla Enemigo
INSERT INTO Enemigo (tipo, valor_puntuacion, posicion_x, posicion_y) VALUES 
('Esqueleto', 100, 150.0, 40.0),
('demonio', 200, 250.0, 70.0),
('Jumper', 150, 350.0, 100.0),
('Esqueleto', 100, 200.0, 50.0),
('demonio', 200, 300.0, 80.0),
('Jumper', 150, 400.0, 110.0),
('Esqueleto', 100, 180.0, 45.0);

-- Inserts para la tabla Jugador_PowerUp (corregido para evitar duplicados)
INSERT INTO Jugador_PowerUp (id_jugador, id_powerup) VALUES 
(1, 1),
(1, 3),
(2, 2),
(3, 2),
(3, 3),
(4, 2),
(5, 3);

-- Inserts para la tabla Partida_Jugador (corregido para evitar duplicados)
INSERT INTO Partida_Jugador (id_partida, id_jugador) VALUES 
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(2, 3),
(3, 5);

-- Inserts para la tabla Pantalla_Enemigo (corregido para evitar duplicados)
INSERT INTO Pantalla_Enemigo (id_pantalla, id_enemigo) VALUES 
(1, 1),
(1, 2),
(1, 3),
(2, 4),
(2, 5),
(3, 6),
(3, 7),
(4, 3),
(5, 4);

-- Inserts para la tabla Pantalla_PowerUp (corregido para evitar duplicados)
INSERT INTO Pantalla_PowerUp (id_pantalla, id_powerup) VALUES 
(1, 1),
(2, 2),
(3, 3),
(4, 1),
(5, 2);

-- Inserts para la tabla Puntuacion
INSERT INTO Puntuacion (total, puntos_thresholds, porcentaje_thresholds) VALUES 
(1500, '1500', '2.5%'),
(2200, '1500', '5%'),
(3500, '3000', '5%'),
(4800, '4500', '7.5%'),
(3200, '3000', '5%');
