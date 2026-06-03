export type Carta = {
  id: string
  titulo: string
  fecha: string   // ej. "Junio 2025"
  contenido: string
}

export const CARTAS: Carta[] = [
  {
    id: 'carta-1',
    titulo: 'Feliz cumpleaños mi Reina!!',
    fecha: 'Junio 2026',
    contenido: `Mi Nicki hermosa,

Esta carta está destinada a agradecerte. ¿Y cómo no? No hay palabras ni cartas suficientes para decir el gusto que siento de tenerte a mi lado.

Como te he dicho siempre, estar contigo es algo asombroso. Tu forma de ser y tu actitud me contagian la felicidad y me mantienen positivo. Quiero agradecerte por darme la oportunidad de conocerte, de brindarme tu tiempo y tu amor. Tus esfuerzos por ser mejor cada día y tu lucha constante por avanzar me animan a ser mejor para estar a tu altura. Estoy muy orgulloso de la clase de pareja que tengo, de la calidad de persona que eres, y ten por seguro que estaré muy feliz por todo lo que consigas. Gracias por esta bonita relación y por todos los momentos que hemos vivido juntos. Espero poder tenerte cerca pronto y disfrutar aún más de tu presencia. Además, quisiera que este sea uno de tantos años en los que podremos acompañarnos en los cumpleaños. 😁

Te amo con todo mi corazón y espero que tengas un lindo día. ❤️

Con todo mi amor,
Nico`,
  },
]
