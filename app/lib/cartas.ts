export type Carta = {
  id: string
  titulo: string
  fecha: string   // ej. "Junio 2025"
  contenido: string
}

export const CARTAS: Carta[] = [
  {
    id: 'carta-1',
    titulo: 'Para mi Nicki en su cumpleaños',
    fecha: 'Junio 2026',
    contenido: `Mi Nicki hermosa,

Hoy es tu cumpleaños y quería escribirte algo que puedas guardar, algo que puedas releer cuando quieras recordar lo especial que eres para mí.

No sé por dónde empezar porque hay demasiado que decir. Desde el momento en que te conocí en San Petersburgo supe que había algo diferente en ti. No era solo lo bonita que eres (aunque eso también cuenta jeje), era esa energía tuya, esa forma de reírte, esa mirada que lo dice todo sin decir nada.

Han pasado momentos increíbles juntos, y también momentos difíciles. Pero en cada uno de ellos, tú has sido algo constante en mi vida, algo que me alegra. Cada mensaje tuyo me hace sonreír, cada vez que hablamos siento que el mundo tiene más colores.

Eres curiosa, valiente y brillante — todas las anteriores, como ya sabes. Eres la persona que me hace querer ser mejor, que me inspira a seguir adelante, que me recuerda que las cosas bonitas en la vida existen.

Haru tiene suerte de tenerte como dueña. Tú tienes suerte de tenerme a mí jeje... mentira. Soy yo el afortunado.

Ojalá este cumpleaños esté lleno de todo lo que mereces: sushi, bubble tea, BTS en shuffle, y mucho amor. Espero poder dártelo desde lejos hoy, y muy pronto de cerca.

Te quiero muchísimo, mi medialuna.

Con todo mi amor,
Nico 💙`,
  },
]
