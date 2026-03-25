<script setup lang="ts">
interface Agent {
  agent_id: string
  name: string
}

interface Props {
  agents: Agent[]
}

defineProps<Props>()
const emit = defineEmits<{
  selectConversation: [conversationId: string]
}>()

const conversations = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const cursor = ref<string | null>(null)
const hasMore = ref(false)

// Filters
const filterAgentId = ref('')
const filterSuccess = ref('')
const filterStartAfter = ref('')
const filterStartBefore = ref('')

async function fetchConversations(append = false) {
  loading.value = true
  error.value = null

  try {
    const params: Record<string, string> = { page_size: '30' }
    if (filterAgentId.value) params.agent_id = filterAgentId.value
    if (filterSuccess.value) params.call_successful = filterSuccess.value
    if (filterStartAfter.value) {
      params.call_start_after_unix = String(Math.floor(new Date(filterStartAfter.value).getTime() / 1000))
    }
    if (filterStartBefore.value) {
      params.call_start_before_unix = String(Math.floor(new Date(filterStartBefore.value).getTime() / 1000))
    }
    if (append && cursor.value) params.cursor = cursor.value

    const data = await $fetch<any>('/api/elevenlabs/telephony/conversations', { params })
    const items = data.conversations || []

    if (append) {
      conversations.value.push(...items)
    } else {
      conversations.value = items
    }

    cursor.value = data.next_cursor || null
    hasMore.value = !!data.has_more || !!data.next_cursor
  } catch (e: any) {
    error.value = e?.data?.data?.message || 'Failed to load call history'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  cursor.value = null
  fetchConversations()
}

function clearFilters() {
  filterAgentId.value = ''
  filterSuccess.value = ''
  filterStartAfter.value = ''
  filterStartBefore.value = ''
  cursor.value = null
  fetchConversations()
}

function formatDate(timestamp: number | string): string {
  const d = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(timestamp: number | string): string {
  const d = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getSuccessBadge(val: string | boolean | undefined): { text: string; cls: string } {
  if (val === true || val === 'success') return { text: 'Success', cls: 'bg-green-500/15 text-green-400 border-green-500/25' }
  if (val === false || val === 'failure') return { text: 'Failed', cls: 'bg-accent-red/15 text-accent-red border-accent-red/25' }
  return { text: 'Unknown', cls: 'bg-surface-400/30 text-text-muted border-surface-400/30' }
}

onMounted(() => fetchConversations())
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="panel p-4">
      <div class="flex items-center gap-2 mb-3">
        <h3 class="text-xs font-bold text-text-secondary uppercase tracking-widest">Filters</h3>
        <button
          v-if="filterAgentId || filterSuccess || filterStartAfter || filterStartBefore"
          @click="clearFilters"
          class="text-[10px] text-text-muted hover:text-text-secondary transition-colors ml-auto"
        >
          Clear all
        </button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label class="label-text">Agent</label>
          <select v-model="filterAgentId" class="input-field text-xs" @change="applyFilters">
            <option value="">All agents</option>
            <option v-for="a in agents" :key="a.agent_id" :value="a.agent_id">{{ a.name }}</option>
          </select>
        </div>
        <div>
          <label class="label-text">Result</label>
          <select v-model="filterSuccess" class="input-field text-xs" @change="applyFilters">
            <option value="">All</option>
            <option value="true">Successful</option>
            <option value="false">Failed</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label class="label-text">After</label>
          <input v-model="filterStartAfter" type="date" class="input-field text-xs" @change="applyFilters" />
        </div>
        <div>
          <label class="label-text">Before</label>
          <input v-model="filterStartBefore" type="date" class="input-field text-xs" @change="applyFilters" />
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="loading && conversations.length === 0" class="card text-center py-8">
      <p class="text-sm text-text-muted">Loading call history...</p>
    </div>

    <div v-else-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
      <p class="text-xs text-red-400">{{ error }}</p>
    </div>

    <div v-else-if="conversations.length === 0" class="card text-center py-8">
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-700/50 border border-surface-500/30 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p class="text-sm text-text-muted mb-1">No conversations found</p>
      <p class="text-xs text-text-muted/70">Make a call or adjust your filters</p>
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="conv in conversations"
        :key="conv.conversation_id"
        @click="emit('selectConversation', conv.conversation_id)"
        class="card-hover w-full text-left !p-4"
      >
        <div class="flex items-center gap-4">
          <!-- Date/time -->
          <div class="shrink-0 w-20">
            <div class="text-xs font-mono text-text-primary">{{ formatTime(conv.start_time_unix_secs || conv.call_start_unix) }}</div>
            <div class="text-[10px] text-text-muted">{{ formatDate(conv.start_time_unix_secs || conv.call_start_unix) }}</div>
          </div>

          <!-- Agent name -->
          <div class="flex-1 min-w-0">
            <div class="text-sm text-text-primary truncate">{{ conv.agent_name || conv.agent_id || 'Unknown Agent' }}</div>
            <div v-if="conv.analysis?.summary" class="text-xs text-text-muted truncate mt-0.5">{{ conv.analysis.summary }}</div>
          </div>

          <!-- Duration -->
          <div class="shrink-0 text-xs font-mono text-text-secondary">
            {{ formatDuration(conv.call_duration_secs || conv.metadata?.call_duration_secs || 0) }}
          </div>

          <!-- Success badge -->
          <div class="shrink-0">
            <span :class="['text-[10px] px-2 py-0.5 rounded-full border font-semibold', getSuccessBadge(conv.call_successful || conv.analysis?.call_successful).cls]">
              {{ getSuccessBadge(conv.call_successful || conv.analysis?.call_successful).text }}
            </span>
          </div>

          <!-- Arrow -->
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-muted shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      <!-- Load more -->
      <div v-if="hasMore" class="text-center pt-2">
        <button
          @click="fetchConversations(true)"
          :disabled="loading"
          class="btn-secondary text-xs"
        >
          {{ loading ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
  </div>
</template>
