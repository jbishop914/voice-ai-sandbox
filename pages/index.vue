<script setup lang="ts">
definePageMeta({
  title: 'Dashboard'
})

interface ModuleInfo {
  title: string
  description: string
  status: 'active' | 'coming-soon'
  to: string
  icon: string
}

const modules: ModuleInfo[] = [
  {
    title: 'Direct Voice Chat',
    description: 'Real-time voice conversations with AI using OpenAI\'s Realtime API via WebRTC.',
    status: 'active',
    to: '/direct-voice',
    icon: 'mic'
  },
  {
    title: 'Telephony Lab',
    description: 'Test voice AI over PSTN phone calls with Twilio and Vonage integrations.',
    status: 'coming-soon',
    to: '/telephony-lab',
    icon: 'phone'
  },
  {
    title: 'ElevenLabs Studio',
    description: 'Experiment with ElevenLabs voice synthesis, cloning, and voice design tools.',
    status: 'active',
    to: '/elevenlabs-studio',
    icon: 'waveform'
  },
  {
    title: 'Multi-Agent',
    description: 'Orchestrate multiple AI agents in voice conversations with handoff protocols.',
    status: 'coming-soon',
    to: '/multi-agent',
    icon: 'users'
  },
  {
    title: 'Operator Dashboard',
    description: 'Monitor live voice sessions, view analytics, and manage active conversations.',
    status: 'coming-soon',
    to: '/operator-dashboard',
    icon: 'monitor'
  },
  {
    title: 'Conference Bridge',
    description: 'Create multi-party voice conferences with AI participants and human callers.',
    status: 'coming-soon',
    to: '/conference-bridge',
    icon: 'phone-forwarded'
  },
  {
    title: 'Voice Cloning',
    description: 'Clone and customize voices for use across all voice AI modules.',
    status: 'coming-soon',
    to: '/voice-cloning',
    icon: 'copy'
  }
]

const stats = [
  { label: 'Active Sessions', value: '0', icon: 'activity' },
  { label: 'Total Conversations', value: '0', icon: 'message' },
  { label: 'Providers Connected', value: '0', icon: 'link' }
]
</script>

<template>
  <div class="p-6 lg:p-8 max-w-7xl mx-auto">
    <!-- Hero -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <!-- Voxagen logo (monochrome white) -->
        <svg width="36" height="36" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="26" height="26" rx="6" stroke="white" stroke-width="1.5" fill="none" />
          <path d="M7 17L10.5 9L14 17L17.5 7L21 17" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div>
          <h1 class="text-2xl font-bold text-text-primary">Voxagen</h1>
          <p class="text-sm text-text-secondary">Experimental platform for voice-to-voice conversational AI</p>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="card flex items-center gap-4"
      >
        <div class="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center text-white/40">
          <!-- Activity -->
          <svg v-if="stat.icon === 'activity'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <!-- Message -->
          <svg v-else-if="stat.icon === 'message'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <!-- Link -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <div>
          <div class="text-xl font-bold font-mono text-text-primary">{{ stat.value }}</div>
          <div class="text-xs text-text-secondary">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- Module Grid -->
    <div class="mb-4">
      <h2 class="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Modules</h2>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <DashboardModuleCard
        v-for="mod in modules"
        :key="mod.to"
        :title="mod.title"
        :description="mod.description"
        :status="mod.status"
        :to="mod.to"
        :icon="mod.icon"
      />
    </div>
  </div>
</template>
