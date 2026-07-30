import { SlideshowSettings } from '../types';

export const DEFAULT_SLIDESHOW_SETTINGS: SlideshowSettings = {
  enabled: false,
  items: [
    {
      id: 'slide_default_1',
      type: 'image',
      url: 'https://i.postimg.cc/Zq4wYGVg/Wallpaper-1.png',
      name: 'Acrobatic Flatulence Pose 💨'
    },
    {
      id: 'slide_default_2',
      type: 'image',
      url: 'https://i.postimg.cc/pds4wVPt/Wallpaper-2.png',
      name: 'Thunder Squat Blast-Off 💨'
    },
    {
      id: 'slide_default_3',
      type: 'image',
      url: 'https://i.postimg.cc/gj8M2GbY/Wallpaper-3.png',
      name: 'Super Sonic Fart Kick 💨'
    },
    {
      id: 'slide_default_4',
      type: 'image',
      url: 'https://i.postimg.cc/02ZYdzn9/Wallpaper-4.png',
      name: 'Mid-Air Turbo Boost 💨'
    },
    {
      id: 'slide_default_5',
      type: 'image',
      url: 'https://i.postimg.cc/4dTHTGP6/Wallpaper-5.png',
      name: 'The Ultimate Crop Duster 💨'
    }
  ],
  timingMode: 'fixed',
  slideDuration: 5,
  beatInterval: 8,
  transitionStyle: 'crossfade',
  transitionDuration: 1.2,
  loop: true,
  kenBurnsZoom: true,
};

export const SAMPLE_STOCK_MEDIA = [
  {
    type: 'image' as const,
    url: 'https://i.postimg.cc/Zq4wYGVg/Wallpaper-1.png',
    name: 'Acrobatic Flatulence Pose 💨'
  },
  {
    type: 'image' as const,
    url: 'https://i.postimg.cc/pds4wVPt/Wallpaper-2.png',
    name: 'Thunder Squat Blast-Off 💨'
  },
  {
    type: 'image' as const,
    url: 'https://i.postimg.cc/gj8M2GbY/Wallpaper-3.png',
    name: 'Super Sonic Fart Kick 💨'
  },
  {
    type: 'image' as const,
    url: 'https://i.postimg.cc/02ZYdzn9/Wallpaper-4.png',
    name: 'Mid-Air Turbo Boost 💨'
  },
  {
    type: 'image' as const,
    url: 'https://i.postimg.cc/4dTHTGP6/Wallpaper-5.png',
    name: 'The Ultimate Crop Duster 💨'
  }
];
