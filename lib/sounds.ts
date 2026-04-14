/**
 * Sound effects for SplitEase
 * Files go in /public/sounds/
 *
 * Download links (all free, no attribution required):
 *   success.mp3  → https://freesound.org/s/341695/  (short positive chime)
 *   shame.mp3    → https://freesound.org/s/397353/  (dramatic sting)
 *   nft.mp3      → https://freesound.org/s/320655/  (sci-fi blip)
 *   paid.mp3     → https://freesound.org/s/341695/  (coin sound)
 *   error.mp3    → https://freesound.org/s/142608/  (soft error)
 */

type SoundName = 'success' | 'shame' | 'nft' | 'paid' | 'error'

const cache = new Map<string, HTMLAudioElement>()

export function playSound(name: SoundName, volume = 0.5) {
  if (typeof window === 'undefined') return
  try {
    let audio = cache.get(name)
    if (!audio) {
      audio = new Audio(`/sounds/${name}.mp3`)
      cache.set(name, audio)
    }
    audio.volume = volume
    audio.currentTime = 0
    audio.play().catch(() => {
      // Autoplay blocked — silently ignore
    })
  } catch {
    // Sound not found — silently ignore
  }
}
