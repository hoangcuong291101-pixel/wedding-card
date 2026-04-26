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
  } satisfies WeddingInfo
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
  if (!APPS_SCRIPT_URL) {
    await delay()
    return guestsSeed as Guest[]
  }
  return remoteGet<Guest[]>({ action: 'guests' })
}

export async function fakeFetchWedding(): Promise<WeddingInfo> {
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
  remotePost({ action: 'removeGuest', slug })
}
