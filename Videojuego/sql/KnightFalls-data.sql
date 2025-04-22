-- INSERCIÓN DE DATOS DE PRUEBA COMIENZA AQUÍ
-- Datos de prueba
INSERT INTO Usuario (nombre_usuario, contraseña) VALUES
('juanD', '1234pass'),
('lupita99', 'securepass'),
('elgamer', 'g4m3r'),
('maria22', 'myp@ssword'),
('carlosM', 'carlos123'),
('ana_smith', 'anita2023'),
('pabloG', 'p@bloG#'),
('sofia_tech', 's0f1@T3ch'),
('alejandroR', 'Alejandro99'),
('laura_moon', 'lauraMoon!'),
('david_pro', 'd@v1dPr0'),
('isabel_sky', 'skyIsabel2023'),
('miguelH', 'miguelH#123'),
('elena_v', '3l3n@V!'),
('robertoK', 'r0b3rt0K'),
('paty_g', 'p@tyG2023'),
('fernandoT', 'f3rn4nd0T'),
('gabrielaZ', 'g@briZ99'),
('oscarL', '0sc@rL!'),
('lucia_m', 'luci@M2023'),
('jorgeP', 'j0rg3P#'),
('diana_rose', 'd1@n@R0s3'),
('raulF', 'r@ulF2023'),
('silvia_j', 's!lv1@J'),
('hugo_m', 'hug0M#'),
('teresaV', 't3r3s@V'),
('arturoQ', '@rtur0Q'),
('beatrizY', 'b34tr1zY'),
('manuelS', 'm@nu3lS!'),
('irene_c', '1r3n3C2023');

INSERT INTO Jugador (id_usuario, partidas_jugadas, partidas_completadas, enemigos_derrotados, mejor_tiempo, 
mejor_puntuacion, muertes, doublejump_obtenido, chargedjump_obtenido, dash_obtenido) VALUES
(1, 10, 7, 130, '00:02:55', 9000, 3, true, false, true),
(2, 5, 5, 70, '00:02:45', 8700, 2, false, true, false),
(3, 2, 1, 15, '00:02:50', 3000, 5, false, false, false),
(4, 8, 6, 95, '00:03:00', 7500, 4, true, true, false),
(5, 15, 12, 180, '00:02:59', 9800, 6, true, false, true),
(6, 3, 2, 40, '00:02:43', 4500, 7, false, true, true),
(7, 20, 18, 250, '00:02:57', 10000, 2, true, true, true),
(8, 7, 4, 85, '00:02:48', 6800, 5, false, false, true),
(9, 12, 9, 150, '00:02:49', 9500, 3, true, true, false),
(10, 4, 3, 55, '00:02:47', 5200, 8, false, false, false),
(11, 9, 7, 110, '00:02:56', 8300, 4, true, false, true),
(12, 6, 5, 75, '00:02:53', 7100, 3, false, true, false),
(13, 14, 11, 200, '00:03:00', 9900, 5, true, true, true),
(14, 1, 0, 5, '00:02:51', 800, 10, false, false, false),
(15, 18, 15, 230, '00:02:39', 9700, 4, true, false, true),
(16, 5, 4, 65, '00:02:47', 6200, 6, false, true, false),
(17, 11, 8, 140, '00:02:50', 8800, 3, true, false, true),
(18, 2, 1, 25, '00:02:30', 3500, 7, false, false, true),
(19, 16, 13, 210, '00:02:20', 9600, 2, true, true, true),
(20, 7, 5, 90, '00:02:40', 7400, 5, false, true, false),
(21, 13, 10, 170, '00:02:05', 9200, 4, true, false, true),
(22, 3, 2, 35, '00:02:20', 4100, 9, false, false, false),
(23, 9, 6, 105, '00:02:45', 7900, 5, true, true, false),
(24, 4, 3, 50, '00:02:55', 5800, 7, false, false, true),
(25, 17, 14, 220, '00:02:38', 9800, 3, true, true, true),
(26, 6, 4, 80, '00:02:25', 6900, 6, false, true, false),
(27, 10, 8, 125, '00:02:40', 9100, 4, true, false, true),
(28, 1, 1, 10, '00:02:36', 2000, 12, false, true, false),
(29, 19, 16, 240, '00:02:50', 10000, 1, true, true, true),
(30, 8, 6, 100, '00:02:55', 7700, 5, false, false, true);

INSERT INTO Partida (puntuacion, tiempo) VALUES
(8500, '00:02:45'),
(8700, '00:02:50'),
(3000, '00:02:30'),
(7200, '00:02:55'),
(9500, '00:02:35'),
(4200, '00:02:40'),
(6800, '00:02:57'),
(5300, '00:02:46'),
(8900, '00:02:51'),
(6100, '00:02:59'),
(7700, '00:02:53'),
(4900, '00:02:33'),
(9300, '00:02:37'),
(3500, '00:02:44'),
(8200, '00:02:49'),
(5700, '00:02:56'),
(9800, '00:02:34'),
(4500, '00:02:52'),
(7400, '00:02:38'),
(5100, '00:02:43'),
(9100, '00:02:54'),
(3900, '00:02:41'),
(7900, '00:02:47'),
(5400, '00:02:32'),
(9600, '00:02:36'),
(4700, '00:02:39'),
(8300, '00:02:48'),
(5800, '00:02:58'),
(10000, '00:02:30'),
(6500, '00:02:50'),
(7100, '00:02:55'),
(4400, '00:02:42'),
(8800, '00:02:59'),
(6200, '00:02:37'),
(3700, '00:02:35');

INSERT INTO Login_History (id_usuario, fecha_login) VALUES
(1, '2025-02-05 08:12:00'),
(2, '2025-02-15 14:30:00'),
(3, '2025-02-25 20:45:00'),
(4, '2025-03-05 09:10:00'),
(5, '2025-03-15 11:55:00'),
(6, '2025-03-25 13:35:00'),
(7, '2025-04-01 07:50:00'),
(8, '2025-04-10 18:40:00'),
(9, '2025-04-15 22:25:00'),
(10, '2025-04-20 23:59:00'),
(11, '2025-02-06 10:05:00'),
(12, '2025-02-08 11:15:00'),
(13, '2025-02-10 12:25:00'),
(14, '2025-02-12 13:35:00'),
(15, '2025-02-14 14:45:00'),
(16, '2025-02-16 15:55:00'),
(17, '2025-02-18 17:05:00'),
(18, '2025-02-20 18:15:00'),
(19, '2025-02-22 19:25:00'),
(20, '2025-02-24 20:35:00'),
(21, '2025-03-02 09:10:00'),
(22, '2025-03-04 10:20:00'),
(23, '2025-03-06 11:30:00'),
(24, '2025-03-08 12:40:00'),
(25, '2025-03-10 13:50:00'),
(26, '2025-03-12 15:00:00'),
(27, '2025-03-14 16:10:00'),
(28, '2025-03-16 17:20:00'),
(29, '2025-03-18 18:30:00'),
(30, '2025-03-20 19:40:00');

INSERT INTO Partida_Jugador (id_partida, id_jugador) VALUES
-- Partidas individuales (1 jugador por partida)
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10),

-- Jugadores con múltiples partidas (los más activos)
(11, 1), (12, 1), (13, 2), (14, 2), (15, 3), (16, 3), (17, 4), (18, 4), (19, 5), (20, 5),

-- Partidas multijugador
(21, 6), (21, 7),  -- Partida 21 con jugadores 6 y 7
(22, 8), (22, 9),  -- Partida 22 con jugadores 8 y 9
(23, 10), (23, 11), -- Partida 23 con jugadores 10 y 11
(24, 12), (24, 13), -- Partida 24 con jugadores 12 y 13
(25, 14), (25, 15), -- Partida 25 con jugadores 14 y 15

-- Partidas para los jugadores restantes (16-30)
(26, 16), (27, 17), (28, 18), (29, 19), (30, 20), -- Individuales
(26, 21), -- Jugador 21 en partida 26 (multijugador)
(27, 22), -- Jugador 22 en partida 27
(28, 23), -- Jugador 23 en partida 28
(29, 24), -- Jugador 24 en partida 29
(30, 25), -- Jugador 25 en partida 30

-- Partidas adicionales para completar los jugadores faltantes (26-30)
(21, 26), -- Jugador 26 en partida 21 (multijugador existente)
(22, 27), -- Jugador 27 en partida 22
(23, 28), -- Jugador 28 en partida 23
(24, 29), -- Jugador 29 en partida 24
(25, 30); -- Jugador 30 en partida 25
