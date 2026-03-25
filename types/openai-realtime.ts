// OpenAI Realtime API Types

export type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'cedar' | 'marin'

export interface SessionConfig {
  voice: Voice
  temperature: number
  vadThreshold: number
  silenceDurationMs: number
  instructions: string
}

export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'assistant'
  text: string
  timestamp: Date
  isFinal: boolean
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected'

export interface RealtimeState {
  connectionState: ConnectionState
  isListening: boolean
  isSpeaking: boolean
  transcript: TranscriptEntry[]
  error: string | null
  sessionId: string | null
}

// Server events from OpenAI Realtime API
export interface ServerEvent {
  type: string
  event_id?: string
}

export interface SessionCreatedEvent extends ServerEvent {
  type: 'session.created'
  session: {
    id: string
    model: string
    voice: string
  }
}

export interface SessionUpdatedEvent extends ServerEvent {
  type: 'session.updated'
  session: {
    id: string
    model: string
    voice: string
  }
}

export interface ResponseAudioTranscriptDoneEvent extends ServerEvent {
  type: 'response.audio_transcript.done'
  transcript: string
}

export interface ResponseAudioTranscriptDeltaEvent extends ServerEvent {
  type: 'response.audio_transcript.delta'
  delta: string
}

export interface ResponseAudioDeltaEvent extends ServerEvent {
  type: 'response.audio.delta'
  delta: string // base64 audio
}

export interface ResponseAudioDoneEvent extends ServerEvent {
  type: 'response.audio.done'
}

export interface InputAudioBufferSpeechStartedEvent extends ServerEvent {
  type: 'input_audio_buffer.speech_started'
}

export interface InputAudioBufferSpeechStoppedEvent extends ServerEvent {
  type: 'input_audio_buffer.speech_stopped'
}

export interface ConversationItemInputAudioTranscriptionCompletedEvent extends ServerEvent {
  type: 'conversation.item.input_audio_transcription.completed'
  transcript: string
}

export interface ErrorEvent extends ServerEvent {
  type: 'error'
  error: {
    type: string
    code: string
    message: string
  }
}

// Client events to OpenAI Realtime API
export interface ClientEvent {
  type: string
  event_id?: string
}

export interface SessionUpdateEvent extends ClientEvent {
  type: 'session.update'
  session: {
    voice?: string
    instructions?: string
    temperature?: number
    turn_detection?: {
      type: 'server_vad'
      threshold?: number
      silence_duration_ms?: number
    }
  }
}

export interface InputAudioBufferAppendEvent extends ClientEvent {
  type: 'input_audio_buffer.append'
  audio: string // base64-encoded PCM16
}

export interface InputAudioBufferClearEvent extends ClientEvent {
  type: 'input_audio_buffer.clear'
}

// Ephemeral token response
export interface EphemeralTokenResponse {
  client_secret: {
    value: string
    expires_at: number
  }
}

export interface EphemeralTokenError {
  error: string
  message: string
}
