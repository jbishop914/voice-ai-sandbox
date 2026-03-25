<script setup lang="ts">
definePageMeta({
  title: 'ElevenLabs Studio'
})

// ── State ──────────────────────────────────────────────────
const voices = ref<any[]>([])
const agents = ref<any[]>([])
const loadingVoices = ref(false)
const loadingAgents = ref(false)
const apiKeyMissing = ref(false)
const pageError = ref<string | null>(null)

// Agent builder form
const newAgentName = ref('')
const newAgentPrompt = ref('You are a helpful assistant.')
const newAgentFirstMessage = ref('Hello! How can I help you today?')
const newAgentVoiceId = ref('')
const newAgentModel = ref('eleven_flash_v2')
const newAgentStability = ref(0.5)
const newAgentSimilarity = ref(0.8)
const newAgentSpeed = ref(1.0)
const creatingAgent = ref(false)
const createError = ref<string | null>(null)

// Agent tester
const selectedAgentId = ref<string | null>(null)
const selectedAgentName = ref<string | undefined>()
const selectedAgentVoiceName = ref<string | undefined>()

// Edit mode
const editingAgentId = ref<string | null>(null)
const editAgentName = ref('')
const editAgentPrompt = ref('')
const editAgentFirstMessage = ref('')
const editAgentVoiceId = ref('')
const editAgentModel = ref('eleven_flash_v2')
const editAgentStability = ref(0.5)
const editAgentSimilarity = ref(0.8)
const editAgentSpeed = ref(1.0)
const savingEdit = ref(false)

// UI mode
const showCreateForm = ref(false)
const showTester = ref(false)

// Search & sort
const searchQuery = ref('')
const sortMode = ref<'name-asc' | 'name-desc' | 'newest' | 'oldest'>('name-asc')

const ttsModels = [
  { value: 'eleven_flash_v2', label: 'Flash v2' },
  { value: 'eleven_flash_v2_5', label: 'Flash v2.5' },
  { value: 'eleven_v3', label: 'v3' }
]

// ── Computed ───────────────────────────────────────────────
const filteredAgents = computed(() => {
  let list = [...agents.value]
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter((a: any) =>
      a.name?.toLowerCase().includes(q)
    )
  }
  switch (sortMode.value) {
    case 'name-asc':
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      break
    case 'name-desc':
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
      break
    case 'newest':
      list.reverse()
      break
    case 'oldest':
      break
  }
  return list
})

const selectedAgent = computed(() =>
  agents.value.find((a: any) => a.agent_id === selectedAgentId.value)
)

const selectedAgentConfig = computed(() => selectedAgent.value?.conversation_config || {})
const selectedAgentTts = computed(() => selectedAgentConfig.value?.tts || {})
const selectedAgentPromptConfig = computed(() => selectedAgentConfig.value?.agent?.prompt || {})

function getTtsModelLabel(modelId: string): string {
  return ttsModels.find(m => m.value === modelId)?.label || modelId || 'Default'
}

function getVoiceName(voiceId: string): string {
  const voice = voices.value.find((v: any) => v.voice_id === voiceId)
  return voice?.name || 'Default'
}

function getVoiceCategory(voiceId: string): string {
  const voice = voices.value.find((v: any) => v.voice_id === voiceId)
  return voice?.category || ''
}

function getCategoryBadgeClass(category: string): string {
  if (category === 'cloned') return 'bg-accent-amber/15 text-accent-amber border-accent-amber/25'
  if (category === 'professional') return 'bg-accent-orange/15 text-accent-orange border-accent-orange/25'
  return 'bg-surface-600 text-text-muted border-surface-500/30'
}

// ── Fetch functions ────────────────────────────────────────
async function fetchVoices() {
  loadingVoices.value = true
  try {
    const data = await $fetch<any[]>('/api/elevenlabs/voices')
    voices.value = data
    apiKeyMissing.value = false
  } catch (e: any) {
    if (e?.data?.data?.error === 'missing_api_key') {
      apiKeyMissing.value = true
    } else {
      pageError.value = e?.data?.data?.message || 'Failed to load voices'
    }
  } finally {
    loadingVoices.value = false
  }
}

async function fetchAgents() {
  loadingAgents.value = true
  try {
    const data = await $fetch<any[]>('/api/elevenlabs/agents')
    agents.value = data
  } catch (e: any) {
    if (e?.data?.data?.error !== 'missing_api_key') {
      pageError.value = e?.data?.data?.message || 'Failed to load agents'
    }
  } finally {
    loadingAgents.value = false
  }
}

// ── Agent actions ──────────────────────────────────────────
function selectAgent(agentId: string) {
  selectedAgentId.value = agentId
  const agent = agents.value.find((a: any) => a.agent_id === agentId)
  selectedAgentName.value = agent?.name
  const voiceId = agent?.conversation_config?.tts?.voice_id
  selectedAgentVoiceName.value = voiceId ? getVoiceName(voiceId) : undefined
  // Close forms when selecting
  editingAgentId.value = null
  showCreateForm.value = false
  showTester.value = false
}

function selectForTest(agentId: string) {
  selectAgent(agentId)
  showTester.value = true
}

function openTester() {
  showTester.value = true
}

function closeTester() {
  showTester.value = false
}

function openCreateForm() {
  showCreateForm.value = true
  editingAgentId.value = null
  showTester.value = false
}

function cancelCreate() {
  showCreateForm.value = false
}

async function createAgent() {
  if (!newAgentName.value.trim()) {
    createError.value = 'Agent name is required'
    return
  }
  if (!newAgentVoiceId.value) {
    createError.value = 'Please select a voice'
    return
  }

  creatingAgent.value = true
  createError.value = null

  try {
    const result = await $fetch<any>('/api/elevenlabs/agents', {
      method: 'POST',
      body: {
        name: newAgentName.value.trim(),
        conversation_config: {
          agent: {
            prompt: {
              prompt: newAgentPrompt.value,
              first_message: newAgentFirstMessage.value,
              tools: []
            },
            language: 'en'
          },
          tts: {
            voice_id: newAgentVoiceId.value,
            model_id: newAgentModel.value,
            stability: newAgentStability.value,
            similarity_boost: newAgentSimilarity.value,
            speed: newAgentSpeed.value
          }
        }
      }
    })

    await fetchAgents()

    // Auto-select the newly created agent
    const newId = result?.agent_id
    if (newId) {
      selectAgent(newId)
    }

    // Reset form
    newAgentName.value = ''
    newAgentPrompt.value = 'You are a helpful assistant.'
    newAgentFirstMessage.value = 'Hello! How can I help you today?'
    newAgentVoiceId.value = ''
    newAgentModel.value = 'eleven_flash_v2'
    newAgentStability.value = 0.5
    newAgentSimilarity.value = 0.8
    newAgentSpeed.value = 1.0
    showCreateForm.value = false
  } catch (e: any) {
    createError.value = e?.data?.data?.message || 'Failed to create agent'
  } finally {
    creatingAgent.value = false
  }
}

async function startEdit(agentId: string) {
  editingAgentId.value = agentId
  showCreateForm.value = false
  showTester.value = false
  try {
    const agent = await $fetch<any>(`/api/elevenlabs/agents/${agentId}`)
    editAgentName.value = agent.name || ''
    editAgentPrompt.value = agent.conversation_config?.agent?.prompt?.prompt || ''
    editAgentFirstMessage.value = agent.conversation_config?.agent?.prompt?.first_message || ''
    editAgentVoiceId.value = agent.conversation_config?.tts?.voice_id || ''
    editAgentModel.value = agent.conversation_config?.tts?.model_id || 'eleven_flash_v2'
    editAgentStability.value = agent.conversation_config?.tts?.stability ?? 0.5
    editAgentSimilarity.value = agent.conversation_config?.tts?.similarity_boost ?? 0.8
    editAgentSpeed.value = agent.conversation_config?.tts?.speed ?? 1.0
  } catch (e: any) {
    pageError.value = 'Failed to load agent details'
    editingAgentId.value = null
  }
}

async function saveEdit() {
  if (!editingAgentId.value) return

  savingEdit.value = true
  try {
    await $fetch(`/api/elevenlabs/agents/${editingAgentId.value}`, {
      method: 'PATCH',
      body: {
        name: editAgentName.value.trim(),
        conversation_config: {
          agent: {
            prompt: {
              prompt: editAgentPrompt.value,
              first_message: editAgentFirstMessage.value
            }
          },
          tts: {
            voice_id: editAgentVoiceId.value,
            model_id: editAgentModel.value,
            stability: editAgentStability.value,
            similarity_boost: editAgentSimilarity.value,
            speed: editAgentSpeed.value
          }
        }
      }
    })
    await fetchAgents()
    editingAgentId.value = null
  } catch (e: any) {
    pageError.value = e?.data?.data?.message || 'Failed to update agent'
  } finally {
    savingEdit.value = false
  }
}

function cancelEdit() {
  editingAgentId.value = null
}

function copyAgentId() {
  if (selectedAgentId.value) {
    navigator.clipboard?.writeText(selectedAgentId.value)
  }
}

// ── Lifecycle ──────────────────────────────────────────────
onMounted(() => {
  fetchVoices()
  fetchAgents()
})
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] overflow-hidden">
    <!-- Left Panel: Agent List + Detail + Edit/Create (~60%) -->
    <div class="flex-[3] overflow-y-auto border-r border-surface-500/20 p-6 lg:p-8">
    <!-- Section 1: Page Header -->
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-amber">
          <path d="M2 12h2M6 8v8M10 5v14M14 8v8M18 6v12M22 12h-2" />
        </svg>
      </div>
      <div>
        <h1 class="text-xl font-bold text-text-primary">ElevenLabs Studio</h1>
        <p class="text-xs text-text-secondary">Create voice agents, assign custom voices, and test them live</p>
      </div>
    </div>

    <!-- API Key Warning -->
    <div v-if="apiKeyMissing" class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
      <div class="flex items-start gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-yellow-400 shrink-0 mt-0.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-yellow-300 mb-1">ElevenLabs API Key Required</p>
          <p class="text-xs text-yellow-300/80 leading-relaxed">
            Configure <code class="font-mono bg-surface-700 px-1.5 py-0.5 rounded text-yellow-400">ELEVENLABS_API_KEY</code> in your environment variables to enable voice agents, voice selection, and live testing.
          </p>
        </div>
      </div>
    </div>

    <!-- Page Error -->
    <div v-if="pageError" class="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
      <div class="flex items-center justify-between">
        <p class="text-xs text-red-400">{{ pageError }}</p>
        <button @click="pageError = null" class="text-red-400 hover:text-red-300 text-xs">Dismiss</button>
      </div>
    </div>

    <template v-if="!apiKeyMissing">
      <!-- Section 2: Agent List -->
      <div class="mb-6">
        <!-- Toolbar -->
        <div class="flex items-center gap-3 mb-3">
          <!-- Search -->
          <div class="flex-1 relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="input-field !pl-9 !py-1.5 text-xs"
              placeholder="Search agents..."
            />
          </div>
          <!-- Sort -->
          <select v-model="sortMode" class="input-field !w-auto !py-1.5 text-xs">
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <!-- New Agent button -->
          <button
            @click="openCreateForm"
            class="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5 shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Agent
          </button>
        </div>

        <!-- Agent list -->
        <div class="panel overflow-hidden">
          <div v-if="loadingAgents" class="text-center py-8">
            <p class="text-sm text-text-muted">Loading agents...</p>
          </div>
          <div v-else-if="agents.length === 0" class="text-center py-8">
            <p class="text-sm text-text-muted mb-1">No agents yet</p>
            <p class="text-xs text-text-muted/70">Click "New Agent" to create your first one</p>
          </div>
          <div v-else-if="filteredAgents.length === 0" class="text-center py-6">
            <p class="text-xs text-text-muted">No agents match "{{ searchQuery }}"</p>
          </div>
          <div v-else class="max-h-[480px] overflow-y-auto">
            <ElevenlabsAgentCard
              v-for="agent in filteredAgents"
              :key="agent.agent_id"
              :agent="agent"
              :voice-name="getVoiceName(agent.conversation_config?.tts?.voice_id)"
              :selected="selectedAgentId === agent.agent_id"
              @select="selectAgent"
            />
          </div>
        </div>
      </div>

      <!-- Section 3: Agent Detail Panel (read-only) -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="selectedAgent && !editingAgentId && !showCreateForm" class="mb-6 panel p-5">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-lg font-bold text-text-primary">{{ selectedAgent.name }}</h2>
              <button
                @click="copyAgentId"
                class="flex items-center gap-1.5 mt-0.5 group"
                title="Copy agent ID"
              >
                <span class="text-[10px] font-mono text-text-muted/60 group-hover:text-text-muted transition-colors">{{ selectedAgentId }}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-muted/40 group-hover:text-text-muted transition-colors">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
            <!-- Action buttons -->
            <div class="flex items-center gap-2">
              <button
                @click="openTester"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-amber text-surface-900 hover:bg-accent-amber-dim transition-colors"
              >
                Test Agent
              </button>
              <button
                @click="startEdit(selectedAgentId!)"
                class="btn-secondary !px-3 !py-1.5 text-xs"
              >
                Edit Agent
              </button>
              <NuxtLink
                to="/telephony-lab"
                class="btn-secondary !px-3 !py-1.5 text-xs"
              >
                Create Call
              </NuxtLink>
            </div>
          </div>

          <!-- Detail grid -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            <!-- Voice -->
            <div class="bg-surface-700/40 rounded-lg p-3">
              <span class="text-[10px] text-text-muted uppercase block mb-1">Voice</span>
              <span class="text-sm font-semibold text-text-primary">{{ getVoiceName(selectedAgentTts.voice_id) }}</span>
              <span
                v-if="getVoiceCategory(selectedAgentTts.voice_id)"
                :class="[
                  'text-[10px] px-1.5 py-0.5 rounded-full border ml-2 inline-block',
                  getCategoryBadgeClass(getVoiceCategory(selectedAgentTts.voice_id))
                ]"
              >
                {{ getVoiceCategory(selectedAgentTts.voice_id) }}
              </span>
            </div>
            <!-- TTS Model -->
            <div class="bg-surface-700/40 rounded-lg p-3">
              <span class="text-[10px] text-text-muted uppercase block mb-1">TTS Model</span>
              <span class="text-sm font-mono text-text-primary">{{ getTtsModelLabel(selectedAgentTts.model_id) }}</span>
            </div>
            <!-- Language -->
            <div class="bg-surface-700/40 rounded-lg p-3">
              <span class="text-[10px] text-text-muted uppercase block mb-1">Language</span>
              <span class="text-sm font-mono text-text-primary">{{ selectedAgentConfig?.agent?.language || 'en' }}</span>
            </div>
            <!-- Stability -->
            <div class="bg-surface-700/40 rounded-lg p-3">
              <span class="text-[10px] text-text-muted uppercase block mb-1">Stability</span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-mono text-text-primary">{{ (selectedAgentTts.stability ?? 0.5).toFixed(2) }}</span>
                <div class="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                  <div class="h-full bg-accent-amber rounded-full" :style="{ width: `${(selectedAgentTts.stability ?? 0.5) * 100}%` }" />
                </div>
              </div>
            </div>
            <!-- Similarity -->
            <div class="bg-surface-700/40 rounded-lg p-3">
              <span class="text-[10px] text-text-muted uppercase block mb-1">Similarity</span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-mono text-text-primary">{{ (selectedAgentTts.similarity_boost ?? 0.8).toFixed(2) }}</span>
                <div class="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                  <div class="h-full bg-accent-amber rounded-full" :style="{ width: `${(selectedAgentTts.similarity_boost ?? 0.8) * 100}%` }" />
                </div>
              </div>
            </div>
            <!-- Speed -->
            <div class="bg-surface-700/40 rounded-lg p-3">
              <span class="text-[10px] text-text-muted uppercase block mb-1">Speed</span>
              <span class="text-sm font-mono text-text-primary">{{ (selectedAgentTts.speed ?? 1.0).toFixed(2) }}</span>
            </div>
          </div>

          <!-- System Prompt -->
          <div class="mb-4">
            <span class="text-[10px] text-text-muted uppercase block mb-1.5">System Prompt</span>
            <div class="bg-surface-700 rounded-lg p-3 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap max-h-[160px] overflow-y-auto">{{ selectedAgentPromptConfig.prompt || '—' }}</div>
          </div>

          <!-- First Message -->
          <div>
            <span class="text-[10px] text-text-muted uppercase block mb-1.5">First Message</span>
            <div class="bg-surface-700 rounded-lg p-3 text-sm text-text-secondary leading-relaxed">{{ selectedAgentPromptConfig.first_message || '—' }}</div>
          </div>
        </div>
      </Transition>

      <!-- Placeholder when no agent selected and no form open -->
      <div v-if="!selectedAgent && !editingAgentId && !showCreateForm && agents.length > 0" class="mb-6 panel p-8 text-center">
        <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-700/50 border border-surface-500/30 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <p class="text-sm text-text-muted mb-0.5">Select an agent from the list above to view details</p>
        <p class="text-xs text-text-muted/60">Or click "New Agent" to create one</p>
      </div>



      <!-- Section 4: Edit Agent Form -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="editingAgentId" class="mb-6 panel p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-bold text-text-secondary uppercase tracking-widest">
              Editing: <span class="text-text-primary normal-case">{{ editAgentName }}</span>
            </h2>
            <button @click="cancelEdit" class="text-xs text-text-muted hover:text-text-secondary transition-colors">Cancel</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="label-text">Agent Name</label>
              <input v-model="editAgentName" type="text" class="input-field" placeholder="My Agent" />
            </div>

            <div>
              <label class="label-text">System Prompt</label>
              <textarea v-model="editAgentPrompt" class="input-field min-h-[120px] resize-y" placeholder="You are a helpful assistant." />
            </div>

            <div>
              <label class="label-text">First Message</label>
              <input v-model="editAgentFirstMessage" type="text" class="input-field" placeholder="Hello!" />
            </div>

            <div>
              <label class="label-text">Voice</label>
              <ElevenlabsVoiceSelector v-model="editAgentVoiceId" :voices="voices" :loading="loadingVoices" />
            </div>

            <div>
              <label class="label-text">TTS Model</label>
              <select v-model="editAgentModel" class="input-field">
                <option v-for="m in ttsModels" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="label-text">Stability</label>
                <input v-model.number="editAgentStability" type="range" min="0" max="1" step="0.05" class="w-full accent-accent-amber" />
                <span class="text-xs text-text-muted font-mono">{{ editAgentStability.toFixed(2) }}</span>
              </div>
              <div>
                <label class="label-text">Similarity</label>
                <input v-model.number="editAgentSimilarity" type="range" min="0" max="1" step="0.05" class="w-full accent-accent-amber" />
                <span class="text-xs text-text-muted font-mono">{{ editAgentSimilarity.toFixed(2) }}</span>
              </div>
              <div>
                <label class="label-text">Speed</label>
                <input v-model.number="editAgentSpeed" type="range" min="0.7" max="1.2" step="0.05" class="w-full accent-accent-amber" />
                <span class="text-xs text-text-muted font-mono">{{ editAgentSpeed.toFixed(2) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                @click="saveEdit"
                :disabled="savingEdit"
                class="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <svg v-if="savingEdit" class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                {{ savingEdit ? 'Saving...' : 'Save Changes' }}
              </button>
              <button @click="cancelEdit" class="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Section 5: Create New Agent Form -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showCreateForm" class="mb-6 panel p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-bold text-text-secondary uppercase tracking-widest">Create New Agent</h2>
            <button @click="cancelCreate" class="text-xs text-text-muted hover:text-text-secondary transition-colors">Cancel</button>
          </div>

          <div v-if="createError" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p class="text-xs text-red-400">{{ createError }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="label-text">Agent Name</label>
              <input v-model="newAgentName" type="text" class="input-field" placeholder="My Voice Agent" />
            </div>

            <div>
              <label class="label-text">System Prompt</label>
              <textarea v-model="newAgentPrompt" class="input-field min-h-[120px] resize-y" placeholder="You are a helpful assistant." />
            </div>

            <div>
              <label class="label-text">First Message</label>
              <input v-model="newAgentFirstMessage" type="text" class="input-field" placeholder="Hello! How can I help you today?" />
            </div>

            <div>
              <label class="label-text">Voice</label>
              <ElevenlabsVoiceSelector v-model="newAgentVoiceId" :voices="voices" :loading="loadingVoices" />
            </div>

            <div>
              <label class="label-text">TTS Model</label>
              <select v-model="newAgentModel" class="input-field">
                <option v-for="m in ttsModels" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="label-text">Stability</label>
                <input v-model.number="newAgentStability" type="range" min="0" max="1" step="0.05" class="w-full accent-accent-amber" />
                <span class="text-xs text-text-muted font-mono">{{ newAgentStability.toFixed(2) }}</span>
              </div>
              <div>
                <label class="label-text">Similarity Boost</label>
                <input v-model.number="newAgentSimilarity" type="range" min="0" max="1" step="0.05" class="w-full accent-accent-amber" />
                <span class="text-xs text-text-muted font-mono">{{ newAgentSimilarity.toFixed(2) }}</span>
              </div>
              <div>
                <label class="label-text">Speed</label>
                <input v-model.number="newAgentSpeed" type="range" min="0.7" max="1.2" step="0.05" class="w-full accent-accent-amber" />
                <span class="text-xs text-text-muted font-mono">{{ newAgentSpeed.toFixed(2) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                @click="createAgent"
                :disabled="creatingAgent"
                class="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <svg v-if="creatingAgent" class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                {{ creatingAgent ? 'Creating...' : 'Create Agent' }}
              </button>
              <button @click="cancelCreate" class="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>
    </template>
    </div>

    <!-- Right Panel: Agent Tester (persistent) -->
    <div class="flex-[2] flex flex-col min-w-0 hidden lg:flex">
      <ElevenlabsAgentTester
        :agent-id="selectedAgentId"
        :agent-name="selectedAgentName"
        :voice-name="selectedAgentVoiceName"
      />
    </div>
  </div>
</template>
