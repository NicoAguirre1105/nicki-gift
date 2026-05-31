import { TilePoint } from './map'

export const PLAYER_START = { x: 3, y: 3 } // posición inicial en tiles
export const MAX_LIVES = 3
export const TOTAL_TRIVIA = 10

export type GamePhase =
  | 'intro'      // diálogos de introducción
  | 'playing'    // jugando libremente
  | 'trivia'     // modal de trivia activo
  | 'end'        // llegó al final

export type GameState = {
  phase: GamePhase
  playerTile: { x: number; y: number }
  playerPixel: { x: number; y: number }
  lives: number
  triviaCollected: number[]   // índices de trivia points ya recogidos
  activeTriviaPoint: TilePoint | null
}

export type GameAction =
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'MOVE_PLAYER'; tile: { x: number; y: number }; pixel: { x: number; y: number } }
  | { type: 'OPEN_TRIVIA'; point: TilePoint }
  | { type: 'COLLECT_TRIVIA'; index: number }
  | { type: 'CLOSE_TRIVIA' }
  | { type: 'LOSE_LIFE' }

export function initialGameState(): GameState {
  return {
    phase: 'intro',
    playerTile: { ...PLAYER_START },
    playerPixel: { x: PLAYER_START.x * 16, y: PLAYER_START.y * 16 },
    lives: MAX_LIVES,
    triviaCollected: [],
    activeTriviaPoint: null,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase }

    case 'MOVE_PLAYER':
      return { ...state, playerTile: action.tile, playerPixel: action.pixel }

    case 'OPEN_TRIVIA':
      return { ...state, phase: 'trivia', activeTriviaPoint: action.point }

    case 'COLLECT_TRIVIA':
      return {
        ...state,
        phase: 'playing',
        activeTriviaPoint: null,
        triviaCollected: [...state.triviaCollected, action.index],
      }

    case 'CLOSE_TRIVIA':
      return { ...state, phase: 'playing', activeTriviaPoint: null }

    case 'LOSE_LIFE': {
      const newLives = state.lives - 1
      return { ...state, lives: newLives }
    }

    default:
      return state
  }
}
