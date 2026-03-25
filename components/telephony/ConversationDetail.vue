<script setup lang="ts">
interface Props {
  conversationId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const loading = ref(true)
const error = ref<string | null>(null)
const conversation = ref<any>(null)
const audioUrl = ref<string | null>(null)
const loadingAudio = ref(false)

function formatTime(timestamp: number | string | Date): string {
  const d = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function loadConversation() {
  loading.value = true
  error.value = null
  try {
    conversation.value = await $fetch<any>(`/api/elevenlabs/telephony/conversations/${props.conversationId}`)
  } catch (e: any) {
    error.value = e?.data?.data?.message || 'Failed to load conversation details'
  } finally {
    loading.value = false
  }
}

async function loadAudio() {
  loadingAudio.value = true
  try {
    const response = await fetch(`/api/elevenlabs/telephony/conversations/${props.conversationId}/audio`)
    if (response.ok) {
      const blob = await response.blob()
      audioUrl.value = URL.createObjectURL(blob)
    }
  } catch {
    // Audio may not be available
  } finally {
    loadingAudio.value = false
  }
}

onMounted(() => {
  loadConversation()
  loadAudio()
})

onUnmounted(() => {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})

const transcript = computed(() => conversation.value?.transcript || [])
const metadata = computed(() => conversation.value?.metadata || {})
const analysis = computed(() => conversation.value?.analysis || {})
const status = computed(() => conversation.value?.status || 'unknown')
const callSuccessful = computed(() => analysis.value?.call_successful)
</script>

<template>
  <div class="panel p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-bold text-text-primary">Conversation Details</h3>
        <span
          :class="[
            'text-[10px] px-2 py-0.5 rounded-full border font-semibold',
            callSuccessful === 'success' ? 'bg-green-500/15 text-green-400 border-green-500/25' :
            callSuccessful === 'failure' ? 'bg-accent-red/15 text-accent-red border-accent-red/25' :
            'bg-surface-400/30 text-text-muted border-surface-400/30'
          ]"
        >
          {{ callSuccessful === 'success' ? 'Successful' : callSuccessful === 'failure' ? 'Failed' : 'Unknown' }}
        </span>
      </div>
      <button @click="emit('close')" class="text-text-muted hover:text-text-secondary transition-colors p-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p class="text-sm text-text-muted">Loading conversation...</p>
    </div>

    <div v-else-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
      <p class="text-xs text-red-400">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Metadata grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="bg-surface-700/50 rounded-lg p-3">
          <span class="text-[10px] text-text-muted uppercase block mb-0.5">Duration</span>
          <span class="text-sm font-mono font-semibold text-text-primary">{{ formatDuration(metadata.call_duration_secs) }}</span>
        </div>
        <div class="bg-surface-700/50 rounded-lg p-3">
          <span class="text-[10px] text-text-muted uppercase block mb-0.5">Status</span>
          <span class="text-sm font-semibold text-text-primary capitalize">{{ status }}</span>
        </div>
        <div v-if="metadata.latency" class="bg-surface-700/50 rounded-lg p-3">
          <span class="text-[10px] text-text-muted uppercase block mb-0.5">Avg Latency</span>
          <span class="text-sm font-mono font-semibold text-text-primary">{{ Math.round(metadata.latency?.avg || metadata.latency?.p50 || 0) }}ms</span>
        </div>
        <div v-if="metadata.cost != null" class="bg-surface-700/50 rounded-lg p-3">
          <span class="text-[10px] text-text-muted uppercase block mb-0.5">Cost</span>
          <span class="text-sm font-mono font-semibold text-text-primary">${{ (metadata.cost || 0).toFixed(4) }}</span>
        </div>
      </div>

      <!-- Analysis -->
      <div v-if="analysis.summary || analysis.data_collection_results" class="mb-5 bg-surface-700/30 rounded-lg p-4 border border-surface-500/20">
        <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Analysis</h4>
        <p v-if="analysis.summary" class="text-sm text-text-primary leading-relaxed mb-2">{{ analysis.summary }}</p>
        <div v-if="analysis.evaluation_criteria_results" class="space-y-1 mt-2">
          <div v-for="(result, key) in analysis.evaluation_criteria_results" :key="String(key)" class="flex items-center gap-2 text-xs">
            <span class="text-text-muted">{{ key }}:</span>
            <span :class="result === 'success' ? 'text-green-400' : result === 'failure' ? 'text-accent-red' : 'text-text-secondary'">{{ result }}</span>
          </div>
        </div>
      </div>

      <!-- Audio playback -->
      <div v-if="audioUrl" class="mb-5">
        <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Recording</h4>
        <audio :src="audioUrl" controls class="w-full h-10" />
      </div>
      <div v-else-if="loadingAudio" class="mb-5">
        <p class="text-xs text-text-muted">Loading audio...</p>
      </div>

      <!-- Transcript -->
      <div v-if="transcript.length > 0">
        <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Transcript</h4>
        <div class="space-y-2 max-h-[400px] overflow-y-auto">
          <div
            v-for="(entry, idx) in transcript"
            :key="idx"
            :class="[
              'flex gap-3 py-2.5 px-3 rounded-lg',
              entry.role === 'user' ? 'bg-surface-700/30' : 'bg-accent-amber/5'
            ]"
          >
            <div
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5',
                entry.role === 'user' ? 'bg-accent-orange/15 text-accent-orange' : 'bg-accent-amber/15 text-accent-amber'
              ]"
            >
              {{ entry.role === 'user' ? 'U' : 'AI' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span :class="['text-[10px] font-semibold uppercase tracking-wide', entry.role === 'user' ? 'text-accent-orange' : 'text-accent-amber']">
                  {{ entry.role === 'user' ? 'Caller' : 'Agent' }}
                </span>
                <span v-if="entry.time_in_call_secs != null" class="text-[10px] text-text-muted font-mono">
                  {{ formatDuration(entry.time_in_call_secs) }}
                </span>
              </div>
              <p class="text-sm text-text-primary leading-relaxed">{{ entry.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Conversation ID -->
      <div class="mt-4 pt-3 border-t border-surface-500/20">
        <span class="text-[10px] text-text-muted uppercase">Conversation ID: </span>
        <span class="text-[10px] font-mono text-text-secondary">{{ conversationId }}</span>
      </div>
    </template>
  </div>
</template>
