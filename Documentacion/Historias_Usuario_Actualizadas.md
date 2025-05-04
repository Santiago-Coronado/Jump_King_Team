# Historias de Usuario (Versión 2) – Actualizadas

> 📌 Separadas por secciones: Web, Videojuego y Base de Datos  
> ✏️ Historia modificada respecto a la versión inicial  
> 🆕 Historia nueva agregada

---

## 🌐 Web

1. Yo como usuario que accede al sitio web, quiero poder registrarme e iniciar sesión utilizando un nombre de usuario y contraseña.
   - ✔️ Implementado (formulario, validación, conexión a base de datos).
   - ✏️ **Historia modificada:** ahora se permite entrar sin validación por correo.

2. Yo como usuario registrado, quiero poder visualizar mis estadísticas personales del juego (tiempo jugado, muertes, récord personal, etc.).
   - ✔️ Implementado (pantalla de estadísticas conectada a la base de datos y backend).

3. Yo como usuario, quiero ver una tabla de clasificación con los mejores jugadores.
   - ✔️ Implementado con vistas en la base de datos.

4. Yo como usuario, quiero visualizar el juego desde la página principal.
   - ✔️ Implementado (`index.html` con canvas).

5. Yo como usuario, quiero ver una pantalla con descripción del juego.
   - ✔️ Implementado (`DescyControl.html`).

6. Yo como usuario, quiero ver una pantalla con los controles del juego.
   - ✔️ Implementado (pantalla y tabla funcional).

7. Yo como usuario, quiero que la página tenga diseño visual con CSS.
   - ✔️ Implementado con múltiples archivos CSS personalizados por pantalla.

8. Yo como desarrollador, quiero generar la página con HTML.
   - ✔️ Implementado (cada pantalla tiene su HTML correspondiente).

9. 🆕 Yo como usuario, quiero poder regresar al menú principal desde cualquier sección.
   - ✔️ Implementado (botones o vínculos de navegación).

10. 🆕 Yo como usuario, quiero escuchar música en la página de inicio.
    - ✔️ Implementado (reproducción automática de fondo).

---

## 🎮 Videojuego

1. Yo como jugador, quiero que el personaje principal tenga movimiento fluido (mover, saltar, dash, etc.).
   - ✔️ Implementado (`platformer.js`, `knight.js`, `powerups.js`).
   - ✏️ **Historia modificada:** se agregaron efectos visuales, animaciones y cooldown visibles.

2. Yo como jugador, quiero niveles variados con plataformas y enemigos.
   - ✔️ Implementado (`levels.js`, `baselevel.js`, aleatoriedad en niveles).

3. Yo como jugador, quiero que los enemigos tengan comportamientos distintos (caminar, volar, saltar).
   - ✔️ Implementado (`skeleton.js`, `demon.js`, `jumper.js`).

4. Yo como jugador, quiero encontrar objetos de poder (power-ups).
   - ✔️ Implementado (`powerups.js`, niveles específicos).

5. Yo como jugador, quiero controlar el volumen del juego.
   - ✔️ Implementado (volumen ajustable con botones).

6. Yo como jugador, quiero usar controles estándar (ASDW + espacio + Q).
   - ✔️ Implementado (`platformer.js`, mapeo de teclas).

7. Yo como jugador, quiero un personaje y princesa visualmente distinguibles.
   - ✔️ Implementado (sprites personalizados).

8. Yo como jugador, quiero enemigos con diseño coherente al entorno.
   - ✔️ Implementado (diferentes sprites por tipo).

9. Yo como jugador, quiero que cada partida tenga niveles únicos.
   - ✔️ Implementado (algoritmo aleatorio para niveles).

10. Yo como jugador, quiero ver animaciones pulidas para cada acción.
    - ✔️ Implementado con sprites por frame (`player`, `princess`, `enemigos`).

11. Yo como jugador, quiero que haya sonidos en el juego (acciones, enemigos, princesa).
    - ✔️ Implementado (efectos de sonido conectados a eventos del juego).

12. Yo como jugador, quiero que haya música de fondo en los niveles y victoria.
    - ✔️ Implementado (`platformer.js`, niveles, secuencia de victoria).

13. Yo como jugador, quiero que si caigo desde gran altura muera y reinicie.
    - ✔️ Implementado (lógica de daño por caída).

14. Yo como jugador, quiero que tocar enemigos sin aplastarlos me haga daño.
    - ✔️ Implementado (`game_logic`, `collisions`).

15. Yo como jugador, quiero saber qué tipo de salto tengo disponible (barra HUD).
    - ✔️ Implementado (barra con cooldown y tipo de salto).

16. Yo como desarrollador, quiero que cada tipo de salto tenga su sprite.
    - ✔️ Implementado (sprites de dash, doble salto, salto cargado).

---

## 🗃️ Base de Datos

1. Yo como jugador, quiero que mis estadísticas se guarden (tiempo, muertes, puntaje).
   - ✔️ Implementado (`stats.js`, `JugadorView`, tablas MySQL).

2. Yo como jugador, quiero guardar las acciones de la partida (enemigos, power-ups).
   - ✔️ Implementado y consultable desde la base de datos.

3. Yo como desarrollador, quiero sincronización en tiempo real entre juego y servidor.
   - ✔️ Implementado (API con Express y MySQL2).

4. Yo como manejador, quiero tener modelo entidad-relación.
   - ✔️ Implementado (`KnightFalls.sql` y documentos auxiliares).

5. Yo como usuario, quiero una base de datos normalizada.
   - ✔️ Aplicadas 1FN, 2FN y 3FN.

6. Yo como manejador, quiero que la DB almacene la información correctamente.
   - ✔️ Tablas bien diseñadas con relaciones.

7. Yo como usuario, quiero que las estadísticas se recuperen rápido.
   - ✔️ Uso de vistas e índices (`JugadorEstadisticasCompletas`, `usuarioIDView`).

8. Yo como manejador, quiero CRUD completo sobre la base de datos.
   - ✔️ Implementado con API y SQL.

9. Yo como administrador, quiero guardar usuario y contraseña.
   - ✔️ Implementado (`Usuario`).

10. 🆕 Yo como desarrollador, quiero que las propiedades ACID se cumplan.
    - ✔️ Implementado con buenas prácticas en triggers y vistas.

11. Yo como administrador, quiero tener vistas útiles.
    - ✔️ Implementado (`knightFalls-view.sql`).

---
