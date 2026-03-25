<script setup lang="ts">
interface PhoneNumber {
  phone_number_id: string
  phone_number: string
  label: string
}

interface Agent {
  agent_id: string
  name: string
}

interface Voice {
  voice_id: string
  name: string
  category: string
}

interface Props {
  phoneNumbers: PhoneNumber[]
  agents: Agent[]
  voices: Voice[]
}

defineProps<Props>()

const selectedPhoneNumberId = ref('')
const selectedAgentId = ref('')
const toNumber = ref('')
const recordingEnabled = ref(true)
const dynamicVars = ref<Record<string, string>>({})
const overrides = ref<{
  prompt?: string
  firstMessage?: string
  voiceId?: string
  language?: string
  llmModel?: string
}>({})

const callStatus = ref<'idle' | 'initiating' | 'ringing' | 'in-progress' | 'completed' | 'failed'>('idle')
const conversationId = ref<string | null>(null)
const callSid = ref<string | null>(null)
const callDuration = ref<number | null>(null)
const error = ref<string | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

function formatPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

async function placeCall() {
  if (!selectedPhoneNumberId.value || !selectedAgentId.value || !toNumber.value.trim()) {
    error.value = 'Please select a phone number, agent, and enter a destination number'
    return
  }

  error.value = null
  callStatus.value = 'initiating'
  conversationId.value = null
  callSid.value = null
  callDuration.value = null

  const body: any = {
    agent_id: selectedAgentId.value,
    agent_phone_number_id: selectedPhoneNumberId.value,
    to_number: toNumber.value.trim(),
    call_recording_enabled: recordingEnabled.value
  }

  // Dynamic variables
  if (Object.keys(dynamicVars.value).length > 0) {
    body.conversation_initiation_client_data = body.conversation_initiation_client_data || {}
    body.conversation_initiation_client_data.dynamic_variables = dynamicVars.value
  }

  // Always inject outbound call direction context into dynamic variables
  body.conversation_initiation_client_data = body.conversation_initiation_client_data || {}
  body.conversation_initiation_client_data.dynamic_variables = {
    ...body.conversation_initiation_client_data.dynamic_variables,
    call_direction: 'outbound',
    call_direction_context: 'This is an OUTBOUND call. You are calling the recipient. Introduce yourself, state the reason for your call, and be polite about the fact that you initiated this call. Do not act as if you are receiving a call.'
  }

  // Conversation overrides
  const ov = overrides.value
  if (ov.prompt || ov.firstMessage || ov.voiceId || ov.language || ov.llmModel) {
    const configOverride: any = {}
    if (ov.prompt || ov.firstMessage) {
      configOverride.agent = { prompt: {} }
      if (ov.prompt) configOverride.agent.prompt.prompt = ov.prompt
      if (ov.firstMessage) configOverride.agent.prompt.first_message = ov.firstMessage
    }
    if (ov.voiceId) {
      configOverride.tts = { voice_id: ov.voiceId }
    }
    if (ov.language) {
      configOverride.agent = configOverride.agent || {}
      configOverride.agent.language = ov.language
    }
    if (ov.llmModel) {
      configOverride.agent = configOverride.agent || {}
      configOverride.agent.llm = { model_id: ov.llmModel }
    }
    body.conversation_initiation_client_data.conversation_config_override = configOverride
  }

  try {
    const result = await $fetch<any>('/api/elevenlabs/telephony/outbound-call', {
      method: 'POST',
      body
    })

    conversationId.value = result.conversation_id || null
    callSid.value = result.callSid || result.call_sid || null
    callStatus.value = 'ringing'

    // Start polling for status
    startPolling()
  } catch (e: any) {
    error.value = e?.data?.data?.message || e?.data?.statusMessage || 'Failed to place call'
    callStatus.value = 'failed'
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    if (!conversationId.value) return
    try {
      const data = await $fetch<any>(`/api/elevenlabs/telephony/conversations/${conversationId.value}`)
      const status = data.status

      if (status === 'done' || status === 'ended') {
        callStatus.value = 'completed'
        callDuration.value = data.metadata?.call_duration_secs || data.call_duration_secs || null
        stopPolling()
      } else if (status === 'failed' || status === 'error') {
        callStatus.value = 'failed'
        stopPolling()
      } else if (status === 'processing' || status === 'active') {
        callStatus.value = 'in-progress'
        callDuration.value = data.metadata?.call_duration_secs || null
      }
    } catch {
      // Ignore polling errors
    }
  }, 5000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onUnmounted(() => stopPolling())
</script>

<template>
  <div class="space-y-6">
    <!-- Call form -->
    <div class="panel p-5">
      <div class="flex items-center gap-3 mb-4">
        <h3 class="text-sm font-bold text-text-secondary uppercase tracking-widest">Outbound Call</h3>
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
          </svg>
          Outgoing
        </span>
      </div>

      <!-- Outbound call guidance -->
      <div class="mb-4 p-3 bg-accent-amber/5 border border-accent-amber/15 rounded-lg">
        <p class="text-[11px] text-text-secondary leading-relaxed">
          <span class="font-semibold text-accent-amber">Outbound call:</span> Your agent will dial the recipient. The agent's first message should introduce itself and state the reason for calling. Outbound call direction context is automatically injected into the conversation.
        </p>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p class="text-xs text-red-400">{{ error }}</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="label-text">From Number</label>
          <select v-model="selectedPhoneNumberId" class="input-field">
            <option value="">Select a phone number...</option>
            <option v-for="pn in phoneNumbers" :key="pn.phone_number_id" :value="pn.phone_number_id">
              {{ formatPhone(pn.phone_number) }} {{ pn.label ? `— ${pn.label}` : '' }}
            </option>
          </select>
        </div>

        <div>
          <label class="label-text">Agent</label>
          <select v-model="selectedAgentId" class="input-field">
            <option value="">Select an agent...</option>
            <option v-for="a in agents" :key="a.agent_id" :value="a.agent_id">{{ a.name }}</option>
          </select>
        </div>

        <div>
          <label class="label-text">Destination Number</label>
          <input v-model="toNumber" type="tel" class="input-field font-mono" placeholder="+1..." />
        </div>

        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="recordingEnabled"
              type="checkbox"
              class="w-4 h-4 rounded border-surface-500/40 bg-surface-700 text-accent-amber focus:ring-accent-amber/30 accent-accent-amber"
            />
            <span class="text-xs text-text-secondary">Record call</span>
          </label>
        </div>

        <!-- Dynamic variables -->
        <TelephonyDynamicVariables v-model="dynamicVars" />

        <!-- Conversation overrides -->
        <TelephonyConversationOverrides v-model="overrides" :voices="voices" />

        <button
          @click="placeCall"
          :disabled="callStatus === 'initiating' || callStatus === 'ringing' || callStatus === 'in-progress'"
          class="btn-primary w-full flex items-center justify-center gap-2 !py-3 text-sm"
          :class="{ 'glow-amber': callStatus === 'idle' || callStatus === 'completed' || callStatus === 'failed' }"
        >
          <svg v-if="callStatus === 'initiating'" class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          {{ callStatus === 'initiating' ? 'Placing Call...' : 'Place Call' }}
        </button>
      </div>
    </div>

    <!-- Call status tracker -->
    <TelephonyCallStatusTracker
      :status="callStatus"
      :conversation-id="conversationId"
      :call-sid="callSid"
      :duration="callDuration"
    />
  </div>
</template>
