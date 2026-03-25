<script setup lang="ts">
definePageMeta({
  title: 'ElevenLabs Studio'
})

// State
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

const ttsModels = [
  { value: 'eleven_flash_v2', label: 'Flash v2' },
  { value: 'eleven_flash_v2_5', label: 'Flash v2.5' },
  { value: 'eleven_v3', label: 'v3' }
]

function getVoiceName(voiceId: string): string {
  const voice = voices.value.find((v: any) => v.voice_id === voiceId)
  return voice?.name || 'Default'
}

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

    // Refresh agents list
    await fetchAgents()

    // Reset form
    newAgentName.value = ''
    newAgentPrompt.value = 'You are a helpful assistant.'
    newAgentFirstMessage.value = 'Hello! How can I help you today?'
    newAgentVoiceId.value = ''
    newAgentModel.value = 'eleven_flash_v2'
    newAgentStability.value = 0.5
    newAgentSimilarity.value = 0.8
    newAgentSpeed.value = 1.0
  } catch (e: any) {
    createError.value = e?.data?.data?.message || 'Failed to create agent'
  } finally {
    creatingAgent.value = false
  }
}

function selectForTest(agentId: string) {
  const agent = agents.value.find((a: any) => a.agent_id === agentId)
  selectedAgentId.value = agentId
  selectedAgentName.value = agent?.name
  const voiceId = agent?.conversation_config?.tts?.voice_id
  selectedAgentVoiceName.value = voiceId ? getVoiceName(voiceId) : undefined
}

async function startEdit(agentId: string) {
  editingAgentId.value = agentId
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

// Load data on mount
onMounted(() => {
  fetchVoices()
  fetchAgents()
})
</script>

<template>
  <div class="flex h-[calc(100vh-64px)] overflow-hidden">
    <!-- Left Panel: Agent Builder (~60%) -->
    <div class="flex-[3] overflow-y-auto border-r border-surface-500/20 p-6">
      <!-- Page header -->
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

      <!-- Your Agents Section -->
      <div v-if="!apiKeyMissing" class="mb-8">
        <h2 class="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Your Agents</h2>

        <div v-if="loadingAgents" class="card text-center py-6">
          <p class="text-sm text-text-muted">Loading agents...</p>
        </div>
        <div v-else-if="agents.length === 0" class="card text-center py-6">
          <p class="text-sm text-text-muted mb-1">No agents yet</p>
          <p class="text-xs text-text-muted/70">Create your first agent below</p>
        </div>
        <div v-else class="space-y-3">
          <ElevenlabsAgentCard
            v-for="agent in agents"
            :key="agent.agent_id"
            :agent="agent"
            :voice-name="getVoiceName(agent.conversation_config?.tts?.voice_id)"
            @test="selectForTest"
            @edit="startEdit"
          />
        </div>
      </div>

      <!-- Edit Agent Form (shown when editing) -->
      <div v-if="editingAgentId" class="mb-8 panel p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-bold text-text-secondary uppercase tracking-widest">Edit Agent</h2>
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

          <button
            @click="saveEdit"
            :disabled="savingEdit"
            class="btn-primary w-full flex items-center justify-center gap-2"
          >
            <svg v-if="savingEdit" class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            {{ savingEdit ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Create New Agent Section -->
      <div v-if="!apiKeyMissing && !editingAgentId" class="panel p-5">
        <h2 class="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Create New Agent</h2>

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

          <button
            @click="createAgent"
            :disabled="creatingAgent"
            class="btn-primary w-full flex items-center justify-center gap-2"
          >
            <svg v-if="creatingAgent" class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {{ creatingAgent ? 'Creating...' : 'Create Agent' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Right Panel: Agent Tester (~40%) -->
    <div class="flex-[2] flex flex-col min-w-0">
      <ElevenlabsAgentTester
        :agent-id="selectedAgentId"
        :agent-name="selectedAgentName"
        :voice-name="selectedAgentVoiceName"
      />
    </div>
  </div>
</template>
