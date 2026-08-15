import { BACK_COLORS, createDeck, isValidDeck, nextBackColor } from './deck.js'

export const DEFAULT_SETTINGS = { bpm: 33, beatsPerBar: 4, runtimeMinutes: 4, volume: 0.35 }

export function initialState() {
  return {
    activeDeck: createDeck('red'),
    recentDecks: [],
    nextBackColor: 'blue',
    currentCardIndex: -1,
    timerStartedAt: null,
    metronomeStartedAt: null,
    settings: { ...DEFAULT_SETTINGS },
  }
}

export function startOver(state) {
  return { ...state, currentCardIndex: -1 }
}

export function advance(state) {
  if (state.currentCardIndex >= 51) return { ...state, currentCardIndex: -1 }
  return { ...state, currentCardIndex: state.currentCardIndex + 1 }
}

export function shuffleDeck(state, random = Math.random) {
  const recentDecks = [state.activeDeck, ...state.recentDecks.filter((deck) => deck.id !== state.activeDeck.id)].slice(0, 3)
  const activeDeck = createDeck(state.nextBackColor, state.activeDeck.cards, random)
  return {
    ...state, activeDeck, recentDecks,
    nextBackColor: nextBackColor(state.nextBackColor),
    currentCardIndex: -1, timerStartedAt: null, metronomeStartedAt: null,
  }
}

export function loadSavedDeck(state, deckId) {
  const saved = state.recentDecks.find((deck) => deck.id === deckId)
  if (!saved) return state
  const now = new Date().toISOString()
  const activeDeck = { ...saved, reviewCount: (saved.reviewCount || 0) + 1, lastReviewedAt: now }
  return {
    ...state, activeDeck,
    recentDecks: state.recentDecks.map((deck) => deck.id === deckId ? activeDeck : deck),
    currentCardIndex: -1, timerStartedAt: null, metronomeStartedAt: null,
  }
}

export function formatElapsed(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  const minutesTotal = Math.floor(totalSeconds / 60)
  if (minutesTotal < 60) return `${String(minutesTotal).padStart(2, '0')}:${seconds}`
  return `${String(Math.floor(minutesTotal / 60)).padStart(2, '0')}:${String(minutesTotal % 60).padStart(2, '0')}:${seconds}`
}

export function metronomeCutoff(startedAt, runtimeMinutes) {
  return startedAt == null ? null : startedAt + runtimeMinutes * 60_000
}

function validSettings(value) {
  return value && Number.isFinite(value.bpm) && value.bpm >= 20 && value.bpm <= 240 &&
    Number.isInteger(value.beatsPerBar) && value.beatsPerBar >= 1 && value.beatsPerBar <= 12 &&
    Number.isFinite(value.runtimeMinutes) && value.runtimeMinutes >= 1 && value.runtimeMinutes <= 30 &&
    Number.isFinite(value.volume) && value.volume >= 0 && value.volume <= 1
}

function validDeck(value) {
  return value && typeof value.id === 'string' && isValidDeck(value.cards) && BACK_COLORS.includes(value.backColor) && Number.isFinite(value.stackSeed)
}

export function validateState(value) {
  return Boolean(value && validDeck(value.activeDeck) && Array.isArray(value.recentDecks) &&
    value.recentDecks.length <= 3 && value.recentDecks.every(validDeck) && BACK_COLORS.includes(value.nextBackColor) &&
    Number.isInteger(value.currentCardIndex) && value.currentCardIndex >= -1 && value.currentCardIndex <= 51 &&
    (value.timerStartedAt === null || Number.isFinite(value.timerStartedAt)) &&
    (value.metronomeStartedAt === null || Number.isFinite(value.metronomeStartedAt)) && validSettings(value.settings))
}

export function loadState(storage) {
  try {
    const parsed = JSON.parse(storage.getItem('card-memory-trainer-state'))
    return validateState(parsed) ? parsed : initialState()
  } catch { return initialState() }
}

export function saveState(storage, state) {
  storage.setItem('card-memory-trainer-state', JSON.stringify(state))
}
