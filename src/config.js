// Sửa thông tin thiệp tại đây. Ảnh cưới và nhạc được nhập từ file cá nhân.
// Ngày giờ, địa điểm và thông tin gia đình bên dưới CHỈ LÀ NỘI DUNG MINH HỌA.
export const wedding = {
  groom: 'Long An',
  bride: 'Hồng Mây',
  date: '2026-11-28',
  groomFamily: [
    'Phạm Văn Bắc',
    'Trần Thị Hải Yến',
  ],
  brideFamily: ['Nguyễn Thị Thúy'],
  events: [
    {
      title: 'Tiệc cưới nhà trai',
      date: '2026-11-28',
      time: '15:00',
      venue: '',
      address: 'Nhà Đa Năng Supe, Lâm Thao, Phú Thọ',
      mapUrl: 'https://maps.app.goo.gl/N49KBC1yubQxTtqr7', // Điền link Google Maps của bạn để hiện nút chỉ đường.
    },
    {
      title: 'Tiệc cưới nhà gái',
      date: '2026-11-27',
      time: '15:00',
      venue: '',
      address: 'Duyên An, Ý Yên, Ninh Bình',
      mapUrl: 'https://maps.app.goo.gl/oTZswssGq4yaGwDv5',
    },
  ],
  timeline: [
    {
      title: 'Tiệc cưới nhà gái',
      date: '2026-11-27',
      time: '15:00',
      icon: 'banquet',
    },
    {
      title: 'Lễ ăn hỏi\nvà lễ vu quy',
      date: '2026-11-28',
      time: '7:00',
      icon: 'rings',
    },
    {
      title: 'Tiệc cưới nhà trai\nvà lễ thành hôn',
      date: '2026-11-28',
      time: '15:00',
      icon: 'banquet',
    },
  ],
  images: {
    stripTop: '/assets/strip-top.jpg', // NHO00258.JPG
    stripMiddle: '/assets/strip-middle.jpg', // NHO00252.JPG
    stripBottom: '/assets/strip-bottom.jpg', // NHO00285.JPG
    heroRound: '/assets/hero-round.jpg', // NHO08875.JPG
    heroPortrait: '/assets/hero-portrait.jpg', // NHO09178.JPG
    hero: '/assets/hero.jpg',
    invitation: '/assets/invitation.jpg', // NHO08788.JPG
    couple: '/assets/couple.jpg',
    groom: '/assets/groom.jpg',
    bride: '/assets/bride.jpg',
    celebration: '/assets/celebration-nho00181.jpg', // NHO00181.JPG
    calendar: '/assets/calendar.jpg',
    guestbook: '/assets/guestbook.jpg',
    footer: '/assets/footer.jpg',
  },
  imagePositions: {
    stripTop: '50% 20%',
    stripMiddle: '50% 25%',
    stripBottom: '50% 15%',
    heroRound: '60% 50%',
    heroPortrait: '75% 50%',
    hero: '50% 35%',
    invitation: '80% 50%',
    couple: '50% 50%',
    groom: '50% 25%',
    bride: '50% 25%',
    celebration: '50% 40%',
    calendar: '50% 40%',
    guestbook: '50% 50%',
    footer: '50% 50%',
  },
  album: Array.from({ length: 16 }, (_, i) => ({
    src: `/assets/album-${i + 1}.jpg`,
    position: '50% 50%',
  })),
  music: '/assets/mot-nha-da-lab.mp3', // Một Nhà — Da LAB. Để trống nếu không muốn có nhạc nền.
  gifts: [
    {
      name: 'Long An',
      role: 'Chú rể',
      qrImage: '', // Ví dụ: '/assets/qr-long-an.png'.
      bank: '',
      account: '',
    },
    {
      name: 'Hồng Mây',
      role: 'Cô dâu',
      qrImage: '', // Ví dụ: '/assets/qr-hong-may.png'.
      bank: '',
      account: '',
    },
  ],
  thankYou: 'Sự hiện diện của bạn là niềm hạnh phúc của chúng tôi.',
};
