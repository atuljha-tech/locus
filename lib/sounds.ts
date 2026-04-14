/**
 * Sound effects for SplitEase
 * Files live in /public/sounds/ — supports .wav, .mp3, .flac
 *
 * Current files in /public/sounds/:
 *   success.waz.wav  → debt added successfully
 *   shame.flac       → shame message sent
 *   nft.waz.wav      → NFT minted
 *   paid.wav         → debt marked paid
 *   error.wav        → any error
 */

type SoundName = 'success' | 'shame' | 'nft' | 'paid' | 'error'

// Map each logical name to the actual filename in /public/sounds/
const SOUND_FILES: Record<SoundName, string> = {
  success: '/sounds/success.waz.wav',
  shame:   '/sounds/shame.flac',
  nft:     '/sounds/nft.waz.wav',
  paid:    '/sounds/paid.wav',
  error:   '/sounds/error.wav',
}

const cache = new Map<string, HTMLAudioElement>()

export function playSound(name: SoundName, volume = 0.55) {
  if (typeof window === 'undefined') return
  try {
    const src = SOUND_FILES[name]
    let audio = cache.get(src)
    if (!audio) {
      audio = new Audio(src)
      cache.set(src, audio)
    }
    audio.volume = volume
    audio.currentTime = 0
    audio.play().catch(() => {
      // Autoplay policy blocked — silently ignore, app still works
    })
  } catch {
    // File missing or format unsupported — silently ignore
  }
}
