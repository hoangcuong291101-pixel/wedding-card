import { computed, ref } from 'vue'

import { fakeFetchGuests } from '@/services/fakeApi'
import type { Guest, GuestSide } from '@/types/invitation'

const STORAGE_KEY = 'wedding-guests'
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

async function loadGuests() {
  if (hasInitialized.value) return

  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const parsed = JSON.parse(raw) as Guest[]
    guestsState.value = Array.isArray(parsed) ? parsed : []
    hasInitialized.value = true
    return
  }

  const data = await fakeFetchGuests()
  guestsState.value = [...data]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guestsState.value))
  hasInitialized.value = true
}

function persistGuests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guestsState.value))
}

function upsertGuest(payload: { slug?: string; name: string; side: GuestSide }) {
  const nextSlug = slugify(payload.slug || payload.name)
  if (!nextSlug) return

  const existingIndex = guestsState.value.findIndex((item) => item.slug === nextSlug)
  const guest: Guest = {
    slug: nextSlug,
    name: payload.name.trim(),
    side: payload.side,
  }

  if (existingIndex >= 0) {
    guestsState.value[existingIndex] = guest
  } else {
    guestsState.value.unshift(guest)
  }

  persistGuests()
}

function updateGuest(slug: string, payload: { name: string; side: GuestSide; nextSlug?: string }) {
  const index = guestsState.value.findIndex((item) => item.slug === slug)
  if (index < 0) return

  const finalSlug = slugify(payload.nextSlug || payload.name)
  if (!finalSlug) return

  guestsState.value[index] = {
    slug: finalSlug,
    name: payload.name.trim(),
    side: payload.side,
  }

  persistGuests()
}

function removeGuest(slug: string) {
  guestsState.value = guestsState.value.filter((item) => item.slug !== slug)
  persistGuests()
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
