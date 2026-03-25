<script setup lang="ts">
interface PhoneNumber {
  phone_number_id: string
  phone_number: string
  label: string
  provider?: { type: string }
  assigned_agent?: { agent_id: string; agent_name: string } | null
}

interface Agent {
  agent_id: string
  name: string
}

interface Props {
  phoneNumbers: PhoneNumber[]
  agents: Agent[]
  loading: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  assignAgent: [phoneNumberId: string, agentId: string]
  delete: [phoneNumberId: string]
  makeCall: [phoneNumberId: string]
  updateLabel: [phoneNumberId: string, label: string]
}>()

const editingLabel = ref<string | null>(null)
const editLabelValue = ref('')
const assigningAgent = ref<string | null>(null)

function formatPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

function startEditLabel(pn: PhoneNumber) {
  editingLabel.value = pn.phone_number_id
  editLabelValue.value = pn.label || ''
}

function saveLabel(phoneNumberId: string) {
  emit('updateLabel', phoneNumberId, editLabelValue.value)
  editingLabel.value = null
}

function startAssignAgent(phoneNumberId: string) {
  assigningAgent.value = phoneNumberId
}

function handleAgentAssign(phoneNumberId: string, agentId: string) {
  emit('assignAgent', phoneNumberId, agentId)
  assigningAgent.value = null
}

const confirmDelete = ref<string | null>(null)
</script>

<template>
  <div>
    <div v-if="loading" class="card text-center py-8">
      <p class="text-sm text-text-muted">Loading phone numbers...</p>
    </div>
    <div v-else-if="phoneNumbers.length === 0" class="card text-center py-8">
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-surface-700/50 border border-surface-500/30 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </div>
      <p class="text-sm text-text-muted mb-1">No phone numbers imported</p>
      <p class="text-xs text-text-muted/70">Import a Twilio phone number below to get started</p>
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="pn in phoneNumbers"
        :key="pn.phone_number_id"
        class="card-hover flex items-center gap-4 !p-4"
      >
        <!-- Phone icon -->
        <div class="w-9 h-9 rounded-lg bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-amber">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-sm font-mono font-semibold text-text-primary">{{ formatPhone(pn.phone_number) }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full border bg-accent-orange/15 text-accent-orange border-accent-orange/25">
              {{ pn.provider?.type || 'twilio' }}
            </span>
          </div>
          <!-- Label (editable) -->
          <div class="flex items-center gap-1">
            <template v-if="editingLabel === pn.phone_number_id">
              <input
                v-model="editLabelValue"
                class="input-field !py-0.5 !px-1.5 !text-xs max-w-[200px]"
                placeholder="Label..."
                @keyup.enter="saveLabel(pn.phone_number_id)"
                @keyup.escape="editingLabel = null"
              />
              <button @click="saveLabel(pn.phone_number_id)" class="text-xs text-accent-amber hover:text-accent-amber/80">Save</button>
            </template>
            <template v-else>
              <span class="text-xs text-text-muted">{{ pn.label || 'No label' }}</span>
              <button @click="startEditLabel(pn)" class="text-text-muted/50 hover:text-text-secondary transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
            </template>
          </div>
        </div>

        <!-- Assigned agent -->
        <div class="shrink-0 min-w-[160px]">
          <template v-if="assigningAgent === pn.phone_number_id">
            <select
              class="input-field !py-1 !text-xs"
              @change="(e: Event) => handleAgentAssign(pn.phone_number_id, (e.target as HTMLSelectElement).value)"
            >
              <option value="">Unassigned</option>
              <option v-for="a in agents" :key="a.agent_id" :value="a.agent_id">{{ a.name }}</option>
            </select>
          </template>
          <template v-else>
            <button
              @click="startAssignAgent(pn.phone_number_id)"
              class="text-xs px-2 py-1 rounded-md hover:bg-surface-700 transition-colors"
              :class="pn.assigned_agent ? 'text-accent-amber' : 'text-text-muted'"
            >
              {{ pn.assigned_agent?.agent_name || 'Unassigned' }}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline ml-1"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          </template>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="emit('makeCall', pn.phone_number_id)"
            class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-accent-amber/15 text-accent-amber border border-accent-amber/25 hover:bg-accent-amber/25 transition-colors"
            title="Make a call from this number"
          >
            Call
          </button>
          <template v-if="confirmDelete === pn.phone_number_id">
            <button
              @click="emit('delete', pn.phone_number_id); confirmDelete = null"
              class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-accent-red/15 text-accent-red border border-accent-red/25 hover:bg-accent-red/25 transition-colors"
            >
              Confirm
            </button>
            <button @click="confirmDelete = null" class="text-xs text-text-muted hover:text-text-secondary">Cancel</button>
          </template>
          <button
            v-else
            @click="confirmDelete = pn.phone_number_id"
            class="p-1.5 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
            title="Delete number"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
