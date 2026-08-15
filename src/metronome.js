import { metronomeCutoff } from './state.js'

export class Metronome {
  constructor() {
    this.context = null
    this.interval = null
    this.nextBeatAt = 0
    this.beat = 0
  }

  async start(startedAt, settings) {
    this.stop()
    const cutoff = metronomeCutoff(startedAt, settings.runtimeMinutes)
    if (Date.now() >= cutoff) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    this.context ||= new AudioContext()
    await this.context.resume()
    const elapsedBeats = Math.floor((Date.now() - startedAt) / (60_000 / settings.bpm))
    this.beat = elapsedBeats % settings.beatsPerBar
    this.nextBeatAt = this.context.currentTime
    const schedule = () => {
      if (Date.now() >= cutoff) { this.stop(); return }
      while (this.nextBeatAt < this.context.currentTime + 0.12) {
        this.click(this.nextBeatAt, this.beat === 0, settings.volume)
        this.nextBeatAt += 60 / settings.bpm
        this.beat = (this.beat + 1) % settings.beatsPerBar
      }
    }
    schedule()
    this.interval = window.setInterval(schedule, 25)
  }

  click(time, accent, volume) {
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.frequency.value = accent ? 1100 : 760
    gain.gain.setValueAtTime(Math.max(0.0001, volume * (accent ? 0.42 : 0.27)), time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045)
    oscillator.connect(gain).connect(this.context.destination)
    oscillator.start(time); oscillator.stop(time + 0.05)
  }

  stop() {
    if (this.interval) window.clearInterval(this.interval)
    this.interval = null
  }
}
