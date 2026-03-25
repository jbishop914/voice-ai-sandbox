<script setup lang="ts">
import type { SessionConfig, Voice } from '~/types/openai-realtime'

const emit = defineEmits<{
  applyConfig: [config: SessionConfig]
}>()

const voices: { value: Voice; label: string }[] = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
  { value: 'cedar', label: 'Cedar' },
  { value: 'marin', label: 'Marin' }
]

const config = reactive<SessionConfig>({
  voice: 'alloy',
  temperature: 0.8,
  vadThreshold: 0.5,
  silenceDurationMs: 500,
  instructions: 'You are a helpful voice assistant.'
})

function applyConfig() {
  emit('applyConfig', { ...config })
}
</script>

<template>
  <div class="panel p-4 h-full flex flex-col">
    <h3 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      Session Config
    </h3>

    <div class="flex-1 space-y-4 overflow-y-auto">
      <!-- Voice -->
      <div>
        <label class="label-text">Voice</label>
        <select v-model="config.voice" class="input-field">
          <option v-for="v in voices" :key="v.value" :value="v.value">{{ v.label }}</option>
        </select>
      </div>

      <!-- Temperature -->
      <div>
        <label class="label-text">
          Temperature
          <span class="text-accent-teal font-mono ml-1">{{ config.temperature.toFixed(1) }}</span>
        </label>
        <input
          v-model.number="config.temperature"
          type="range"
          min="0"
          max="1.2"
          step="0.1"
          class="w-full accent-accent-teal"
        />
        <div class="flex justify-between text-[10px] text-text-muted mt-0.5">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      <!-- VAD Threshold -->
      <div>
        <label class="label-text">
          VAD Threshold
          <span class="text-accent-teal font-mono ml-1">{{ config.vadThreshold.toFixed(2) }}</span>
        </label>
        <input
          v-model.number="config.vadThreshold"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="w-full accent-accent-teal"
        />
        <div class="flex justify-between text-[10px] text-text-muted mt-0.5">
          <span>Sensitive</span>
          <span>Strict</span>
        </div>
      </div>

      <!-- Silence Duration -->
      <div>
        <label class="label-text">Silence Duration (ms)</label>
        <input
          v-model.number="config.silenceDurationMs"
          type="number"
          min="100"
          max="3000"
          step="100"
          class="input-field font-mono text-xs"
        />
      </div>

      <!-- System Instructions -->
      <div>
        <label class="label-text">System Instructions</label>
        <textarea
          v-model="config.instructions"
          rows="4"
          class="input-field resize-none text-xs leading-relaxed"
          placeholder="Enter system instructions..."
        />
      </div>
    </div>

    <!-- Apply Button -->
    <button
      @click="applyConfig"
      class="btn-primary w-full mt-4 text-sm font-semibold"
    >
      Apply Config
    </button>
  </div>
</template>
