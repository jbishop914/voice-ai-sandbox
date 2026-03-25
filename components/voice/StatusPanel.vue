<script setup lang="ts">
import type { ConnectionState } from '~/types/openai-realtime'

interface Props {
  connectionState: ConnectionState
  audioLevel: number
  isListening: boolean
  isSpeaking: boolean
  sessionId: string | null
}

const props = defineProps<Props>()

// Session duration timer
const sessionStartTime = ref<Date | null>(null)
const sessionDuration = ref('00:00:00')
let timerInterval: ReturnType<typeof setInterval> | null = null

watch(() => props.connectionState, (newState) => {
  if (newState === 'connected') {
    sessionStartTime.value = new Date()
    timerInterval = setInterval(() => {
      if (!sessionStartTime.value) return
      const diff = Date.now() - sessionStartTime.value.getTime()
      const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0')
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
      sessionDuration.value = `${hrs}:${mins}:${secs}`
    }, 1000)
  } else {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (newState === 'disconnected') {
      sessionDuration.value = '00:00:00'
      sessionStartTime.value = null
    }
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const statusDotClass = computed(() => {
  switch (props.connectionState) {
    case 'connected': return 'status-dot-connected'
    case 'connecting': return 'status-dot-connecting'
    default: return 'status-dot-disconnected'
  }
})

const statusLabel = computed(() => {
  switch (props.connectionState) {
    case 'connected': return 'Connected'
    case 'connecting': return 'Connecting'
    default: return 'Disconnected'
  }
})
</script>

<template>
  <div class="panel p-4 h-full flex flex-col">
    <h3 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      Status & Audio
    </h3>

    <div class="flex-1 space-y-5">
      <!-- Connection Status -->
      <div class="space-y-2">
        <div class="label-text">Connection</div>
        <div class="flex items-center gap-2">
          <div :class="statusDotClass" />
          <span class="text-sm text-text-primary">{{ statusLabel }}</span>
        </div>
      </div>

      <!-- Model -->
      <div class="space-y-2">
        <div class="label-text">Model</div>
        <div class="text-xs font-mono text-accent-amber bg-surface-700 px-2.5 py-1.5 rounded-md inline-block">
          gpt-4o-realtime-preview
        </div>
      </div>

      <!-- Audio Visualizer -->
      <div class="space-y-2">
        <div class="label-text">Audio Level</div>
        <div class="bg-surface-700/50 rounded-lg p-3 border border-surface-500/30">
          <VoiceAudioVisualizer
            :level="audioLevel"
            :active="connectionState === 'connected'"
          />
        </div>
      </div>

      <!-- Activity -->
      <div class="space-y-2">
        <div class="label-text">Activity</div>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="text-text-secondary">Listening</span>
            <span :class="isListening ? 'text-accent-amber' : 'text-text-muted'">
              {{ isListening ? 'Active' : 'Idle' }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-text-secondary">AI Speaking</span>
            <span :class="isSpeaking ? 'text-accent-amber' : 'text-text-muted'">
              {{ isSpeaking ? 'Active' : 'Idle' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Session Duration -->
      <div class="space-y-2">
        <div class="label-text">Session Duration</div>
        <div class="text-lg font-mono text-text-primary tracking-wider">
          {{ sessionDuration }}
        </div>
      </div>

      <!-- Token Usage -->
      <div class="space-y-2">
        <div class="label-text">Token Usage</div>
        <div class="text-sm font-mono text-text-muted">
          Tokens: --
        </div>
      </div>

      <!-- Session ID -->
      <div v-if="sessionId" class="space-y-2">
        <div class="label-text">Session ID</div>
        <div class="text-[10px] font-mono text-text-muted break-all bg-surface-700/50 px-2 py-1.5 rounded">
          {{ sessionId }}
        </div>
      </div>
    </div>
  </div>
</template>
