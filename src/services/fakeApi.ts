import weddingSeed from '@/data/wedding.json'
import guestsSeed from '@/data/guests.json'
import bg from '@/assets/images/bg.jpg'
import g1 from '@/assets/images/1.jpg'
import g2 from '@/assets/images/2.jpg'
import g3 from '@/assets/images/3.jpg'
import g4 from '@/assets/images/4.jpg'
import g5 from '@/assets/images/5.jpg'
import g6 from '@/assets/images/6.jpg'
import g7 from '@/assets/images/7.jpg'
import g8 from '@/assets/images/8.jpg'
import g9 from '@/assets/images/9.jpg'
import g10 from '@/assets/images/10.jpg'
import g11 from '@/assets/images/11.jpg'
import type { Guest, WeddingInfo } from '@/types/invitation'

const DELAY_MS = 420
const WEDDING_STORAGE_KEY = 'wedding-info'
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

function normalizeSupabaseBaseUrl(url: string) {
  // Accept both:
  // - https://xxx.supabase.co
  // - https://xxx.supabase.co/rest/v1/
  return url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

type SupabaseWeddingRow = {
  id: number
  groom_name: string | null
  bride_name: string | null
  wedding_date: string | null
  venue_note: string | null
  groom_data: WeddingInfo['families']['groom'] | null
  bride_data: WeddingInfo['families']['bride'] | null
  groom_timeline: WeddingInfo['timelines']['groom'] | null
  bride_timeline: WeddingInfo['timelines']['bride'] | null
}

type SupabaseGuestRow = {
  slug: string
  name: string
  side: Guest['side']
  invite_time: string
}

const imageMap: Record<string, string> = {
  bg,
  '1': g1,
  '2': g2,
  '3': g3,
  '4': g4,
  '5': g5,
  '6': g6,
  '7': g7,
  '8': g8,
  '9': g9,
  '10': g10,
  '11': g11,
}

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function buildWeddingFromSeed() {
  const seed = weddingSeed as {
    groomName: string
    brideName: string
    groomImageKey?: string
    brideImageKey?: string
    backgroundImageKey: string
    galleryImageKeys: string[]
    families: WeddingInfo['families']
    weddingDate: string
    timelines: WeddingInfo['timelines']
    venue: WeddingInfo['venue']
    bankAccount?: WeddingInfo['bankAccount']
  }

  return {
    groomName: seed.groomName,
    brideName: seed.brideName,
    groomImageUrl: seed.groomImageKey ? imageMap[seed.groomImageKey] : undefined,
    brideImageUrl: seed.brideImageKey ? imageMap[seed.brideImageKey] : undefined,
    backgroundImage: imageMap[seed.backgroundImageKey] ?? bg,
    galleryImages: seed.galleryImageKeys.map((key) => imageMap[key] ?? g1),
    families: seed.families,
    weddingDate: seed.weddingDate,
    timelines: seed.timelines,
    venue: seed.venue,
    bankAccount: seed.bankAccount,
  } satisfies WeddingInfo
}

function mergeWeddingFromSupabase(seed: WeddingInfo, row: SupabaseWeddingRow): WeddingInfo {
  return {
    ...seed,
    groomName: row.groom_name || seed.groomName,
    brideName: row.bride_name || seed.brideName,
    weddingDate: row.wedding_date || seed.weddingDate,
    venue: {
      name: seed.venue.name,
      note: row.venue_note || seed.venue.note,
    },
    families: {
      groom: { ...seed.families.groom, ...(row.groom_data || {}) },
      bride: { ...seed.families.bride, ...(row.bride_data || {}) },
    },
    timelines: {
      groom: Array.isArray(row.groom_timeline) ? row.groom_timeline : seed.timelines.groom,
      bride: Array.isArray(row.bride_timeline) ? row.bride_timeline : seed.timelines.bride,
    },
  }
}

function mapGuestFromSupabase(row: SupabaseGuestRow): Guest {
  return {
    slug: row.slug,
    name: row.name,
    side: row.side === 'bride' ? 'bride' : 'groom',
    inviteTime: row.invite_time || '',
  }
}

async function supabaseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }

  const baseUrl = normalizeSupabaseBaseUrl(SUPABASE_URL)
  const url = `${baseUrl}${path}`
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
  }

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error: ${res.status} ${text}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── Remote helpers (Google Apps Script) ─────────────────────────────────────

async function remoteGet<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(APPS_SCRIPT_URL!)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { redirect: 'follow' })
  if (!res.ok) throw new Error(`Apps Script error: ${res.status}`)
  return res.json() as Promise<T>
}

function remotePost(params: Record<string, string>): void {
  if (!APPS_SCRIPT_URL) return
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
    redirect: 'follow',
  }).catch((err) => console.warn('[api] remotePost failed:', err))
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fakeFetchGuests(): Promise<Guest[]> {
  if (USE_SUPABASE) {
    const rows = await supabaseFetch<SupabaseGuestRow[]>(
      '/rest/v1/guests?select=slug,name,side,invite_time&order=name.asc',
    )
    return rows.map(mapGuestFromSupabase)
  }

  if (!APPS_SCRIPT_URL) {
    await delay()
    return guestsSeed as Guest[]
  }
  return remoteGet<Guest[]>({ action: 'guests' })
}

export async function fakeFetchWedding(): Promise<WeddingInfo> {
  if (USE_SUPABASE) {
    const seed = buildWeddingFromSeed()
    const rows = await supabaseFetch<SupabaseWeddingRow[]>(
      '/rest/v1/wedding?select=id,groom_name,bride_name,wedding_date,venue_note,groom_data,bride_data,groom_timeline,bride_timeline&order=id.asc&limit=1',
    )
    const firstRow = rows[0]
    if (!firstRow) return seed
    return mergeWeddingFromSupabase(seed, firstRow)
  }

  if (!APPS_SCRIPT_URL) {
    await delay()

    const fallback = buildWeddingFromSeed()
    const raw = localStorage.getItem(WEDDING_STORAGE_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Partial<WeddingInfo>
    return { ...fallback, ...parsed, venue: { ...fallback.venue, ...parsed.venue } }
  }

  const remote = await remoteGet<{
    groomName: string
    brideName: string
    weddingDate: string
    venue: { name: string; note: string }
    timelines: WeddingInfo['timelines']
    families: WeddingInfo['families']
  }>({ action: 'wedding' })
  const seed = buildWeddingFromSeed()
  return {
    ...seed,
    ...remote,
    venue: { ...seed.venue, ...remote.venue },
    families: remote.families ?? seed.families,
    timelines: remote.timelines ?? seed.timelines,
  }
}

export async function fakeUpdateWedding(
  payload: Pick<
    WeddingInfo,
    'groomName' | 'brideName' | 'weddingDate' | 'venue' | 'families' | 'timelines'
  >,
) {
  if (USE_SUPABASE) {
    await supabaseFetch<SupabaseWeddingRow[]>('/rest/v1/wedding?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([
        {
          id: 1,
          groom_name: payload.groomName,
          bride_name: payload.brideName,
          wedding_date: payload.weddingDate,
          venue_note: payload.venue.note,
          groom_data: payload.families.groom,
          bride_data: payload.families.bride,
          groom_timeline: payload.timelines.groom,
          bride_timeline: payload.timelines.bride,
        },
      ]),
    })
    return fakeFetchWedding()
  }

  if (!APPS_SCRIPT_URL) {
    await delay(220)

    const current = await fakeFetchWedding()
    const next: WeddingInfo = {
      ...current,
      groomName: payload.groomName,
      brideName: payload.brideName,
      weddingDate: payload.weddingDate,
      venue: { ...current.venue, ...payload.venue },
      families: payload.families,
      timelines: payload.timelines,
    }
    localStorage.setItem(WEDDING_STORAGE_KEY, JSON.stringify(next))
    return next
  }

  const g = payload.families.groom
  const b = payload.families.bride
  remotePost({
    action: 'updateWedding',
    groomName: payload.groomName,
    brideName: payload.brideName,
    weddingDate: payload.weddingDate,
    venueName: payload.venue.name,
    venueNote: payload.venue.note,
    groomLabel: g.label,
    groomDad: g.dad,
    groomMom: g.mom,
    groomAddress: g.address,
    groomPhone: g.phone,
    groomMapUrl: g.googleMapUrl,
    brideLabel: b.label,
    brideDad: b.dad,
    brideMom: b.mom,
    brideAddress: b.address,
    bridePhone: b.phone,
    brideMapUrl: b.googleMapUrl,
    groomTimeline: JSON.stringify(payload.timelines.groom),
    brideTimeline: JSON.stringify(payload.timelines.bride),
  })
  return fakeFetchWedding()
}

/** Gọi khi thêm hoặc cập nhật 1 khách mời lên server (fire-and-forget). */
export function apiUpsertGuest(guest: Guest): void {
  if (USE_SUPABASE) {
    void supabaseFetch<SupabaseGuestRow[]>('/rest/v1/guests?on_conflict=slug', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([
        {
          slug: guest.slug,
          name: guest.name,
          side: guest.side,
          invite_time: guest.inviteTime,
        },
      ]),
    }).catch((err) => console.warn('[api] supabase upsertGuest failed:', err))
    return
  }

  remotePost({
    action: 'upsertGuest',
    slug: guest.slug,
    name: guest.name,
    side: guest.side,
    inviteTime: guest.inviteTime,
  })
}

/** Gọi khi xóa 1 khách mời trên server (fire-and-forget). */
export function apiRemoveGuest(slug: string): void {
  if (USE_SUPABASE) {
    const q = encodeURIComponent(slug)
    void supabaseFetch<void>(`/rest/v1/guests?slug=eq.${q}`, {
      method: 'DELETE',
      headers: {
        Prefer: 'return=minimal',
      },
    }).catch((err) => console.warn('[api] supabase removeGuest failed:', err))
    return
  }

  remotePost({ action: 'removeGuest', slug })
}
