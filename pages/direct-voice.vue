<script setup lang="ts">
import type { SessionConfig } from '~/types/openai-realtime'

definePageMeta({
  title: 'Direct Voice Chat'
})

const {
  connectionState,
  isConnected,
  isListening,
  isSpeaking,
  error,
  sessionId,
  audioLevel,
  entries,
  clearTranscript,
  connect,
  disconnect,
  updateSession
} = useOpenAIRealtime()

const currentConfig = ref<SessionConfig>({
  voice: 'alloy',
  temperature: 0.8,
  vadThreshold: 0.5,
  silenceDurationMs: 500,
  instructions: 'You are a helpful voice assistant.'
})

function handleConnect() {
  connect(currentConfig.value)
}

function handleDisconnect() {
  disconnect()
}

function handleApplyConfig(config: SessionConfig) {
  currentConfig.value = config
  if (isConnected.value) {
    updateSession(config)
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Page header -->
    <div class="flex items-center gap-3 px-5 py-3 border-b border-surface-600/30 bg-surface-800/30 flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-teal">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
      </svg>
      <h1 class="text-sm font-semibold text-text-primary">Direct Voice Chat</h1>
      <span class="badge-active text-[10px]">Active</span>
    </div>

    <!-- Three-column layout -->
    <div class="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">
      <!-- Left: Config Panel -->
      <div class="w-64 flex-shrink-0 hidden lg:block">
        <VoiceSessionConfig @apply-config="handleApplyConfig" />
      </div>

      <!-- Center: Transcript -->
      <div class="flex-1 min-w-0">
        <VoiceTranscriptPanel
          :entries="entries"
          :connection-state="connectionState"
          :is-listening="isListening"
          :is-speaking="isSpeaking"
          :error="error"
          @connect="handleConnect"
          @disconnect="handleDisconnect"
          @clear-transcript="clearTranscript"
        />
      </div>

      <!-- Right: Status Panel -->
      <div class="w-56 flex-shrink-0 hidden xl:block">
        <VoiceStatusPanel
          :connection-state="connectionState"
          :audio-level="audioLevel"
          :is-listening="isListening"
          :is-speaking="isSpeaking"
          :session-id="sessionId"
        />
      </div>
    </div>
  </div>
</template>
