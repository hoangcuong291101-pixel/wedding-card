import guestsSeed from '@/data/guests.json'

import type { Guest, GuestSide } from '@/types/invitation'

export type { Guest, GuestSide }

export const guests = guestsSeed as Guest[]
