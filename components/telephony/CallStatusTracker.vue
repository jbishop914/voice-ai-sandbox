<script setup lang="ts">
interface Props {
  status: 'idle' | 'initiating' | 'ringing' | 'in-progress' | 'completed' | 'failed'
  conversationId?: string | null
  callSid?: string | null
  duration?: number | null
}

defineProps<Props>()

const steps = ['initiating', 'ringing', 'in-progress', 'completed'] as const

function getStepIndex(status: string): number {
  const idx = steps.indexOf(status as any)
  return idx >= 0 ? idx : -1
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div v-if="status !== 'idle'" class="panel p-4">
    <h4 class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Call Status</h4>

    <!-- Status steps -->
    <div class="flex items-center gap-2 mb-4">
      <div
        v-for="(step, i) in steps"
        :key="step"
        class="flex items-center gap-2"
      >
        <div
          :class="[
            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all',
            status === 'failed' && step !== 'completed'
              ? 'border-accent-red/30 bg-accent-red/10 text-accent-red'
              : getStepIndex(status) >= i
                ? 'border-accent-amber/40 bg-accent-amber/15 text-accent-amber'
                : 'border-surface-500/30 bg-surface-700 text-text-muted'
          ]"
        >
          <template v-if="status === step && status !== 'completed' && status !== 'failed'">
            <div class="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
          </template>
          <template v-else-if="getStepIndex(status) > i || status === 'completed'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg>
          </template>
          <template v-else>
            {{ i + 1 }}
          </template>
        </div>
        <span
          v-if="i < steps.length - 1"
          :class="[
            'w-6 h-px',
            getStepIndex(status) > i ? 'bg-accent-amber/40' : 'bg-surface-500/30'
          ]"
        />
      </div>
    </div>

    <!-- Status text -->
    <div class="flex items-center gap-2 mb-2">
      <div :class="[
        'status-dot',
        status === 'completed' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' :
        status === 'failed' ? 'status-dot-disconnected' :
        status === 'in-progress' ? 'status-dot-connected' :
        'status-dot-connecting'
      ]" />
      <span class="text-sm font-semibold" :class="[
        status === 'completed' ? 'text-green-400' :
        status === 'failed' ? 'text-accent-red' :
        'text-accent-amber'
      ]">
        {{ status === 'initiating' ? 'Initiating call...' :
           status === 'ringing' ? 'Ringing...' :
           status === 'in-progress' ? 'Call in progress' :
           status === 'completed' ? 'Call completed' :
           status === 'failed' ? 'Call failed' : '' }}
      </span>
      <span v-if="duration != null" class="text-xs font-mono text-text-muted ml-auto">{{ formatDuration(duration) }}</span>
    </div>

    <!-- IDs -->
    <div v-if="conversationId || callSid" class="space-y-1 mt-3 pt-3 border-t border-surface-500/20">
      <div v-if="conversationId" class="flex items-center gap-2">
        <span class="text-[10px] text-text-muted uppercase">Conversation</span>
        <span class="text-[10px] font-mono text-text-secondary">{{ conversationId }}</span>
      </div>
      <div v-if="callSid" class="flex items-center gap-2">
        <span class="text-[10px] text-text-muted uppercase">Call SID</span>
        <span class="text-[10px] font-mono text-text-secondary">{{ callSid }}</span>
      </div>
    </div>
  </div>
</template>
