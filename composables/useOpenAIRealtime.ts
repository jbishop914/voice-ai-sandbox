import type { ConnectionState, SessionConfig, Voice } from '~/types/openai-realtime'

export function useOpenAIRealtime() {
  const connectionState = ref<ConnectionState>('disconnected')
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const error = ref<string | null>(null)
  const sessionId = ref<string | null>(null)

  const isConnected = computed(() => connectionState.value === 'connected')

  let peerConnection: RTCPeerConnection | null = null
  let dataChannel: RTCDataChannel | null = null

  const { addEntry, updateEntry, clear: clearTranscript, entries } = useTranscript()
  const { playChunk, stop: stopPlayback, isPlaying } = useAudioPlayback()
  const { startCapture, stopCapture, isCapturing, audioLevel, onAudioChunk } = useAudioCapture()

  // Current assistant entry being streamed
  let currentAssistantEntryId: string | null = null

  async function connect(config: SessionConfig) {
    try {
      error.value = null
      connectionState.value = 'connecting'

      // Step 1: Get ephemeral token from server
      const tokenResponse = await $fetch('/api/openai/ephemeral-token', {
        method: 'POST',
        body: {
          model: 'gpt-4o-realtime-preview',
          voice: config.voice
        }
      })

      if ('error' in tokenResponse) {
        error.value = (tokenResponse as any).message || 'Failed to get ephemeral token'
        connectionState.value = 'disconnected'
        return
      }

      const ephemeralKey = (tokenResponse as any).client_secret.value

      // Step 2: Create RTCPeerConnection
      peerConnection = new RTCPeerConnection()

      // Step 3: Set up audio playback for remote track
      peerConnection.ontrack = (event) => {
        const audio = new Audio()
        audio.srcObject = event.streams[0]
        audio.play().catch(console.error)
      }

      // Step 4: Get microphone and add track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => {
        peerConnection!.addTrack(track, stream)
      })

      // Step 5: Create data channel for events
      dataChannel = peerConnection.createDataChannel('oai-events')
      dataChannel.onopen = () => {
        // Send session configuration
        updateSession(config)
      }
      dataChannel.onmessage = (event) => {
        handleServerEvent(JSON.parse(event.data))
      }

      // Step 6: Create SDP offer and connect
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
        body: offer.sdp
      })

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`)
      }

      const answer: RTCSessionDescriptionInit = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text()
      }
      await peerConnection.setRemoteDescription(answer)

      connectionState.value = 'connected'
      sessionId.value = `session-${Date.now()}`
    } catch (e: any) {
      console.error('Connection error:', e)
      error.value = e.message || 'Connection failed'
      connectionState.value = 'disconnected'
      cleanup()
    }
  }

  function handleServerEvent(event: any) {
    switch (event.type) {
      case 'session.created':
        sessionId.value = event.session?.id || sessionId.value
        break

      case 'input_audio_buffer.speech_started':
        isListening.value = true
        break

      case 'input_audio_buffer.speech_stopped':
        isListening.value = false
        break

      case 'conversation.item.input_audio_transcription.completed':
        addEntry('user', event.transcript, true)
        break

      case 'response.audio_transcript.delta':
        if (!currentAssistantEntryId) {
          currentAssistantEntryId = addEntry('assistant', event.delta, false)
        } else {
          // Append to existing entry
          const entry = entries.value.find(e => e.id === currentAssistantEntryId)
          if (entry) {
            updateEntry(currentAssistantEntryId, entry.text + event.delta, false)
          }
        }
        isSpeaking.value = true
        break

      case 'response.audio_transcript.done':
        if (currentAssistantEntryId) {
          const entry = entries.value.find(e => e.id === currentAssistantEntryId)
          if (entry) {
            updateEntry(currentAssistantEntryId, event.transcript || entry.text, true)
          }
          currentAssistantEntryId = null
        }
        isSpeaking.value = false
        break

      case 'response.audio.delta':
        // Audio is handled by the remote audio track in WebRTC mode
        break

      case 'response.audio.done':
        isSpeaking.value = false
        break

      case 'error':
        error.value = event.error?.message || 'Unknown error'
        console.error('Realtime API error:', event.error)
        break
    }
  }

  function updateSession(config: SessionConfig) {
    if (!dataChannel || dataChannel.readyState !== 'open') return

    const sessionUpdate = {
      type: 'session.update',
      session: {
        voice: config.voice,
        instructions: config.instructions,
        temperature: config.temperature,
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: config.vadThreshold,
          silence_duration_ms: config.silenceDurationMs
        }
      }
    }

    dataChannel.send(JSON.stringify(sessionUpdate))
  }

  function sendAudioChunk(base64Audio: string) {
    if (!dataChannel || dataChannel.readyState !== 'open') return

    dataChannel.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: base64Audio
    }))
  }

  function cleanup() {
    if (dataChannel) {
      dataChannel.close()
      dataChannel = null
    }
    if (peerConnection) {
      peerConnection.close()
      peerConnection = null
    }
    currentAssistantEntryId = null
  }

  function disconnect() {
    cleanup()
    stopPlayback()
    stopCapture()
    connectionState.value = 'disconnected'
    isListening.value = false
    isSpeaking.value = false
    sessionId.value = null
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    connectionState: readonly(connectionState),
    isConnected,
    isListening: readonly(isListening),
    isSpeaking: readonly(isSpeaking),
    error: readonly(error),
    sessionId: readonly(sessionId),

    // Audio state
    isCapturing,
    audioLevel,
    isPlaying,

    // Transcript
    entries,
    clearTranscript,

    // Actions
    connect,
    disconnect,
    updateSession,
    sendAudioChunk
  }
}
