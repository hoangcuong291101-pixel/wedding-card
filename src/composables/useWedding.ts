import { ref } from 'vue'

import { fakeFetchWedding, fakeUpdateWedding } from '@/services/fakeApi'
import type { WeddingInfo } from '@/types/invitation'

const wedding = ref<WeddingInfo | null>(null)
const isLoadingWedding = ref(false)

export function useWedding() {
  async function loadWedding() {
    isLoadingWedding.value = true
    wedding.value = await fakeFetchWedding()
    isLoadingWedding.value = false
  }

  async function updateWedding(payload: Pick<WeddingInfo, 'groomName' | 'brideName' | 'weddingDate' | 'venue'>) {
    wedding.value = await fakeUpdateWedding(payload)
    return wedding.value
  }

  return {
    wedding,
    isLoadingWedding,
    loadWedding,
    updateWedding,
  }
}
