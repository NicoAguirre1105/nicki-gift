export type TriviaQuestion = {
  id: number
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 0,
    question: '¿Cuándo fue nuestra primera cita?',
    options: ['12 de febrero', '14 de marzo', '20 de enero', '3 de abril'],
    correctIndex: 0,
  },
  {
    id: 1,
    question: '¿Cuál es mi canción favorita?',
    options: ['Lover – Taylor Swift', 'Perfect – Ed Sheeran', 'Die With A Smile – Bruno Mars', 'Thinking Out Loud'],
    correctIndex: 2,
  },
  {
    id: 2,
    question: '¿Cuál es el color favorito de Nicki?',
    options: ['Verde', 'Rosa', 'Azul', 'Morado'],
    correctIndex: 1,
  },
  {
    id: 3,
    question: '¿En qué ciudad nos conocimos?',
    options: ['Bogotá', 'Medellín', 'Cali', 'Cartagena'],
    correctIndex: 0,
  },
  {
    id: 4,
    question: '¿Cuál es la comida favorita de Nicki?',
    options: ['Pizza', 'Sushi', 'Pasta', 'Hamburguesa'],
    correctIndex: 2,
  },
  {
    id: 5,
    question: '¿Cómo se llama la mascota favorita de Nicki?',
    options: ['Luna', 'Coco', 'Mochi', 'Lola'],
    correctIndex: 2,
  },
  {
    id: 6,
    question: '¿Cuál es la película favorita de Nicki?',
    options: ['Titanic', 'La La Land', 'Interstellar', 'El gran pez'],
    correctIndex: 1,
  },
  {
    id: 7,
    question: '¿Qué deporte le gusta practicar a Nicki?',
    options: ['Natación', 'Tenis', 'Yoga', 'Patinaje'],
    correctIndex: 3,
  },
  {
    id: 8,
    question: '¿Cuál es el postre favorito de Nicki?',
    options: ['Tiramisú', 'Cheesecake', 'Brownie', 'Helado de vainilla'],
    correctIndex: 1,
  },
  {
    id: 9,
    question: '¿Qué palabra describe mejor a Nicki?',
    options: ['Curiosa', 'Valiente', 'Brillante', 'Todas las anteriores'],
    correctIndex: 3,
  },
]
