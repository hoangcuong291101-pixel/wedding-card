import { onBeforeUnmount, ref, watch } from 'vue'

export function useLazyLoad() {
  const isVisible = ref(false)
  const elRef = ref<HTMLElement | null>(null)

  let observer: IntersectionObserver | null = null

  watch(
    elRef,
    (element) => {
      if (!element || isVisible.value) return

      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry) return

          if (entry.isIntersecting) {
            isVisible.value = true
            observer?.disconnect()
          }
        },
        {
          rootMargin: '0px 0px -8% 0px',
          threshold: 0.22,
        },
      )

      observer.observe(element)
    },
    {
      immediate: true,
    },
  )

  onBeforeUnmount(() => {
    observer?.disconnect()
  })

  return {
    elRef,
    isVisible,
  }
}
