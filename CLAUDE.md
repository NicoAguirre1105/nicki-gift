@AGENTS.md

# Juego de cumpleaños para novia

## Stack
- NextJS con TypeScript y tailwind.
- Canvas API para el laberinto.
- Supabase para auth y estado del usuario (laberinto completo)
- Vercel para deploy

## Partes del sitio web 

- Login para validar usuario.
- Juego del laberinto
- Una vez acabado el juego, se puede acceder a un dashboard con secciones de notas románticas, recuerdos y cartas de amor.
- El dashboard contiene la opción de repetir el juego.

## Estructura del juego

- Mapa: 75x68 tiles exportado de Tiled como JSON.
- Personaje con 4 movimientos permitidos para caminar y estado estático.
- Existe un narrador/guía con diiálogos que explicará el juego y dará información importante.
- 10 puntos de trivia repartidos por el mapa.
- Al completar se desbloquea el dashboard.

## Assets

- Tiles en: \public\assets\Free CC0 Top Down Tileset Template Pixel Art by Rgsdev\Free CC0 Top Down Tileset Pixel Art\Tilesets\
- Mapa JSON en: \public\assets\Free CC0 Top Down Tileset Template Pixel Art by Rgsdev\Free CC0 Top Down Tileset Pixel Art\Tilesets\map.json
- Frames de personaje en: \public\characters\Nicki 
- Frames de narrador en: \public\characters\Nico 

## Convenciones

- Componentes del juego en app/_components/game
- Componentes del dashboard en app/_components/dashboard
- Logica en app/lib
- Types en app/types

## Otros archivos

docs/
├── design.md     ← diseño, reglas del juego, flujo completo, estados
├── map-format.md      ← estructura del JSON de Tiled, qué significa cada capa
└── trivia-content.md  ← las 8 preguntas y sus respuestas correctas