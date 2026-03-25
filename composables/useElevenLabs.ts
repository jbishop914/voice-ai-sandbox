export interface ElevenLabsTranscriptEntry {
  speaker: 'user' | 'agent'
  text: string
  timestamp: Date
}

export function useElevenLabs() {
  const connectionState = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const isListening = ref(false)
  const isSpeaking = ref(false)
  const transcript = ref<ElevenLabsTranscriptEntry[]>([])
  const error = ref<string | null>(null)

  const audioCapture = useAudioCapture()
  const audioPlayback = useAudioPlayback()

  let ws: WebSocket | null = null
  let conversationId: string | null = null

  function addTranscriptEntry(speaker: 'user' | 'agent', text: string) {
    transcript.value.push({ speaker, text, timestamp: new Date() })
  }

  function handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data)

      switch (msg.type) {
        case 'conversation_initiation_metadata':
          conversationId = msg.conversation_initiation_metadata_event?.conversation_id || null
          connectionState.value = 'connected'
          isListening.value = true
          error.value = null
          break

        case 'audio':
          if (msg.audio_event?.audio_base_64) {
            isSpeaking.value = true
            audioPlayback.playChunk(msg.audio_event.audio_base_64)
          }
          break

        case 'agent_response':
          if (msg.agent_response_event?.agent_response) {
            addTranscriptEntry('agent', msg.agent_response_event.agent_response)
          }
          isSpeaking.value = false
          isListening.value = true
          break

        case 'user_transcript':
          if (msg.user_transcription_event?.user_transcript) {
            addTranscriptEntry('user', msg.user_transcription_event.user_transcript)
          }
          break

        case 'interruption':
          audioPlayback.stop()
          isSpeaking.value = false
          isListening.value = true
          break

        case 'ping':
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'pong',
              event_id: msg.ping_event?.event_id
            }))
          }
          break
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e)
    }
  }

  async function connectToAgent(agentId: string) {
    if (connectionState.value !== 'disconnected') return

    connectionState.value = 'connecting'
    error.value = null
    transcript.value = []

    try {
      // Get signed URL from our server
      const { signed_url } = await $fetch<{ signed_url: string }>('/api/elevenlabs/signed-url', {
        params: { agent_id: agentId }
      })

      if (!signed_url) {
        throw new Error('Failed to get signed URL')
      }

      // Open WebSocket
      ws = new WebSocket(signed_url)

      ws.onopen = async () => {
        // Start microphone capture
        await audioCapture.startCapture()

        // Stream audio chunks to WebSocket
        audioCapture.onAudioChunk.value = (base64Audio: string) => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              user_audio_chunk: base64Audio
            }))
          }
        }
      }

      ws.onmessage = handleMessage

      ws.onerror = () => {
        error.value = 'WebSocket connection error'
        disconnect()
      }

      ws.onclose = () => {
        if (connectionState.value === 'connected' || connectionState.value === 'connecting') {
          connectionState.value = 'disconnected'
          isListening.value = false
          isSpeaking.value = false
          audioCapture.stopCapture()
          audioPlayback.stop()
        }
      }
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Failed to connect to agent'
      connectionState.value = 'disconnected'
    }
  }

  function disconnect() {
    if (ws) {
      ws.close()
      ws = null
    }
    audioCapture.stopCapture()
    audioPlayback.stop()
    connectionState.value = 'disconnected'
    isListening.value = false
    isSpeaking.value = false
    conversationId = null
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connectionState: readonly(connectionState),
    isListening: readonly(isListening),
    isSpeaking: readonly(isSpeaking),
    transcript: readonly(transcript),
    error: readonly(error),
    audioLevel: audioCapture.audioLevel,
    connectToAgent,
    disconnect
  }
}
