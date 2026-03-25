export function useAudioPlayback() {
  const isPlaying = ref(false)

  let audioContext: AudioContext | null = null
  let audioQueue: AudioBuffer[] = []
  let currentSource: AudioBufferSourceNode | null = null
  let isProcessingQueue = false
  // Default to 16000 Hz — ElevenLabs Conversational AI default
  // This gets updated when we receive the actual format from the server
  let sampleRate = 16000

  function setSampleRate(rate: number) {
    sampleRate = rate
    // Recreate audio context with correct sample rate if it exists
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
  }

  /**
   * Parse sample rate from ElevenLabs audio format strings like "pcm_16000", "pcm_44100", "ulaw_8000"
   */
  function parseSampleRateFromFormat(format: string): number {
    const match = format.match(/_(\d+)$/)
    if (match) return parseInt(match[1])
    // Fallback defaults
    if (format.includes('ulaw') || format.includes('mulaw')) return 8000
    return 16000
  }

  function setFormatFromMetadata(format: string) {
    const rate = parseSampleRateFromFormat(format)
    setSampleRate(rate)
  }

  function base64ToPCM16Float32(base64Audio: string): Float32Array {
    const binaryString = atob(base64Audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const pcm16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(pcm16.length)
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF)
    }
    return float32
  }

  function ensureAudioContext() {
    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate })
    }
    return audioContext
  }

  async function processQueue() {
    if (isProcessingQueue || audioQueue.length === 0) {
      if (audioQueue.length === 0) {
        isPlaying.value = false
      }
      return
    }

    isProcessingQueue = true
    isPlaying.value = true
    const ctx = ensureAudioContext()
    const buffer = audioQueue.shift()!

    return new Promise<void>((resolve) => {
      currentSource = ctx.createBufferSource()
      currentSource.buffer = buffer
      currentSource.connect(ctx.destination)
      currentSource.onended = () => {
        currentSource = null
        isProcessingQueue = false
        resolve()
        processQueue()
      }
      currentSource.start()
    })
  }

  function playChunk(base64Audio: string) {
    const ctx = ensureAudioContext()
    const float32Data = base64ToPCM16Float32(base64Audio)

    const audioBuffer = ctx.createBuffer(1, float32Data.length, sampleRate)
    audioBuffer.copyToChannel(float32Data, 0)

    audioQueue.push(audioBuffer)
    processQueue()
  }

  function stop() {
    audioQueue = []
    if (currentSource) {
      try {
        currentSource.stop()
      } catch {}
      currentSource = null
    }
    isProcessingQueue = false
    isPlaying.value = false
  }

  onUnmounted(() => {
    stop()
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
  })

  return {
    isPlaying: readonly(isPlaying),
    playChunk,
    stop,
    setSampleRate,
    setFormatFromMetadata
  }
}
