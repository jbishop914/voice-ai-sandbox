<script setup lang="ts">
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-surface-900">
    <SidebarAppSidebar />
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
      <footer class="flex-shrink-0 px-6 py-3 border-t border-surface-600/30 bg-surface-800/50">
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-muted">
            Voice AI Sandbox v0.1.0 — Built for experimentation
          </span>
          <a
            href="https://www.perplexity.ai/computer"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-text-muted hover:text-accent-teal transition-colors"
          >
            Created with Perplexity Computer
          </a>
        </div>
      </footer>
    </div>
  </div>
</template>
