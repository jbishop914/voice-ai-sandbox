<script setup lang="ts">
const collapsed = useState('sidebar-collapsed', () => false)

const route = useRoute()

interface NavItem {
  label: string
  icon: string
  to: string
  status: 'active' | 'coming-soon'
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'home', to: '/', status: 'active' },
  { label: 'Direct Voice Chat', icon: 'mic', to: '/direct-voice', status: 'active' },
  { label: 'Telephony Lab', icon: 'phone', to: '/telephony-lab', status: 'coming-soon' },
  { label: 'ElevenLabs Studio', icon: 'waveform', to: '/elevenlabs-studio', status: 'coming-soon' },
  { label: 'Multi-Agent', icon: 'users', to: '/multi-agent', status: 'coming-soon' },
  { label: 'Operator Dashboard', icon: 'monitor', to: '/operator-dashboard', status: 'coming-soon' },
  { label: 'Conference Bridge', icon: 'phone-forwarded', to: '/conference-bridge', status: 'coming-soon' },
  { label: 'Voice Cloning', icon: 'copy', to: '/voice-cloning', status: 'coming-soon' }
]

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <aside
    :class="[
      'h-screen flex flex-col bg-surface-800 border-r border-surface-500/20 transition-all duration-300 relative z-30',
      collapsed ? 'w-[68px]' : 'w-[240px]'
    ]"
  >
    <!-- Header -->
    <div class="flex items-center h-16 px-4 border-b border-surface-500/20 flex-shrink-0">
      <div class="flex items-center gap-3 min-w-0">
        <!-- Voxagen Logo: Monochrome white, abstract soundwave/voice mark -->
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0">
          <rect x="1" y="1" width="26" height="26" rx="6" stroke="white" stroke-width="1.5" fill="none" />
          <path d="M7 17L10.5 9L14 17L17.5 7L21 17" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span
          v-if="!collapsed"
          class="text-sm font-semibold text-text-primary whitespace-nowrap"
        >
          Voxagen
        </span>
      </div>
    </div>

    <!-- Collapse toggle -->
    <button
      @click="collapsed = !collapsed"
      class="absolute -right-3 top-20 w-6 h-6 bg-surface-700 border border-surface-500/40 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:border-white/40 transition-colors z-40"
      :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
    >
      <svg
        width="12" height="12" viewBox="0 0 12 12" fill="none"
        :class="['transition-transform duration-300', collapsed ? 'rotate-180' : '']"
      >
        <path d="M7.5 2.5L4.5 6L7.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <!-- Navigation -->
    <nav class="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative',
          isActive(item.to)
            ? 'bg-accent-amber/10 text-accent-amber'
            : 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'
        ]"
        :title="collapsed ? item.label : undefined"
      >
        <!-- Active indicator bar -->
        <div
          v-if="isActive(item.to)"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-amber rounded-r"
        />

        <!-- Icon (monochrome white) -->
        <div class="w-5 h-5 flex items-center justify-center flex-shrink-0">
          <!-- Home -->
          <svg v-if="item.icon === 'home'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <!-- Mic -->
          <svg v-else-if="item.icon === 'mic'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <!-- Phone -->
          <svg v-else-if="item.icon === 'phone'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <!-- Waveform (audio) -->
          <svg v-else-if="item.icon === 'waveform'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12h2M6 8v8M10 5v14M14 8v8M18 6v12M22 12h-2" />
          </svg>
          <!-- Users -->
          <svg v-else-if="item.icon === 'users'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <!-- Monitor -->
          <svg v-else-if="item.icon === 'monitor'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <!-- Phone forwarded -->
          <svg v-else-if="item.icon === 'phone-forwarded'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 2 22 6 18 10" /><line x1="14" y1="6" x2="22" y2="6" />
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <!-- Copy -->
          <svg v-else-if="item.icon === 'copy'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </div>

        <!-- Label -->
        <span
          v-if="!collapsed"
          class="whitespace-nowrap text-sm"
        >
          {{ item.label }}
        </span>

        <!-- Coming soon dot -->
        <div
          v-if="item.status === 'coming-soon' && !collapsed"
          class="ml-auto w-1.5 h-1.5 rounded-full bg-surface-400/60"
        />
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="px-3 py-3 border-t border-surface-500/20 flex-shrink-0">
      <div v-if="!collapsed" class="text-[10px] text-text-muted leading-relaxed">
        v0.1.0
      </div>
      <div v-else class="text-[10px] text-text-muted text-center">
        0.1
      </div>
    </div>
  </aside>
</template>
