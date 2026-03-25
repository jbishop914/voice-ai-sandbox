<script setup lang="ts">
import type { TranscriptEntry } from '~/types/openai-realtime'

interface Props {
  entry: TranscriptEntry
}

defineProps<Props>()

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
</script>

<template>
  <div
    :class="[
      'flex gap-3 py-3 px-4 rounded-lg transition-colors',
      entry.speaker === 'user'
        ? 'bg-surface-700/30'
        : 'bg-accent-teal/5'
    ]"
  >
    <!-- Speaker avatar -->
    <div
      :class="[
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5',
        entry.speaker === 'user'
          ? 'bg-accent-purple/20 text-accent-purple'
          : 'bg-accent-teal/20 text-accent-teal'
      ]"
    >
      {{ entry.speaker === 'user' ? 'U' : 'AI' }}
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-0.5">
        <span
          :class="[
            'text-xs font-semibold uppercase tracking-wide',
            entry.speaker === 'user' ? 'text-accent-purple' : 'text-accent-teal'
          ]"
        >
          {{ entry.speaker === 'user' ? 'You' : 'Assistant' }}
        </span>
        <span class="text-[10px] text-text-muted font-mono">
          {{ formatTime(entry.timestamp) }}
        </span>
        <span
          v-if="!entry.isFinal"
          class="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse"
        />
      </div>
      <p class="text-sm text-text-primary leading-relaxed">
        {{ entry.text }}
        <span v-if="!entry.isFinal" class="text-text-muted">▍</span>
      </p>
    </div>
  </div>
</template>
