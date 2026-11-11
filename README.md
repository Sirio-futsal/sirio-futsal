# SIRIO FUTSAL

App (PWA) del futsal del Club Argentino Sirio, Rosario.

Estado: **versión de prueba** con datos de ejemplo. Todavía no está conectada a ninguna base de datos ni cuenta.

## Qué hay

- `src/datos/ejemplo.js`: categorías, equipos (19 con fixture + Escuelita), partidos, noticias y jugadores de ejemplo.
- `src/datos/reglas.js`: reglas de permisos y privacidad. Son las mismas que después se escriben en la base de datos (Supabase).
- `src/pantallas/publicas/`: Inicio, Fixture, Partido, Categorías, Noticias, Más, Avisos.
- `src/pantallas/panel/`: ingreso, Pendientes, Partidos, Noticias, Planteles y autorizaciones, Entrenadores, Datos de la Rosarina, Inscripciones, Enviar aviso.
- `public/`: escudo e íconos de la app.

## Comandos

```
npm install            # instalar dependencias
npm run dev            # abrir la app en modo desarrollo
npm test               # pruebas automáticas (reglas y pantallas)
npm run build          # versión para publicar en Cloudflare Pages
npm run build:prueba   # página única para la versión de prueba
```

## Conectar con Supabase (etapas 5 y 6, ya incluidas en el código)

1. En Supabase: **SQL Editor → New query**, pegar todo `supabase/esquema.sql` y tocar **Run**. Crea las tablas, la seguridad por fila, las vistas públicas y los 20 equipos.
   Si la cuenta de administración no es `siriofutsalrosario@gmail.com`, cambiar ese mail en la función `email_admin()` del archivo antes de ejecutarlo.
2. En **Authentication → Providers → Email** dejar activado *Confirm email*.
3. En la carpeta del proyecto: `npm install`, `npm test`, `npm run dev`.
4. En la app: panel → **Crear cuenta** con el mail de administración, confirmar el mail que llega y volver a ingresar.
5. Entrenadores: la administradora los invita desde *Más → Entrenadores*; ellos tocan **Crear cuenta** con ese mismo mail.
6. Al publicar, poner la dirección de la app en **Authentication → URL Configuration → Site URL**.

`npm run dev` y `npm run build` usan la base real; `npm test` y `npm run build:prueba` siguen con datos de ejemplo.
La clave `sb_publishable_…` puede ir en el código: lo que cada persona ve o cambia lo decide la seguridad de la base. La clave `service_role` o `secret` nunca va en la app.

## Próximas etapas

7. Fixture, resultados, lectura automática del boletín de la Rosarina y notificaciones.
8. Publicar en Cloudflare Pages y conectar el dominio .com.ar.
