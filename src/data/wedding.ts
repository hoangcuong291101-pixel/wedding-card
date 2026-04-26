import type { WeddingInfo } from '@/types/invitation'
import { fakeFetchWedding } from '@/services/fakeApi'

export async function getWeddingInfo(): Promise<WeddingInfo> {
  return fakeFetchWedding()
}
