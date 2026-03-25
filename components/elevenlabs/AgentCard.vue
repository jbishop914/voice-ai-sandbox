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
}

defineProps<Props>()
const emit = defineEmits<{
  test: [agentId: string]
  edit: [agentId: string]
}>()
</script>

<template>
  <div class="card-hover flex items-center gap-4">
    <!-- Agent icon -->
    <div class="w-10 h-10 rounded-lg bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent-amber">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <h4 class="text-sm font-semibold text-text-primary truncate">{{ agent.name }}</h4>
      <p class="text-xs text-text-muted truncate">
        Voice: {{ voiceName || 'Default' }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 shrink-0">
      <button
        @click="emit('test', agent.agent_id)"
        class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-amber/15 text-accent-amber border border-accent-amber/25 hover:bg-accent-amber/25 transition-colors"
      >
        Test
      </button>
      <button
        @click="emit('edit', agent.agent_id)"
        class="btn-secondary !px-3 !py-1.5 text-xs"
      >
        Edit
      </button>
    </div>
  </div>
</template>
