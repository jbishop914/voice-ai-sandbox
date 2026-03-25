<script setup lang="ts">
interface Voice {
  voice_id: string
  name: string
  category: string
  labels?: Record<string, string>
  preview_url?: string
  fine_tuning?: { is_allowed_to_fine_tune: boolean; state?: string }
}

interface Props {
  voices: Voice[]
  modelValue: string
  loading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const search = ref('')
const isOpen = ref(false)
const previewAudio = ref<HTMLAudioElement | null>(null)
const playingPreviewId = ref<string | null>(null)

const categoryOrder = ['cloned', 'professional', 'generated', 'premade'] as const
const categoryLabels: Record<string, string> = {
  cloned: 'Your Clones',
  professional: 'Professional',
  generated: 'Generated',
  premade: 'Premade'
}

const filteredVoices = computed(() => {
  const q = search.value.toLowerCase()
  return props.voices.filter(v =>
    v.name.toLowerCase().includes(q) || v.category?.toLowerCase().includes(q)
  )
})

const groupedVoices = computed(() => {
  const groups: Record<string, Voice[]> = {}
  for (const cat of categoryOrder) {
    const voices = filteredVoices.value.filter(v => v.category === cat)
    if (voices.length > 0) {
      groups[cat] = voices
    }
  }
  // Any voices with unknown categories
  const knownCats = new Set(categoryOrder)
  const other = filteredVoices.value.filter(v => !knownCats.has(v.category as any))
  if (other.length > 0) {
    groups['other'] = other
  }
  return groups
})

const selectedVoice = computed(() =>
  props.voices.find(v => v.voice_id === props.modelValue)
)

function selectVoice(voiceId: string) {
  emit('update:modelValue', voiceId)
  isOpen.value = false
  search.value = ''
}

function togglePreview(voice: Voice) {
  if (!voice.preview_url) return

  if (playingPreviewId.value === voice.voice_id) {
    previewAudio.value?.pause()
    playingPreviewId.value = null
    return
  }

  if (previewAudio.value) {
    previewAudio.value.pause()
  }
  previewAudio.value = new Audio(voice.preview_url)
  previewAudio.value.onended = () => { playingPreviewId.value = null }
  previewAudio.value.play()
  playingPreviewId.value = voice.voice_id
}

function getCategoryBadgeClass(category: string): string {
  if (category === 'cloned') return 'bg-accent-amber/15 text-accent-amber border-accent-amber/25'
  if (category === 'professional') return 'bg-accent-orange/15 text-accent-orange border-accent-orange/25'
  return 'bg-surface-600 text-text-muted border-surface-500/30'
}

// Close dropdown on outside click
function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.voice-selector')) {
    isOpen.value = false
    search.value = ''
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="voice-selector relative">
    <!-- Trigger -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="input-field flex items-center justify-between gap-2 cursor-pointer"
    >
      <span v-if="selectedVoice" class="flex items-center gap-2 truncate">
        <span class="truncate">{{ selectedVoice.name }}</span>
        <span
          :class="[
            'text-[10px] px-1.5 py-0.5 rounded-full border shrink-0',
            getCategoryBadgeClass(selectedVoice.category)
          ]"
        >
          {{ selectedVoice.category }}
        </span>
      </span>
      <span v-else class="text-text-muted">Select a voice...</span>
      <!-- Chevron -->
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-text-muted">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute z-50 mt-1 w-full bg-surface-700 border border-surface-500/40 rounded-lg shadow-xl max-h-72 overflow-hidden"
    >
      <!-- Search -->
      <div class="p-2 border-b border-surface-500/30">
        <input
          v-model="search"
          type="text"
          placeholder="Search voices..."
          class="input-field !py-1.5 text-xs"
          @click.stop
        />
      </div>

      <!-- Voice list -->
      <div class="overflow-y-auto max-h-56">
        <div v-if="loading" class="p-4 text-center text-xs text-text-muted">
          Loading voices...
        </div>
        <div v-else-if="Object.keys(groupedVoices).length === 0" class="p-4 text-center text-xs text-text-muted">
          No voices found
        </div>
        <template v-else>
          <div v-for="(voices, category) in groupedVoices" :key="category">
            <div class="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-surface-800/50 sticky top-0">
              {{ categoryLabels[category] || 'Other' }}
            </div>
            <button
              v-for="voice in voices"
              :key="voice.voice_id"
              type="button"
              @click.stop="selectVoice(voice.voice_id)"
              :class="[
                'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                voice.voice_id === modelValue
                  ? 'bg-accent-amber/10 text-accent-amber'
                  : 'text-text-primary hover:bg-surface-600'
              ]"
            >
              <span class="truncate flex-1">{{ voice.name }}</span>
              <!-- Preview play button -->
              <button
                v-if="voice.preview_url"
                type="button"
                @click.stop="togglePreview(voice)"
                class="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-500/50 text-text-muted hover:text-text-primary transition-colors"
                :title="playingPreviewId === voice.voice_id ? 'Stop preview' : 'Play preview'"
              >
                <svg v-if="playingPreviewId === voice.voice_id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
                <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
              <span
                :class="[
                  'text-[10px] px-1.5 py-0.5 rounded-full border shrink-0',
                  getCategoryBadgeClass(voice.category)
                ]"
              >
                {{ voice.category }}
              </span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
