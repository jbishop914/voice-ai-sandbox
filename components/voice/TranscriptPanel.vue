<script setup lang="ts">
import type { TranscriptEntry, ConnectionState } from '~/types/openai-realtime'

interface Props {
  entries: readonly TranscriptEntry[]
  connectionState: ConnectionState
  isListening: boolean
  isSpeaking: boolean
  error: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  connect: []
  disconnect: []
  clearTranscript: []
}>()

const transcriptContainer = ref<HTMLElement | null>(null)

// Auto-scroll to bottom on new entries
watch(() => props.entries.length, () => {
  nextTick(() => {
    if (transcriptContainer.value) {
      transcriptContainer.value.scrollTop = transcriptContainer.value.scrollHeight
    }
  })
})

const statusLabel = computed(() => {
  if (props.isSpeaking) return 'AI Speaking'
  if (props.isListening) return 'Listening'
  if (props.connectionState === 'connected') return 'Connected'
  if (props.connectionState === 'connecting') return 'Connecting...'
  return 'Disconnected'
})

const statusClass = computed(() => {
  if (props.connectionState === 'connected') return 'text-accent-teal'
  if (props.connectionState === 'connecting') return 'text-yellow-400'
  return 'text-red-400'
})
</script>

<template>
  <div class="panel flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-surface-600/30">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-semibold text-text-primary">Conversation</h3>
        <span :class="['text-xs font-mono', statusClass]">
          {{ statusLabel }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="entries.length > 0"
          @click="emit('clearTranscript')"
          class="text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1 rounded hover:bg-surface-700"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- API Key Warning -->
    <div
      v-if="error && error.includes('OPENAI_API_KEY')"
      class="mx-4 mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
    >
      <div class="flex items-start gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-yellow-400 flex-shrink-0 mt-0.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p class="text-xs text-yellow-300/90 leading-relaxed">
          Configure <code class="font-mono bg-surface-700 px-1 py-0.5 rounded text-yellow-400">OPENAI_API_KEY</code> in your environment variables to enable live voice chat.
        </p>
      </div>
    </div>

    <!-- Error display -->
    <div
      v-else-if="error"
      class="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
    >
      <p class="text-xs text-red-400 leading-relaxed">{{ error }}</p>
    </div>

    <!-- Transcript area -->
    <div
      ref="transcriptContainer"
      class="flex-1 overflow-y-auto px-4 py-4 space-y-2"
    >
      <template v-if="entries.length > 0">
        <VoiceTranscriptEntry
          v-for="entry in entries"
          :key="entry.id"
          :entry="entry"
        />
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center h-full text-center py-12">
          <div class="w-16 h-16 rounded-2xl bg-surface-700/50 border border-surface-500/30 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <p class="text-sm text-text-muted mb-1">No conversation yet</p>
          <p class="text-xs text-text-muted/70">Connect and start speaking to begin</p>
        </div>
      </template>
    </div>

    <!-- Speaking indicator -->
    <div
      v-if="isListening || isSpeaking"
      class="px-4 py-2 border-t border-surface-600/20"
    >
      <div class="flex items-center gap-2">
        <div class="flex gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-accent-teal animate-bounce" style="animation-delay: 0ms" />
          <span class="w-1.5 h-1.5 rounded-full bg-accent-teal animate-bounce" style="animation-delay: 150ms" />
          <span class="w-1.5 h-1.5 rounded-full bg-accent-teal animate-bounce" style="animation-delay: 300ms" />
        </div>
        <span class="text-xs text-accent-teal">
          {{ isSpeaking ? 'Assistant is speaking...' : 'Listening...' }}
        </span>
      </div>
    </div>

    <!-- Connect/Disconnect button area -->
    <div class="px-5 py-4 border-t border-surface-600/30">
      <button
        v-if="connectionState === 'disconnected'"
        @click="emit('connect')"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-teal text-surface-900 font-bold text-sm hover:bg-accent-teal-dim transition-all duration-200 glow-teal"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        Start Conversation
      </button>
      <button
        v-else-if="connectionState === 'connecting'"
        disabled
        class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/20 text-yellow-400 font-bold text-sm cursor-wait border border-yellow-500/30"
      >
        <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        Connecting...
      </button>
      <button
        v-else
        @click="emit('disconnect')"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors border border-red-500/30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
        </svg>
        Disconnect
      </button>
    </div>
  </div>
</template>
