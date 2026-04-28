import { computed, ref } from 'vue'

import { apiRemoveGuest, apiUpsertGuest, fakeFetchGuests } from '@/services/fakeApi'
import type { Guest, GuestSide } from '@/types/invitation'

const STORAGE_KEY = 'wedding-guests'
const USE_REMOTE = Boolean(
  import.meta.env.VITE_APPS_SCRIPT_URL ||
  (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
)
const guestsState = ref<Guest[]>([])
const hasInitialized = ref(false)

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function normalizeGuest(item: Partial<Guest>) {
  return {
    slug: item.slug || '',
    name: item.name || '',
    side: (item.side as GuestSide) || 'groom',
    inviteTime: item.inviteTime || '',
  } satisfies Guest
}

async function loadGuests() {
  if (hasInitialized.value) return

  // Khi có remote, bỏ qua localStorage cache để luôn lấy dữ liệu mới nhất
  if (!USE_REMOTE) {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Guest>[]
      guestsState.value = Array.isArray(parsed) ? parsed.map(normalizeGuest) : []
      hasInitialized.value = true
      return
    }
  }

  const data = await fakeFetchGuests()
  guestsState.value = data.map(normalizeGuest)
  if (!USE_REMOTE) localStorage.setItem(STORAGE_KEY, JSON.stringify(guestsState.value))
  hasInitialized.value = true
}

function persistGuests() {
  if (!USE_REMOTE) localStorage.setItem(STORAGE_KEY, JSON.stringify(guestsState.value))
}

function upsertGuest(payload: {
  slug?: string
  name: string
  side: GuestSide
  inviteTime: string
}) {
  const nextSlug = slugify(payload.slug || payload.name)
  if (!nextSlug) return

  const existingIndex = guestsState.value.findIndex((item) => item.slug === nextSlug)
  const guest: Guest = {
    slug: nextSlug,
    name: payload.name.trim(),
    side: payload.side,
    inviteTime: payload.inviteTime.trim(),
  }

  if (existingIndex >= 0) {
    guestsState.value[existingIndex] = guest
  } else {
    guestsState.value.unshift(guest)
  }

  persistGuests()
  apiUpsertGuest(guest)
}

function updateGuest(
  slug: string,
  payload: { name: string; side: GuestSide; inviteTime: string; nextSlug?: string },
) {
  const index = guestsState.value.findIndex((item) => item.slug === slug)
  if (index < 0) return

  const finalSlug = slugify(payload.nextSlug || payload.name)
  if (!finalSlug) return

  const updatedGuest: Guest = {
    slug: finalSlug,
    name: payload.name.trim(),
    side: payload.side,
    inviteTime: payload.inviteTime.trim(),
  }

  guestsState.value[index] = updatedGuest

  persistGuests()
  // Nếu slug thay đổi, xóa slug cũ rồi thêm mới
  if (finalSlug !== slug) apiRemoveGuest(slug)
  apiUpsertGuest(updatedGuest)
}

function removeGuest(slug: string) {
  guestsState.value = guestsState.value.filter((item) => item.slug !== slug)
  persistGuests()
  apiRemoveGuest(slug)
}

export function useGuests() {
  void loadGuests()

  return {
    guests: computed(() => guestsState.value),
    upsertGuest,
    updateGuest,
    removeGuest,
  }
}
