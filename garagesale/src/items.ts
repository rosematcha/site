import type { Item } from './types';

// Utility to shuffle array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const items: Item[] = shuffle([
  {
    name: 'Chromecast Ultra 4K',
    price: 30,
    desc: 'Comes with OEM power supply.',
    category: 'tech',
    images: ['https://i.imgur.com/9LnfQtF.jpeg']
  },
  {
    name: 'VIZIO 24-inch TV',
    price: 20,
    desc: 'Comes with remote and power supply. Has two HDMI ports and composite. 1366x768 resolution. Model number D24hn-G9.',
    category: 'tech',
    images: ['https://i.imgur.com/xJrl5aQ.jpeg']
  },
  {
    name: 'Nendoroid - Kobeni (Chainsaw Man)',
    price: 35,
    desc: 'Still sealed.',
    category: 'figures',
    images: ['https://i.imgur.com/Dg9QsWP.jpeg']
  },
  {
    name: 'Nendoroid - Hitori Gotoh (Bocchi the Rock!)',
    price: 35,
    desc: 'Still sealed.',
    category: 'figures',
    images: ['https://i.imgur.com/bkUTQBT.jpeg']
  },
  {
    name: 'Kid Icarus Uprising - Nintendo 3DS',
    price: 70,
    desc: 'Comes in big box. Does not come with AR cards or stand.',
    category: 'games',
    images: ['https://i.imgur.com/UvXaimq.jpeg', 'https://i.imgur.com/oJWaN2H.jpeg']
  },
  {
    name: 'Eevee Loungefly Backpack',
    price: 20,
    desc: null,
    category: null,
    images: ['https://i.imgur.com/9CgGFfZ.jpeg']
  },
  {
    name: 'Panic Playdate',
    price: 160,
    desc: 'Very lightly used. Comes with purple cover and OEM USB-C cable.',
    category: 'games, tech',
    images: ['https://i.imgur.com/33PCQkA.jpeg', 'https://i.imgur.com/RZdM9sI.jpeg', 'https://i.imgur.com/ZR7dNOZ.jpeg']
  },
  {
    name: 'Nicholas Cage Eyemask',
    price: 'fwp',
    desc: 'Sealed, never used. No guarantee it won\'t haunt your dreams.',
    category: null,
    images: ['https://i.imgur.com/DlqpNya.jpeg']
  },
  {
    name: 'Bulbasaur Plushie Keychain',
    price: 'fwp',
    desc: null,
    category: null,
    images: ['https://i.imgur.com/IUAOPkV.jpeg']
  },
  {
    name: 'Chika Fujiwara Prize Figure',
    price: 10,
    desc: "Haven't been able to display her like she deserves.",
    category: 'figures',
    images: ['https://i.imgur.com/2p4E8QC.jpeg']
  },
  {
    name: 'Manga',
    price: '$2.00 each',
    desc: 'Manga includes Chainsaw Man v1-4 and Kaguya-sama v1-4.',
    category: null,
    images: ['https://i.imgur.com/mfojge3.jpeg']
  },
  {
    name: "Five Nights at Freddy's Cupcake Plushie",
    price: 'fwp',
    desc: 'Got at movie premiere.',
    category: null,
    images: ['https://i.imgur.com/TaPQCNh.jpeg']
  },
  {
    name: 'Untested XBOX 360s',
    price: 25,
    desc: "I don't have the means to test them, selling as is. Comes with half of a power supply for one of them.",
    category: 'games',
    images: ['https://i.imgur.com/gPnzetG.jpeg']
  },
  {
    name: 'Lemon Demon Cassette',
    price: 'fwp',
    desc: null,
    category: null,
    images: ['https://i.imgur.com/Xndbrxu.jpeg']
  },
  {
    name: 'Razer Kishi Mobile Controller',
    price: 10,
    desc: 'Used on an old phone. Uses USB-C. Verified working on my Pixel 9, although doesn\'t really mesh well with the camera bump.',
    category: 'games, tech',
    images: ['https://i.imgur.com/xhrEGlu.jpeg']
  },
  {
    name: 'Sylveon Nanoblocks',
    price: 5,
    desc: 'Sealed, never opened. Recieved as gift but Legos give me anxiety.',
    category: null,
    images: ['https://i.imgur.com/uyWdtM5.jpeg']
  },
  {
    name: 'Mysterious Ultra-Pro Binder',
    price: 10,
    desc: "I can't find anything about this binder online! Folds in half and stores 480 cards. Used as my primary binder until I switched to something more traditional.",
    category: 'cards',
    images: [
      'https://i.imgur.com/jIwcEVk.jpeg',
      'https://i.imgur.com/GN5G1Wq.jpeg',
      'https://i.imgur.com/ufQOGPM.jpeg'
    ]
  },
  {
    name: 'TI-30X IIS Scientific Calculator',
    price: 'fwp',
    desc: null,
    category: 'tech',
    images: ['https://i.imgur.com/3GQu012.jpeg']
  },
  {
    name: 'CASIO fx-9750 GII',
    price: 10,
    desc: null,
    category: 'tech',
    images: ['https://i.imgur.com/mGevk3Y.jpeg']
  },
  {
    name: 'Ultimate Guard Boulders',
    price: 10,
    desc: 'Set of three. 80+ size.',
    category: 'cards',
    images: ['https://i.imgur.com/Cdz6NEB.jpeg']
  },
  {
    name: 'Skyward Sword HD - Nintendo Switch',
    price: 35,
    desc: null,
    category: 'games',
    images: ['https://i.imgur.com/h3yEfxU.jpeg']
  },
  {
    name: 'Super Mario Maker 2 - Nintendo Switch',
    price: 25,
    desc: null,
    category: 'games',
    images: ['https://i.imgur.com/jMMV7jv.jpeg']
  },
  {
    name: 'Monster Hunter Rise - Nintendo Switch',
    price: 15,
    desc: null,
    category: 'games',
    images: ['https://i.imgur.com/CTIy8lq.jpeg']
  },
  {
    name: 'Kirby and the Forgotten Land - Nintendo Switch',
    price: 35,
    desc: null,
    category: 'games',
    images: ['https://i.imgur.com/8ioDcOT.jpeg']
  },
  {
    name: 'White Keyboard Cable',
    price: 'fwp',
    desc: 'USB-C to USB-A. Has aviator plug.',
    category: null,
    images: ['https://i.imgur.com/MyKeicW.jpeg']
  },
  {
    name: 'Amazon Fire Stick',
    price: 'fwp',
    desc: 'Untested. Does not have OEM power adapter.',
    category: 'tech',
    images: ['https://i.imgur.com/WZBMaMK.jpeg']
  },
  {
    name: 'ChonkerKeys Zoom Macro Pad',
    price: 25,
    desc: "Backed this as a KickStarter thinking I'd use it more than I did. Very lightly used. Comes with original box and accessories.",
    category: 'tech',
    images: ['https://i.imgur.com/oC6oHQe.jpeg']
  },
  {
    name: 'Synology DS220j NAS',
    price: 60,
    desc: 'Comes with original box and power supply. May not come with all screws and accessories. Used for a few years until upgrading. Works fine for serving files and single-user Plex.',
    category: 'tech',
    images: ['https://i.imgur.com/XnyixgP.jpeg', 'https://i.imgur.com/SxDskHH.jpeg', 'https://i.imgur.com/ufQOGPM.jpeg']
  },
  {
    name: 'Camp PAX Drawstring Bag',
    price: 10,
    desc: null,
    category: null,
    images: ['https://i.imgur.com/IvOo9Vv.jpeg']
  }
]);
