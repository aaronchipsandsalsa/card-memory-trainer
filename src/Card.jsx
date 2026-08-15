const COURT_NAMES = { Jack: 'JACK', Queen: 'QUEEN', King: 'KING' }
const PIP_COUNTS = { Ace: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10 }

export function CardFace({ card, style, depth = 0 }) {
  const isCourt = card.rank in COURT_NAMES
  return (
    <div className={`playing-card face ${card.color}`} style={{ ...style, zIndex: depth + 2 }} aria-label={`${card.rank} of ${card.suit}`}>
      <div className="corner top"><b>{card.shortRank}</b><span aria-hidden="true">{card.symbol}</span><span className="sr-only">{card.suit}</span></div>
      <div className={`card-center ${isCourt ? 'court' : 'pips pips-' + PIP_COUNTS[card.rank]}`} aria-hidden="true">
        {isCourt ? <><span className="court-crown">♕</span><strong>{COURT_NAMES[card.rank]}</strong><span className="court-suit">{card.symbol}</span></> :
          Array.from({ length: PIP_COUNTS[card.rank] }, (_, index) => <span key={index}>{card.symbol}</span>)}
      </div>
      <div className="corner bottom"><b>{card.shortRank}</b><span aria-hidden="true">{card.symbol}</span><span className="sr-only">{card.suit}</span></div>
    </div>
  )
}

export function CardBack({ color, style }) {
  return <div className={`playing-card card-back back-${color}`} style={style} aria-label={`${color} face-down deck`}>
    <div className="back-frame"><div className="back-pattern"><div className="back-medallion"><span>Dominic O’Brien</span><strong>Memory</strong></div></div></div>
  </div>
}
