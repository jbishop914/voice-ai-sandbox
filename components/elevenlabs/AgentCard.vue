<script setup lang="ts">
interface Props {
  agent: {
    agent_id: string
    name: string
    conversation_config?: {
      tts?: {
        voice_id?: string
      }
    }
  }
  voiceName?: string
  selected?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  select: [agentId: string]
  test: [agentId: string]
  edit: [agentId: string]
}>()
</script>

<template>
  <button
    type="button"
    @click="emit('select', agent.agent_id)"
    :class="[
      'w-full flex items-center gap-3 px-3 h-11 text-left transition-all duration-150',
      selected
        ? 'bg-surface-700/50 border-l-2 border-l-accent-amber border-b border-b-surface-500/15'
        : 'hover:bg-surface-700/30 border-l-2 border-l-transparent border-b border-b-surface-500/15'
    ]"
  >
    <!-- Agent icon -->
    <div
      :class="[
        'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
        selected ? 'bg-accent-amber/15' : 'bg-surface-700/50'
      ]"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="selected ? 'text-accent-amber' : 'text-text-muted'">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    </div>

    <!-- Name -->
    <span :class="['text-sm font-semibold truncate flex-1 min-w-0', selected ? 'text-text-primary' : 'text-text-secondary']">
      {{ agent.name }}
    </span>

    <!-- Voice name -->
    <span class="text-xs text-text-muted truncate max-w-[140px] shrink-0 hidden sm:block">
      {{ voiceName || 'Default' }}
    </span>

    <!-- Agent ID -->
    <span class="text-[10px] font-mono text-text-muted/50 truncate max-w-[100px] shrink-0 hidden lg:block">
      {{ agent.agent_id.slice(0, 12) }}...
    </span>
  </button>
</template>
