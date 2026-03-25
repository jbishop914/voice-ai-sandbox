<script setup lang="ts">
interface Voice {
  voice_id: string
  name: string
  category: string
}

interface Props {
  modelValue: {
    prompt?: string
    firstMessage?: string
    voiceId?: string
    language?: string
    llmModel?: string
  }
  voices: Voice[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: Props['modelValue']]
}>()

const expanded = ref(false)

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'pl', label: 'Polish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tr', label: 'Turkish' }
]

const llmModels = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
]

const hasOverrides = computed(() =>
  props.modelValue.prompt || props.modelValue.firstMessage || props.modelValue.voiceId || props.modelValue.language || props.modelValue.llmModel
)

function update(field: string, value: string) {
  emit('update:modelValue', { ...props.modelValue, [field]: value || undefined })
}
</script>

<template>
  <div>
    <button
      @click="expanded = !expanded"
      class="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors w-full"
    >
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        :class="['transition-transform', expanded ? 'rotate-90' : '']"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
      Conversation Overrides
      <span v-if="hasOverrides" class="text-[10px] text-accent-amber">active</span>
    </button>

    <div v-if="expanded" class="mt-3 space-y-3 pl-4 border-l border-surface-500/20">
      <p class="text-[10px] text-text-muted mb-2">Override agent settings for this call only</p>

      <div>
        <label class="label-text">Override System Prompt</label>
        <textarea
          :value="modelValue.prompt || ''"
          @input="update('prompt', ($event.target as HTMLTextAreaElement).value)"
          class="input-field min-h-[80px] resize-y text-xs"
          placeholder="Leave blank to use agent's default prompt"
        />
      </div>

      <div>
        <label class="label-text">Override First Message</label>
        <input
          :value="modelValue.firstMessage || ''"
          @input="update('firstMessage', ($event.target as HTMLInputElement).value)"
          type="text"
          class="input-field text-xs"
          placeholder="Leave blank to use agent's default"
        />
      </div>

      <div>
        <label class="label-text">Override Voice</label>
        <select
          :value="modelValue.voiceId || ''"
          @change="update('voiceId', ($event.target as HTMLSelectElement).value)"
          class="input-field text-xs"
        >
          <option value="">Use agent's default voice</option>
          <option v-for="v in voices" :key="v.voice_id" :value="v.voice_id">{{ v.name }} ({{ v.category }})</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label-text">Override Language</label>
          <select
            :value="modelValue.language || ''"
            @change="update('language', ($event.target as HTMLSelectElement).value)"
            class="input-field text-xs"
          >
            <option value="">Default</option>
            <option v-for="l in languages" :key="l.value" :value="l.value">{{ l.label }}</option>
          </select>
        </div>

        <div>
          <label class="label-text">Override LLM Model</label>
          <select
            :value="modelValue.llmModel || ''"
            @change="update('llmModel', ($event.target as HTMLSelectElement).value)"
            class="input-field text-xs"
          >
            <option value="">Default</option>
            <option v-for="m in llmModels" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>
