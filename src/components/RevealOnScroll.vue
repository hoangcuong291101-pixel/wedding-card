<script setup lang="ts">
import { computed } from 'vue'

import { useLazyLoad } from '@/composables/useLazyLoad'

const props = withDefaults(
  defineProps<{
    as?: 'div' | 'section'
    delay?: number
    y?: number
  }>(),
  {
    as: 'div',
    delay: 0,
    y: 22,
  },
)

const { elRef, isVisible } = useLazyLoad()

const revealStyle = computed(() => ({
  transitionDelay: `${props.delay}ms`,
  '--reveal-y': `${props.y}px`,
}))
</script>

<template>
  <component
    :is="as"
    ref="elRef"
    class="reveal-section"
    :class="{ 'reveal-section--visible': isVisible }"
    :style="revealStyle"
  >
    <slot />
  </component>
</template>

<style scoped>
.reveal-section {
  opacity: 0;
  transform: translateY(var(--reveal-y, 22px)) scale(0.985);
  filter: blur(1px);
  transition:
    opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.7s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.reveal-section--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}
</style>
