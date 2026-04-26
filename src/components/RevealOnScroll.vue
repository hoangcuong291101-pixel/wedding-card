<script setup lang="ts">
import { computed } from 'vue'

import { useLazyLoad } from '@/composables/useLazyLoad'

type Direction = 'up' | 'left' | 'right'

const props = withDefaults(
  defineProps<{
    as?: 'div' | 'section'
    delay?: number
    y?: number
    x?: number
    direction?: Direction
  }>(),
  {
    as: 'div',
    delay: 180,
    y: 30,
    x: 44,
    direction: 'up',
  },
)

const { elRef, isVisible } = useLazyLoad()

const revealStyle = computed(() => {
  const x = props.direction === 'left' ? -props.x : props.direction === 'right' ? props.x : 0
  const y = props.direction === 'up' ? props.y : 0

  return {
    transitionDelay: `${props.delay}ms`,
    '--reveal-x': `${x}px`,
    '--reveal-y': `${y}px`,
  }
})
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
  transform: translate3d(var(--reveal-x, 0), var(--reveal-y, 30px), 0) scale(0.985);
  filter: blur(2px);
  transition:
    opacity 0.95s cubic-bezier(0.2, 0.7, 0.2, 1),
    transform 0.95s cubic-bezier(0.2, 0.7, 0.2, 1),
    filter 0.95s cubic-bezier(0.2, 0.7, 0.2, 1);
  will-change: opacity, transform;
}

.reveal-section--visible {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  filter: blur(0);
}
</style>
