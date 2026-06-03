export type TriviaQuestion = {
  id: number
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 0,
    question: '¿En qué fecha empezamos a salir?',
    options: ['14 de febrero', '1 de diciembre', '25 de octubre', '3 de junio'],
    correctIndex: 1,
  },
  {
    id: 1,
    question: '¿Cómo se llama la mascota de Nicki?',
    options: ['Mochi', 'Luna', 'Haru', 'Coco'],
    correctIndex: 2,
  },
  {
    id: 2,
    question: '¿En qué ciudad nos conocimos?',
    options: ['Quito', 'Lima', 'San Petersburgo', 'Hong Kong'],
    correctIndex: 2,
  },
  {
    id: 3,
    question: '¿Cuál es el color favorito de Nicki?',
    options: ['Rosa', 'Verde', 'Morado', 'Azul'],
    correctIndex: 3,
  },
  {
    id: 4,
    question: '¿Qué le gusta más a Nicki?',
    options: ['Sushi', 'Pollo broaster', 'Huevo sancochado', 'Ceviche'],
    correctIndex: 0,
  },
  {
    id: 5,
    question: '¿Cuál es la banda o artista favorito de Nicki?',
    options: ['BLACKPINK', 'TWICE', 'EXO', 'BTS'],
    correctIndex: 3,
  },
  {
    id: 6,
    question: '¿Qué número está asociado a Nicki desde que me conoció?',
    options: ['IV', 'LXIX', 'Esta respuesta no importa', 'esta respuesta tampoco importa'],
    correctIndex: 0,
  },
  {
    id: 7,
    question: '¿Qué palabra describe mejor a Nicki?',
    options: ['Curiosa', 'Valiente', 'Brillante', 'Todas las anteriores'],
    correctIndex: 3,
  },
  {
    id: 8,
    question: '¿Cuál es el postre favorito de Nicki?',
    options: ['Cheesecake', 'Helado de vainilla', 'Bubble tea', 'Tiramisú'],
    correctIndex: 2,
  },
  {
    id: 9,
    question: '¿En qué barrio de Lima vivía Nicki?',
    options: ['Miraflores', 'San Isidro', 'Barranco', 'Comas'],
    correctIndex: 3,
  },
]
