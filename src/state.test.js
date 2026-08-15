import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BACK_COLORS, createDeck, createStandardDeck, fisherYates, isValidDeck, nextBackColor } from './deck.js'
import { advance, formatElapsed, initialState, loadSavedDeck, loadState, metronomeCutoff, saveState, shuffleDeck, startOver } from './state.js'

describe('standard deck and shuffle', () => {
  it('has exactly 52 unique cards and no jokers', () => {
    const cards = createStandardDeck()
    assert.equal(cards.length, 52)
    assert.equal(new Set(cards.map((card) => card.id)).size, 52)
    assert.equal(cards.some((card) => /joker/i.test(card.rank)), false)
  })
  it('produces a valid permutation with Fisher-Yates', () => {
    const source = createStandardDeck(); const shuffled = fisherYates(source, () => 0.42)
    assert.equal(isValidDeck(shuffled), true)
    assert.deepEqual(shuffled.map((card) => card.id).sort(), source.map((card) => card.id).sort())
    assert.notDeepEqual(shuffled, source)
  })
  it('avoids an immediately identical permutation', () => {
    const source = createStandardDeck(); const deck = createDeck('red', source, () => 0.999999)
    assert.notDeepEqual(deck.cards, source); assert.equal(isValidDeck(deck.cards), true)
  })
})

describe('practice state', () => {
  it('Start Over preserves exact order and returns face down', () => {
    const state = initialState(); state.currentCardIndex = 24; const result = startOver(state)
    assert.equal(result.currentCardIndex, -1); assert.deepEqual(result.activeDeck.cards, state.activeDeck.cards)
  })
  it('Start Over does not reset timer or metronome cutoff state', () => {
    const state = initialState(); state.timerStartedAt = 1000; state.metronomeStartedAt = 2000
    const result = startOver(state); assert.equal(result.timerStartedAt, 1000); assert.equal(result.metronomeStartedAt, 2000)
  })
  it('tap after card 52 resets face down while preserving order', () => {
    const state = initialState(); state.currentCardIndex = 51; const cards = state.activeDeck.cards; const result = advance(state)
    assert.equal(result.currentCardIndex, -1); assert.strictEqual(result.activeDeck.cards, cards)
  })
  it('rapid advancement cannot exceed Card 52', () => {
    let state = initialState()
    for (let i = 0; i < 500; i += 1) { state = advance(state); assert.ok(state.currentCardIndex <= 51) }
  })
  it('shuffle archives the previous deck, resets sessions, and rotates colors', () => {
    const state = initialState(); state.timerStartedAt = 1; state.metronomeStartedAt = 1; const old = state.activeDeck
    const result = shuffleDeck(state, () => 0.31)
    assert.strictEqual(result.recentDecks[0], old); assert.equal(result.activeDeck.backColor, 'blue')
    assert.equal(result.timerStartedAt, null); assert.equal(result.metronomeStartedAt, null)
  })
  it('keeps a maximum of three exact saved decks and back colors', () => {
    let state = initialState(); const snapshots = []
    for (let i = 0; i < 5; i += 1) { snapshots.push(state.activeDeck); state = shuffleDeck(state, () => 0.1 + i / 10) }
    assert.equal(state.recentDecks.length, 3); assert.deepEqual(state.recentDecks[0].cards, snapshots[4].cards); assert.equal(state.recentDecks[0].backColor, snapshots[4].backColor)
  })
  it('rotates Red → Blue → Black repeatedly', () => {
    assert.deepEqual(BACK_COLORS, ['red', 'blue', 'black']); assert.equal(nextBackColor('red'), 'blue'); assert.equal(nextBackColor('blue'), 'black'); assert.equal(nextBackColor('black'), 'red')
  })
  it('loads a saved deck in exact order and color without deleting it', () => {
    let state = shuffleDeck(initialState(), () => 0.22); const saved = state.recentDecks[0]; state = loadSavedDeck(state, saved.id)
    assert.deepEqual(state.activeDeck.cards, saved.cards); assert.equal(state.activeDeck.backColor, saved.backColor)
    assert.equal(state.recentDecks.some((deck) => deck.id === saved.id), true); assert.equal(state.currentCardIndex, -1)
  })
})

describe('timing', () => {
  it('formats elapsed time below and above an hour', () => {
    assert.equal(formatElapsed(0), '00:00'); assert.equal(formatElapsed(65_999), '01:05'); assert.equal(formatElapsed(3_661_000), '01:01:01')
  })
  it('calculates an exact metronome cutoff', () => assert.equal(metronomeCutoff(1000, 4), 241000))
})

describe('localStorage persistence and recovery', () => {
  function storage(value = null) { let data = value; return { getItem: () => data, setItem: (_, next) => { data = next } } }
  it('round-trips valid state', () => { const store = storage(); const state = initialState(); saveState(store, state); assert.deepEqual(loadState(store), state) })
  it('recovers from invalid JSON', () => assert.equal(isValidDeck(loadState(storage('bad json')).activeDeck.cards), true))
  it('recovers from an invalid object', () => assert.equal(isValidDeck(loadState(storage(JSON.stringify({ broken: true }))).activeDeck.cards), true))
})
