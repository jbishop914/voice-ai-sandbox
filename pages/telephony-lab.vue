<script setup lang="ts">
definePageMeta({
  title: 'Telephony Lab'
})

// Tab state
const activeTab = ref<'numbers' | 'call' | 'history'>('numbers')

// Shared data
const phoneNumbers = ref<any[]>([])
const agents = ref<any[]>([])
const voices = ref<any[]>([])
const loadingNumbers = ref(false)
const loadingAgents = ref(false)
const loadingVoices = ref(false)
const apiKeyMissing = ref(false)
const pageError = ref<string | null>(null)

// Call history detail
const selectedConversationId = ref<string | null>(null)

// Twilio defaults from server
const twilioDefaults = ref<{ accountSid: string; phoneNumber: string }>({ accountSid: '', phoneNumber: '' })

async function fetchPhoneNumbers() {
  loadingNumbers.value = true
  try {
    const data = await $fetch<any[]>('/api/elevenlabs/telephony/phone-numbers')
    phoneNumbers.value = data
    apiKeyMissing.value = false
  } catch (e: any) {
    if (e?.data?.data?.error === 'missing_api_key') {
      apiKeyMissing.value = true
    } else {
      pageError.value = e?.data?.data?.message || 'Failed to load phone numbers'
    }
  } finally {
    loadingNumbers.value = false
  }
}

async function fetchAgents() {
  loadingAgents.value = true
  try {
    agents.value = await $fetch<any[]>('/api/elevenlabs/agents')
  } catch {
    // Agents may fail if no API key — handled by apiKeyMissing
  } finally {
    loadingAgents.value = false
  }
}

async function fetchVoices() {
  loadingVoices.value = true
  try {
    voices.value = await $fetch<any[]>('/api/elevenlabs/voices')
  } catch {
    // Voices may fail — non-critical
  } finally {
    loadingVoices.value = false
  }
}

async function handleAssignAgent(phoneNumberId: string, agentId: string) {
  try {
    await $fetch(`/api/elevenlabs/telephony/phone-numbers/${phoneNumberId}`, {
      method: 'PATCH',
      body: { agent_id: agentId || null }
    })
    await fetchPhoneNumbers()
  } catch (e: any) {
    pageError.value = e?.data?.data?.message || 'Failed to assign agent'
  }
}

async function handleUpdateLabel(phoneNumberId: string, label: string) {
  try {
    await $fetch(`/api/elevenlabs/telephony/phone-numbers/${phoneNumberId}`, {
      method: 'PATCH',
      body: { label }
    })
    await fetchPhoneNumbers()
  } catch (e: any) {
    pageError.value = e?.data?.data?.message || 'Failed to update label'
  }
}

async function handleDeleteNumber(phoneNumberId: string) {
  try {
    await $fetch(`/api/elevenlabs/telephony/phone-numbers/${phoneNumberId}`, {
      method: 'DELETE'
    })
    await fetchPhoneNumbers()
  } catch (e: any) {
    pageError.value = e?.data?.data?.message || 'Failed to delete phone number'
  }
}

function handleMakeCall(phoneNumberId: string) {
  activeTab.value = 'call'
}

function handleSelectConversation(conversationId: string) {
  selectedConversationId.value = conversationId
}

onMounted(() => {
  fetchPhoneNumbers()
  fetchAgents()
  fetchVoices()
})
</script>

<template>
  <div class="p-6 lg:p-8 max-w-7xl mx-auto">
    <!-- Page header -->
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-amber">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </div>
      <div>
        <h1 class="text-xl font-bold text-text-primary">Telephony Lab</h1>
        <p class="text-xs text-text-secondary">Manage phone numbers, make outbound calls, and view call history via ElevenLabs</p>
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
          <p class="text-sm font-semibold text-yellow-300 mb-1">API Keys Required</p>
          <p class="text-xs text-yellow-300/80 leading-relaxed">
            Configure <code class="font-mono bg-surface-700 px-1.5 py-0.5 rounded text-yellow-400">ELEVENLABS_API_KEY</code>,
            <code class="font-mono bg-surface-700 px-1.5 py-0.5 rounded text-yellow-400">TWILIO_ACCOUNT_SID</code>, and
            <code class="font-mono bg-surface-700 px-1.5 py-0.5 rounded text-yellow-400">TWILIO_AUTH_TOKEN</code> in your environment variables.
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

    <!-- Tab bar -->
    <div v-if="!apiKeyMissing" class="border-b border-surface-500/20 mb-6">
      <nav class="flex gap-0">
        <button
          v-for="tab in ([
            { key: 'numbers', label: 'Phone Numbers', icon: 'phone' },
            { key: 'call', label: 'Make a Call', icon: 'phone-outgoing' },
            { key: 'history', label: 'Call History', icon: 'list' }
          ] as const)"
          :key="tab.key"
          @click="activeTab = tab.key; selectedConversationId = null"
          :class="[
            'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === tab.key
              ? 'border-accent-amber text-accent-amber'
              : 'border-transparent text-text-muted hover:text-text-secondary hover:border-surface-500/30'
          ]"
        >
          <!-- Phone icon -->
          <svg v-if="tab.icon === 'phone'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <!-- Phone outgoing -->
          <svg v-else-if="tab.icon === 'phone-outgoing'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 8 22 2 16 2" /><line x1="16" y1="8" x2="22" y2="2" />
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <!-- List -->
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab content -->
    <div v-if="!apiKeyMissing">
      <!-- Tab 1: Phone Numbers -->
      <div v-if="activeTab === 'numbers'" class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div class="lg:col-span-3">
          <h2 class="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Your Numbers</h2>
          <TelephonyPhoneNumberTable
            :phone-numbers="phoneNumbers"
            :agents="agents"
            :loading="loadingNumbers"
            @assign-agent="handleAssignAgent"
            @delete="handleDeleteNumber"
            @make-call="handleMakeCall"
            @update-label="handleUpdateLabel"
          />
        </div>
        <div class="lg:col-span-2">
          <TelephonyImportPhoneNumber
            :default-account-sid="twilioDefaults.accountSid"
            @imported="fetchPhoneNumbers"
          />
        </div>
      </div>

      <!-- Tab 2: Make a Call -->
      <div v-else-if="activeTab === 'call'" class="max-w-xl mx-auto">
        <TelephonyOutboundCallPanel
          :phone-numbers="phoneNumbers"
          :agents="agents"
          :voices="voices"
        />
      </div>

      <!-- Tab 3: Call History -->
      <div v-else-if="activeTab === 'history'">
        <template v-if="selectedConversationId">
          <TelephonyConversationDetail
            :conversation-id="selectedConversationId"
            @close="selectedConversationId = null"
          />
        </template>
        <template v-else>
          <TelephonyCallHistoryTable
            :agents="agents"
            @select-conversation="handleSelectConversation"
          />
        </template>
      </div>
    </div>
  </div>
</template>
