export type GuestSide = 'bride' | 'groom'

export interface Guest {
  slug: string
  name: string
  side: GuestSide
  inviteTime: string
}

export interface FamilyInfo {
  label: string
  dad: string
  mom: string
  address: string
  phone: string
  googleMapUrl: string
}

export interface TimelineItem {
  time: string
  date: string
  title: string
  description: string
}

export interface WeddingInfo {
  groomName: string
  brideName: string
  groomImageUrl?: string
  brideImageUrl?: string
  backgroundImage: string
  galleryImages: string[]
  families: {
    groom: FamilyInfo
    bride: FamilyInfo
  }
  weddingDate: string
  timelines: {
    groom: TimelineItem[]
    bride: TimelineItem[]
  }
  venue: {
    name: string
    note: string
  }
}
