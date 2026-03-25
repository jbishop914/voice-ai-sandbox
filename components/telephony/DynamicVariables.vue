<script setup lang="ts">
const props = defineProps<{
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

const expanded = ref(false)
const newKey = ref('')
const newValue = ref('')

const entries = computed(() => Object.entries(props.modelValue))

function addEntry() {
  if (!newKey.value.trim()) return
  const updated = { ...props.modelValue, [newKey.value.trim()]: newValue.value }
  emit('update:modelValue', updated)
  newKey.value = ''
  newValue.value = ''
}

function removeEntry(key: string) {
  const updated = { ...props.modelValue }
  delete updated[key]
  emit('update:modelValue', updated)
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
      Dynamic Variables
      <span v-if="entries.length > 0" class="text-[10px] text-accent-amber font-mono">({{ entries.length }})</span>
    </button>

    <div v-if="expanded" class="mt-3 space-y-2 pl-4 border-l border-surface-500/20">
      <p class="text-[10px] text-text-muted mb-2">Key-value pairs injected into the agent's prompt via dynamic_variables</p>

      <!-- Existing entries -->
      <div v-for="[key, val] in entries" :key="key" class="flex items-center gap-2">
        <span class="text-xs font-mono text-accent-amber bg-surface-700 px-2 py-1 rounded">{{ key }}</span>
        <span class="text-xs text-text-muted">=</span>
        <span class="text-xs font-mono text-text-primary bg-surface-700 px-2 py-1 rounded flex-1 truncate">{{ val }}</span>
        <button @click="removeEntry(key)" class="text-text-muted hover:text-accent-red transition-colors shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <!-- Add new entry -->
      <div class="flex items-center gap-2">
        <input v-model="newKey" type="text" class="input-field !py-1 !text-xs font-mono flex-1" placeholder="key" @keyup.enter="addEntry" />
        <input v-model="newValue" type="text" class="input-field !py-1 !text-xs font-mono flex-1" placeholder="value" @keyup.enter="addEntry" />
        <button
          @click="addEntry"
          :disabled="!newKey.trim()"
          class="p-1 rounded text-text-muted hover:text-accent-amber disabled:opacity-30 transition-colors shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>
    </div>
  </div>
</template>
