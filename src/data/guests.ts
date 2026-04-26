export type GuestSide = 'bride' | 'groom'

export interface Guest {
  slug: string
  name: string
  side: GuestSide
}

export const guests: Guest[] = [
  {
    slug: 'anh-tuan',
    name: 'Anh Tuấn',
    side: 'groom',
  },
  {
    slug: 'chi-linh',
    name: 'Chị Linh',
    side: 'bride',
  },
]
