export const SUITS = [
  { name: 'Clubs', symbol: '♣', color: 'black' },
  { name: 'Diamonds', symbol: '♦', color: 'red' },
  { name: 'Hearts', symbol: '♥', color: 'red' },
  { name: 'Spades', symbol: '♠', color: 'black' },
]

export const RANKS = [
  ['Ace', 'A'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6'], ['7', '7'],
  ['8', '8'], ['9', '9'], ['10', '10'], ['Jack', 'J'], ['Queen', 'Q'], ['King', 'K'],
]

export const BACK_COLORS = ['red', 'blue', 'black']

export function createStandardDeck() {
  return SUITS.flatMap((suit) => RANKS.map(([rank, shortRank]) => ({
    id: `${shortRank}-${suit.name.toLowerCase()}`,
    rank,
    shortRank,
    suit: suit.name,
    symbol: suit.symbol,
    color: suit.color,
  })))
}

export function isValidDeck(cards) {
  if (!Array.isArray(cards) || cards.length !== 52) return false
  const validIds = new Set(createStandardDeck().map((card) => card.id))
  return new Set(cards.map((card) => card?.id)).size === 52 && cards.every((card) => validIds.has(card?.id))
}

export function fisherYates(cards, random = Math.random) {
  const shuffled = [...cards]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function uniqueId() {
  return globalThis.crypto?.randomUUID?.() ?? `deck-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createDeck(backColor = 'red', previousCards, random = Math.random) {
  let cards = fisherYates(createStandardDeck(), random)
  if (previousCards && cards.every((card, index) => card.id === previousCards[index]?.id)) {
    ;[cards[0], cards[1]] = [cards[1], cards[0]]
  }
  const id = uniqueId()
  return {
    id,
    name: `Deck ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    cards,
    backColor,
    stackSeed: hashString(id),
    reviewCount: 0,
    lastReviewedAt: null,
  }
}

export function hashString(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function stackOffset(seed, position) {
  let value = (seed + Math.imul(position + 1, 2654435761)) >>> 0
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5
  const part = (shift, range) => ((value >>> shift) % 1000) / 999 * range
  return {
    x: part(0, 10) - 5,
    y: part(7, 7) - 3,
    rotation: part(14, 3) - 1.5,
  }
}

export function nextBackColor(color) {
  return BACK_COLORS[(BACK_COLORS.indexOf(color) + 1) % BACK_COLORS.length]
}
