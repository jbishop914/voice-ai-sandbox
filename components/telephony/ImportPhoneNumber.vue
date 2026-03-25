<script setup lang="ts">
interface Props {
  defaultAccountSid?: string
  defaultAuthToken?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  imported: []
}>()

const phoneNumber = ref('')
const label = ref('')
const accountSid = ref(props.defaultAccountSid || '')
const authToken = ref(props.defaultAuthToken || '')
const importing = ref(false)
const error = ref<string | null>(null)
const showCredentials = ref(false)

async function importNumber() {
  if (!phoneNumber.value.trim()) {
    error.value = 'Phone number is required'
    return
  }

  importing.value = true
  error.value = null

  try {
    await $fetch('/api/elevenlabs/telephony/phone-numbers', {
      method: 'POST',
      body: {
        twilio: {
          phone_number: phoneNumber.value.trim(),
          label: label.value.trim(),
          twilio_account_sid: accountSid.value.trim() || undefined,
          twilio_auth_token: authToken.value.trim() || undefined
        }
      }
    })

    phoneNumber.value = ''
    label.value = ''
    emit('imported')
  } catch (e: any) {
    error.value = e?.data?.data?.message || e?.data?.statusMessage || 'Failed to import phone number'
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="panel p-5">
    <h3 class="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Import Phone Number</h3>

    <div v-if="error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
      <p class="text-xs text-red-400">{{ error }}</p>
    </div>

    <div class="space-y-4">
      <div>
        <label class="label-text">Phone Number</label>
        <input v-model="phoneNumber" type="tel" class="input-field font-mono" placeholder="+16463321206" />
        <p class="text-[10px] text-text-muted mt-1">E.164 format with country code (e.g. +1 for US)</p>
      </div>

      <div>
        <label class="label-text">Label</label>
        <input v-model="label" type="text" class="input-field" placeholder="Main line, Support, etc." />
      </div>

      <!-- Twilio credentials (collapsible) -->
      <div>
        <button
          @click="showCredentials = !showCredentials"
          class="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            :class="['transition-transform', showCredentials ? 'rotate-90' : '']"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Twilio Credentials
          <span v-if="defaultAccountSid" class="text-[10px] text-text-muted">(pre-filled from env)</span>
        </button>

        <div v-if="showCredentials" class="mt-3 space-y-3 pl-4 border-l border-surface-500/20">
          <div>
            <label class="label-text">Account SID</label>
            <input v-model="accountSid" type="text" class="input-field font-mono text-xs" placeholder="AC..." />
          </div>
          <div>
            <label class="label-text">Auth Token</label>
            <input v-model="authToken" type="password" class="input-field font-mono text-xs" placeholder="••••••••" />
          </div>
        </div>
      </div>

      <div class="p-3 bg-surface-700/50 rounded-lg border border-surface-500/20">
        <p class="text-[11px] text-text-muted leading-relaxed">
          ElevenLabs will automatically configure your Twilio number's webhooks for inbound call handling.
        </p>
      </div>

      <button
        @click="importNumber"
        :disabled="importing"
        class="btn-primary w-full flex items-center justify-center gap-2"
      >
        <svg v-if="importing" class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        {{ importing ? 'Importing...' : 'Import Number' }}
      </button>
    </div>
  </div>
</template>
