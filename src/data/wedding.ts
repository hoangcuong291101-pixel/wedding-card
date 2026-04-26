import bg from '@/assets/images/bg.jpg'
import g1 from '@/assets/images/1.jpg'
import g2 from '@/assets/images/2.jpg'

export const weddingInfo = {
  groomName: 'Hoàng Cường',
  brideName: 'Ngọc Ỉn',

  backgroundImage: bg,
  galleryImages: [g1, g2],

  families: {
    groom: {
      label: 'Nhà trai',
      dad: 'Ông Hoàng Văn Kiên',
      mom: 'Bà Dương Thị Hà',
      address: 'Xóm Chùa...',
      phone: '0879619500',
      googleMapUrl: 'https://maps.app.goo.gl/mMPKTBFdoEXms9w46',
    },
    bride: {
      label: 'Nhà gái',
      dad: 'Ông Nguyễn Văn Chính',
      mom: 'Bà Phạm Thị Đào',
      address: 'Xóm 4...',
      phone: '0325415091',
      googleMapUrl: 'https://maps.app.goo.gl/szm3BNUDJWvjNGsn6',
    },
  },

  weddingDate: '09/05/2026 - 10/05/2026',

  timeline: [
    { time: '09:00', date: '09/05', title: 'Đón khách', description: 'Đón khách' },
    { time: '10:00', date: '09/05', title: 'Vào tiệc', description: 'Đớp' },
    { time: '17:00', date: '09/05', title: 'Vào tiệc', description: 'Đớp lần 2' },
  ],

  venue: {
    name: 'Tư gia',
    note: 'Tổ chức tại nhà riêng hai bên gia đình',
  },
}
