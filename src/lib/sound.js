// The "ball hits the paddle" sound for notifications.
//
// 1) If public/sounds/paddle-hit.mp3 exists, that real recording is played.
//    (Drop any short hit sound there to change it - no code changes needed.)
// 2) Otherwise a hit is synthesized with the Web Audio API.
//
// Browsers only allow sound after the user has tapped/clicked the page once,
// so unlockAudio() is called on the first tap (see NotificationsContext).

const SOUND_FILE = '/sounds/paddle-hit.mp3'

let audioContext = null
let fileMissing = false // remember a 404 so we don't keep asking for it

function getContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null
    audioContext = new AudioContextClass()
  }
  return audioContext
}

export function unlockAudio() {
  const ctx = getContext()
  if (ctx && ctx.state === 'suspended') ctx.resume()
}

// On/off switch, remembered in this browser (Profile page)
export function soundEnabled() {
  try {
    return localStorage.getItem('sound') !== 'off'
  } catch {
    return true
  }
}

export function setSoundEnabled(on) {
  try {
    localStorage.setItem('sound', on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}

// White noise with a fast fade-out baked in (the raw "smack" of contact)
function noiseBurst(ctx, seconds, decay) {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * decay))
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  return source
}

// A synthesized racket/paddle hit, built from 3 layers:
//   thump - low body of the ball squashing against the face
//   crack - noise through a resonant filter (the hollow "thwock")
//   ping  - a faint bright ring, like strings / a hard paddle face
function synthHit(ctx, start, volume = 0.8) {
  const vary = 1 + (Math.random() - 0.5) * 0.08 // tiny variation so it sounds natural

  const master = ctx.createGain()
  master.gain.value = volume
  // gentle compressor keeps the attack punchy without clipping
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -12
  comp.ratio.value = 4
  master.connect(comp).connect(ctx.destination)

  // 1) thump
  const thump = ctx.createOscillator()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(240 * vary, start)
  thump.frequency.exponentialRampToValueAtTime(95, start + 0.07)
  const thumpGain = ctx.createGain()
  thumpGain.gain.setValueAtTime(0.0001, start)
  thumpGain.gain.exponentialRampToValueAtTime(0.9, start + 0.002)
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11)
  thump.connect(thumpGain).connect(master)
  thump.start(start)
  thump.stop(start + 0.12)

  // 2) crack
  const crack = noiseBurst(ctx, 0.07, 0.009)
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1500 * vary
  band.Q.value = 2.5
  const crackGain = ctx.createGain()
  crackGain.gain.value = 1.6
  crack.connect(band).connect(crackGain).connect(master)
  crack.start(start)

  // 3) ping
  const ping = ctx.createOscillator()
  ping.type = 'sine'
  ping.frequency.setValueAtTime(2600 * vary, start)
  ping.frequency.exponentialRampToValueAtTime(2350 * vary, start + 0.15)
  const pingGain = ctx.createGain()
  pingGain.gain.setValueAtTime(0.0001, start)
  pingGain.gain.exponentialRampToValueAtTime(0.08, start + 0.003)
  pingGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
  ping.connect(pingGain).connect(master)
  ping.start(start)
  ping.stop(start + 0.2)
}

function playSynth(force) {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
  if (ctx.state !== 'running' && !force) return // not unlocked yet - stay quiet
  synthHit(ctx, ctx.currentTime + 0.01)
}

// Play the hit. force = play even if sound is switched off (the Test button)
export function playHit({ force = false } = {}) {
  if (!force && !soundEnabled()) return
  if (fileMissing) return playSynth(force)

  const audio = new Audio(SOUND_FILE)
  audio.volume = 0.8
  audio.addEventListener('error', () => {
    fileMissing = true // no recording in public/sounds - use the synth from now on
    playSynth(force)
  })
  audio.play().catch(() => {
    // autoplay blocked or file problem; the error handler covers a missing file
  })
}
