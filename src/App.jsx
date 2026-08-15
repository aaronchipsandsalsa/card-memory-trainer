import { useEffect, useRef, useState } from 'react'
import { CardBack, CardFace } from './Card.jsx'
import { stackOffset } from './deck.js'
import { Metronome } from './metronome.js'
import { DEFAULT_SETTINGS, advance, formatElapsed, initialState, loadSavedDeck, loadState, saveState, shuffleDeck, startOver } from './state.js'

export default function App() {
  const [state, setState] = useState(() => loadState(localStorage))
  const [panel, setPanel] = useState(null)
  const [, tick] = useState(0)
  const metronome = useRef(new Metronome())

  useEffect(() => { saveState(localStorage, state) }, [state])
  useEffect(() => {
    const id = window.setInterval(() => tick((value) => value + 1), 500)
    return () => { window.clearInterval(id); metronome.current.stop() }
  }, [])
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState === 'visible' && state.metronomeStartedAt) metronome.current.start(state.metronomeStartedAt, state.settings)
    }
    document.addEventListener('visibilitychange', resume)
    return () => document.removeEventListener('visibilitychange', resume)
  }, [state.metronomeStartedAt, state.settings])

  const handleCardTap = () => {
    const firstReveal = state.currentCardIndex === -1 && state.timerStartedAt === null
    if (firstReveal) {
      const now = Date.now()
      setState((current) => ({ ...advance(current), timerStartedAt: now, metronomeStartedAt: now }))
      metronome.current.start(now, state.settings)
    } else setState((current) => advance(current))
  }

  const shuffle = () => { metronome.current.stop(); setPanel(null); setState((current) => shuffleDeck(current)) }
  const review = (id) => { metronome.current.stop(); setPanel(null); setState((current) => loadSavedDeck(current, id)) }
  const elapsed = state.timerStartedAt ? Date.now() - state.timerStartedAt : 0
  const visibleStart = Math.max(0, state.currentCardIndex - 3)
  const visibleCards = state.currentCardIndex >= 0 ? state.activeDeck.cards.slice(visibleStart, state.currentCardIndex + 1) : []

  return <main className="app-shell">
    <header className="toolbar">
      <div className="brand"><span>Card Memory Trainer</span><time aria-label={`Elapsed time ${formatElapsed(elapsed)}`}>{formatElapsed(elapsed)}</time></div>
      <nav aria-label="Deck controls">
        <button onClick={() => setState(startOver)}>Start Over</button>
        <button onClick={() => setPanel('recent')}>Recent Decks</button>
        <button className="shuffle" onClick={shuffle}>Shuffle</button>
        <button aria-label="Settings" onClick={() => setPanel('settings')}>Settings</button>
      </nav>
    </header>

    <button className="card-stage" onClick={handleCardTap} aria-label={state.currentCardIndex < 0 ? 'Reveal first card' : `Showing ${state.activeDeck.cards[state.currentCardIndex].rank} of ${state.activeDeck.cards[state.currentCardIndex].suit}. Tap for next card`}>
      <span className="deck-progress" aria-hidden="true">{state.currentCardIndex < 0 ? 'Tap the deck' : `${state.currentCardIndex + 1} / 52`}</span>
      <div className="pile">
        {state.currentCardIndex < 0 && <><CardBack color={state.activeDeck.backColor} style={{ transform: 'translate(-2px, 2px) rotate(-.6deg)' }} /><CardBack color={state.activeDeck.backColor} style={{ transform: 'translate(1px, -1px) rotate(.35deg)' }} /></>}
        {visibleCards.map((card, i) => { const position = visibleStart + i; const offset = stackOffset(state.activeDeck.stackSeed, position); return <CardFace key={`${card.id}-${position}`} card={card} depth={i} style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotation}deg)` }} /> })}
      </div>
    </button>

    {panel && <div className="scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null) }}>
      <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <div className="drawer-heading"><h2 id="panel-title">{panel === 'recent' ? 'Recent Decks' : 'Settings'}</h2><button className="close" onClick={() => setPanel(null)} aria-label="Close">×</button></div>
        {panel === 'recent' ? <RecentDecks decks={state.recentDecks} onReview={review} onClose={() => setPanel(null)} /> : <Settings state={state} setState={setState} stop={() => metronome.current.stop()} />}
      </section>
    </div>}
  </main>
}

function RecentDecks({ decks, onReview, onClose }) {
  if (!decks.length) return <div className="empty-state"><span>♠</span><p>No previous decks yet.</p><small>Shuffle your current deck to save it here.</small><button onClick={onClose}>Return to current deck</button></div>
  return <><div className="recent-list">{decks.map((deck, index) => <article className="recent-card" key={deck.id}>
    <span className={`back-swatch back-${deck.backColor}`} aria-hidden="true" />
    <div><h3>Previous Deck {decks.length - index}</h3><p>{new Date(deck.createdAt).toLocaleString()}</p><small>{deck.backColor} back · Reviewed {deck.reviewCount || 0} times</small></div>
    <button onClick={() => onReview(deck.id)}>Review</button>
  </article>)}</div><button className="wide secondary" onClick={onClose}>Return to current deck</button></>
}

function Settings({ state, setState, stop }) {
  const update = (field, value) => setState((current) => ({ ...current, settings: { ...current.settings, [field]: Number(value) } }))
  const resetSaved = () => { if (window.confirm('Remove all recent decks?')) setState((current) => ({ ...current, recentDecks: [] })) }
  const resetAll = () => { if (window.confirm('Reset every setting and deck? This cannot be undone.')) { stop(); setState(initialState()) } }
  return <div className="settings-form">
    <label>BPM <output>{state.settings.bpm}</output><input type="range" min="20" max="240" value={state.settings.bpm} onChange={(e) => update('bpm', e.target.value)} /></label>
    <label>Beats per bar <select value={state.settings.beatsPerBar} onChange={(e) => update('beatsPerBar', e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label>
    <label>Maximum runtime <select value={state.settings.runtimeMinutes} onChange={(e) => update('runtimeMinutes', e.target.value)}>{[1, 2, 3, 4, 5, 10, 15, 20, 30].map((n) => <option value={n} key={n}>{n} minute{n === 1 ? '' : 's'}</option>)}</select></label>
    <label>Volume <output>{Math.round(state.settings.volume * 100)}%</output><input type="range" min="0" max="1" step=".05" value={state.settings.volume} onChange={(e) => update('volume', e.target.value)} /></label>
    <div className="danger-zone"><button onClick={resetSaved}>Reset saved decks</button><button className="danger" onClick={resetAll}>Reset all app data</button></div>
    <p className="settings-note">Changes apply to the next metronome session. Audio may pause when iPhone locks or the browser is backgrounded.</p>
  </div>
}
