-- Desactivar temporalmente las restricciones de clave foránea
use knightfalldb;
SET FOREIGN_KEY_CHECKS = 0;

-- Truncar todas las tablas (eliminar todos los datos)
TRUNCATE TABLE jugador;
TRUNCATE TABLE partida;
TRUNCATE TABLE partida_jugador;
TRUNCATE TABLE usuario;
TRUNCATE TABLE Login_History;

-- Reactivar las restricciones de clave foránea
SET FOREIGN_KEY_CHECKS = 1;

-- Ahora puedes ejecutar los nuevos INSERT