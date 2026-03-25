<script setup lang="ts">
interface Props {
  level: number
  active: boolean
}

const props = defineProps<Props>()

const bars = 12

function getBarHeight(index: number): string {
  if (!props.active) return '15%'
  const baseHeight = 15
  const variation = Math.sin((index / bars) * Math.PI) * 60
  const levelFactor = props.level * 100
  const height = Math.min(95, Math.max(baseHeight, variation + levelFactor * Math.random()))
  return `${height}%`
}
</script>

<template>
  <div class="flex items-end justify-center gap-[3px] h-16 w-full">
    <div
      v-for="i in bars"
      :key="i"
      :class="[
        'w-1.5 rounded-full transition-all duration-150',
        active ? 'bg-accent-amber' : 'bg-surface-500'
      ]"
      :style="{
        height: active ? `${Math.max(15, Math.random() * level * 100)}%` : '15%',
        opacity: active ? 0.5 + level * 0.5 : 0.3,
        animationDelay: `${i * 0.1}s`
      }"
    />
  </div>
</template>
