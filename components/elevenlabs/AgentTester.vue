<script setup lang="ts">
interface Props {
  agentId: string | null
  agentName?: string
  voiceName?: string
}

const props = defineProps<Props>()

const { connectionState, isListening, isSpeaking, transcript, error, audioLevel, connectToAgent, disconnect } = useElevenLabs()

const transcriptContainer = ref<HTMLElement | null>(null)

// Auto-scroll transcript
watch(() => transcript.value.length, () => {
  nextTick(() => {
    if (transcriptContainer.value) {
      transcriptContainer.value.scrollTop = transcriptContainer.value.scrollHeight
    }
  })
})

function handleConnect() {
  if (props.agentId) {
    connectToAgent(props.agentId)
  }
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
</script>

<template>
  <div class="panel flex flex-col h-full">
    <!-- Header -->
    <div class="px-5 py-4 border-b border-surface-500/30">
      <h3 class="text-sm font-semibold text-text-primary mb-1">Agent Tester</h3>
      <template v-if="agentId">
        <p class="text-xs text-text-secondary">
          {{ agentName || 'Unnamed Agent' }}
          <span v-if="voiceName" class="text-text-muted"> &middot; {{ voiceName }}</span>
        </p>
      </template>
      <p v-else class="text-xs text-text-muted">Select an agent to test</p>
    </div>

    <!-- No agent selected placeholder -->
    <div v-if="!agentId" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div class="w-16 h-16 rounded-2xl bg-surface-700/50 border border-surface-500/30 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
          <path d="M2 12h2M6 8v8M10 5v14M14 8v8M18 6v12M22 12h-2" />
        </svg>
      </div>
      <p class="text-sm text-text-muted mb-1">No agent selected</p>
      <p class="text-xs text-text-muted/70">Select an agent from the list or create one to start testing</p>
    </div>

    <!-- Agent selected: test interface -->
    <template v-else>
      <!-- Connection status -->
      <div class="px-5 py-2 border-b border-surface-500/20 flex items-center gap-2">
        <div
          :class="[
            'status-dot',
            connectionState === 'connected' ? 'status-dot-connected' :
            connectionState === 'connecting' ? 'status-dot-connecting' :
            'status-dot-disconnected'
          ]"
        />
        <span class="text-xs font-mono text-text-secondary">
          {{ connectionState === 'connected' ? (isSpeaking ? 'Agent speaking' : isListening ? 'Listening' : 'Connected') : connectionState === 'connecting' ? 'Connecting...' : 'Disconnected' }}
        </span>
      </div>

      <!-- Audio Visualizer -->
      <div v-if="connectionState === 'connected'" class="px-5 py-3 border-b border-surface-500/20">
        <VoiceAudioVisualizer :level="audioLevel" :active="isListening || isSpeaking" />
      </div>

      <!-- Error -->
      <div v-if="error" class="mx-4 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p class="text-xs text-red-400 leading-relaxed">{{ error }}</p>
      </div>

      <!-- Transcript area -->
      <div ref="transcriptContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <template v-if="transcript.length > 0">
          <div
            v-for="(entry, idx) in transcript"
            :key="idx"
            :class="[
              'flex gap-3 py-3 px-4 rounded-lg transition-colors',
              entry.speaker === 'user' ? 'bg-surface-700/30' : 'bg-accent-amber/5'
            ]"
          >
            <div
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5',
                entry.speaker === 'user'
                  ? 'bg-accent-orange/15 text-accent-orange'
                  : 'bg-accent-amber/15 text-accent-amber'
              ]"
            >
              {{ entry.speaker === 'user' ? 'U' : 'AI' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span
                  :class="[
                    'text-xs font-semibold uppercase tracking-wide',
                    entry.speaker === 'user' ? 'text-accent-orange' : 'text-accent-amber'
                  ]"
                >
                  {{ entry.speaker === 'user' ? 'You' : 'Agent' }}
                </span>
                <span class="text-[10px] text-text-muted font-mono">
                  {{ formatTime(entry.timestamp) }}
                </span>
              </div>
              <p class="text-sm text-text-primary leading-relaxed">{{ entry.text }}</p>
            </div>
          </div>
        </template>
        <template v-else-if="connectionState === 'disconnected'">
          <div class="flex flex-col items-center justify-center h-full text-center py-8">
            <p class="text-sm text-text-muted mb-1">Ready to test</p>
            <p class="text-xs text-text-muted/70">Click "Start Test Call" to begin</p>
          </div>
        </template>
      </div>

      <!-- Speaking indicator -->
      <div v-if="isListening || isSpeaking" class="px-4 py-2 border-t border-surface-500/20">
        <div class="flex items-center gap-2">
          <div class="flex gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-accent-amber animate-bounce" style="animation-delay: 0ms" />
            <span class="w-1.5 h-1.5 rounded-full bg-accent-amber animate-bounce" style="animation-delay: 150ms" />
            <span class="w-1.5 h-1.5 rounded-full bg-accent-amber animate-bounce" style="animation-delay: 300ms" />
          </div>
          <span class="text-xs text-accent-amber">
            {{ isSpeaking ? 'Agent is speaking...' : 'Listening...' }}
          </span>
        </div>
      </div>

      <!-- Connect/Disconnect button -->
      <div class="px-5 py-4 border-t border-surface-500/30">
        <button
          v-if="connectionState === 'disconnected'"
          @click="handleConnect"
          class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-amber text-surface-900 font-bold text-sm hover:bg-accent-amber-dim transition-all duration-200 glow-amber"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Start Test Call
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
          @click="disconnect"
          class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors border border-red-500/30"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
          </svg>
          End Call
        </button>
      </div>
    </template>
  </div>
</template>
