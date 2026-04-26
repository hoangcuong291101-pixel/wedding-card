import weddingSeed from '@/data/wedding.json'
import guestsSeed from '@/data/guests.json'
import bg from '@/assets/images/bg.jpg'
import g1 from '@/assets/images/1.jpg'
import g2 from '@/assets/images/2.jpg'
import type { Guest, WeddingInfo } from '@/types/invitation'

const DELAY_MS = 420

const imageMap: Record<string, string> = {
  bg,
  '1': g1,
  '2': g2,
}

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function fakeFetchGuests(): Promise<Guest[]> {
  await delay()
  return guestsSeed as Guest[]
}

export async function fakeFetchWedding(): Promise<WeddingInfo> {
  await delay()

  const seed = weddingSeed as {
    groomName: string
    brideName: string
    backgroundImageKey: string
    galleryImageKeys: string[]
    families: WeddingInfo['families']
    weddingDate: string
    timeline: WeddingInfo['timeline']
    venue: WeddingInfo['venue']
  }

  return {
    groomName: seed.groomName,
    brideName: seed.brideName,
    backgroundImage: imageMap[seed.backgroundImageKey] ?? bg,
    galleryImages: seed.galleryImageKeys.map((key) => imageMap[key] ?? g1),
    families: seed.families,
    weddingDate: seed.weddingDate,
    timeline: seed.timeline,
    venue: seed.venue,
  }
}
