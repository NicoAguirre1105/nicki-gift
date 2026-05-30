# Arquitectura de supabase

## Login

- Se usará la tabla de auth.users para validación de usuario por medio de correo y contraseña.

## Información de usuario

La tabla public.profiles tiene la siguiente estructura:
- id (uuid): foreign key hacia auth.users.id
- created_at (timestamptz): fecha de creación de la fila
- username (varchar): Nombre de usuario
- maze_completed (boolean): Flag para saber cuando ya se pasó el laberinto y mostrar el dashboard.