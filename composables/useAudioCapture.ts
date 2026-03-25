export function useAudioCapture() {
  const isCapturing = ref(false)
  const audioLevel = ref(0)
  const error = ref<string | null>(null)

  let audioContext: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let analyserNode: AnalyserNode | null = null
  let animationFrameId: number | null = null
  let scriptProcessor: ScriptProcessorNode | null = null

  const onAudioChunk = ref<((base64Audio: string) => void) | null>(null)

  function float32ToPCM16Base64(float32Array: Float32Array): string {
    const pcm16 = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    const bytes = new Uint8Array(pcm16.buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  function updateAudioLevel() {
    if (!analyserNode) return
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount)
    analyserNode.getByteTimeDomainData(dataArray)

    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const x = (dataArray[i] - 128) / 128
      sum += x * x
    }
    const rms = Math.sqrt(sum / dataArray.length)
    audioLevel.value = Math.min(1, rms * 3) // amplify for visual

    animationFrameId = requestAnimationFrame(updateAudioLevel)
  }

  async function startCapture() {
    try {
      error.value = null
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      // ElevenLabs Conversational AI expects 16kHz PCM16 mono input
      // OpenAI Realtime API expects 24kHz PCM16 mono input
      // Default to 16kHz for ElevenLabs; OpenAI composable handles its own capture
      audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(mediaStream)

      // Analyser for audio level visualization
      analyserNode = audioContext.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)

      // Script processor for capturing PCM data
      scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1)
      source.connect(scriptProcessor)
      scriptProcessor.connect(audioContext.destination)

      scriptProcessor.onaudioprocess = (event) => {
        if (!isCapturing.value) return
        const inputData = event.inputBuffer.getChannelData(0)
        const base64Audio = float32ToPCM16Base64(inputData)
        if (onAudioChunk.value) {
          onAudioChunk.value(base64Audio)
        }
      }

      isCapturing.value = true
      updateAudioLevel()
    } catch (e: any) {
      error.value = e.message || 'Failed to access microphone'
      console.error('Audio capture error:', e)
    }
  }

  function stopCapture() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    if (scriptProcessor) {
      scriptProcessor.disconnect()
      scriptProcessor = null
    }
    if (analyserNode) {
      analyserNode.disconnect()
      analyserNode = null
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      mediaStream = null
    }
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
    isCapturing.value = false
    audioLevel.value = 0
  }

  onUnmounted(() => {
    stopCapture()
  })

  return {
    isCapturing: readonly(isCapturing),
    audioLevel: readonly(audioLevel),
    error: readonly(error),
    onAudioChunk,
    startCapture,
    stopCapture
  }
}
