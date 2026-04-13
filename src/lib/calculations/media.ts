// Media assets registry — ported from saga_calc/assets/scripts/images.js
// Paths relative to /public/

export const systemMedia: Record<string, { video: string; poster: string }> = {
  angle: { video: '/img/angle/2.webm', poster: '/img/angle/2.png' },
  'embedded-wall': { video: '/img/embedded-wall/3.webm', poster: '/img/embedded-wall/3.png' },
  sync: { video: '/img/sync/1.webm', poster: '/img/sync/1.png' },
  cascade: { video: '/img/cascade/2.webm', poster: '/img/cascade/2.png' },
  unlinked: { video: '/img/unlinked/4.webm', poster: '/img/unlinked/4.png' },
  'wall-mounted': { video: '/img/wall-mounted/1.webm', poster: '/img/wall-mounted/1.png' },
  partition: { video: '/img/partition/2.webm', poster: '/img/partition/2.png' },
};

export const subsystemVideos: Record<string, Record<string, string>> = {
  angle: {
    '(1)+1C+1C+(1)': '/img/angle/1.webm',
    '1+2C+2C+1': '/img/angle/2.webm',
  },
  'embedded-wall': {
    '2+0': '/img/embedded-wall/1.webm',
    '2+0|2+0': '/img/embedded-wall/2.webm',
    '1WPUSH': '/img/embedded-wall/3.webm',
    '2WPUSH': '/img/embedded-wall/4.webm',
  },
  sync: {
    '(1)+1S+1S+(1)': '/img/sync/1.webm',
    '1+1S+1S+1': '/img/sync/2.webm',
    '(1)+(1)+1S+1S+(1)+(1)': '/img/sync/3.webm',
  },
  cascade: {
    '3+0': '/img/cascade/1.webm',
    '4+0': '/img/cascade/2.webm',
    '3+0|3+0': '/img/cascade/3.webm',
    '4+0|4+0': '/img/cascade/4.webm',
    '5+0': '/img/cascade/5.webm',
    '6+0': '/img/cascade/6.webm',
    '7+0': '/img/cascade/7.webm',
    '8+0': '/img/cascade/8.webm',
    '5+0|5+0': '/img/cascade/9.webm',
    '6+0|6+0': '/img/cascade/10.webm',
    '7+0|7+0': '/img/cascade/11.webm',
    '8+0|8+0': '/img/cascade/12.webm',
  },
  unlinked: {
    '(1)': '/img/unlinked/1.webm',
    '1': '/img/unlinked/2.webm',
    '(1)+1': '/img/unlinked/3.webm',
    '1+1': '/img/unlinked/4.webm',
    '(1)+1+(1)': '/img/unlinked/5.webm',
    '1+1+1': '/img/unlinked/6.webm',
    '(1)+1+1+(1)': '/img/unlinked/7.webm',
    '1+1+1+1': '/img/unlinked/8.webm',
  },
  'wall-mounted': {
    'Система 1W': '/img/wall-mounted/1.webm',
    'Система 1W+1W': '/img/wall-mounted/2.webm',
    'Система 1SW+1SW': '/img/wall-mounted/3.webm',
  },
  partition: {
    '(1)+(1)+(1)+1': '/img/partition/1.webm',
    '(1)+(1)+(1)+(1)+1': '/img/partition/2.webm',
    '(1)+(1)+1+1+(1)+(1)': '/img/partition/3.webm',
  },
};

export const subsystemPosters: Record<string, Record<string, string>> = {
  angle: {
    '(1)+1C+1C+(1)': '/img/angle/1.png',
    '1+2C+2C+1': '/img/angle/2.png',
  },
  'embedded-wall': {
    '2+0': '/img/embedded-wall/1.png',
    '2+0|2+0': '/img/embedded-wall/2.png',
    '1WPUSH': '/img/embedded-wall/3.png',
    '2WPUSH': '/img/embedded-wall/4.png',
  },
  sync: {
    '(1)+1S+1S+(1)': '/img/sync/1.png',
    '1+1S+1S+1': '/img/sync/2.png',
    '(1)+(1)+1S+1S+(1)+(1)': '/img/sync/3.png',
  },
  cascade: {
    '3+0': '/img/cascade/1.png',
    '4+0': '/img/cascade/2.png',
    '3+0|3+0': '/img/cascade/3.png',
    '4+0|4+0': '/img/cascade/4.png',
    '5+0': '/img/cascade/5.png',
    '6+0': '/img/cascade/6.png',
    '7+0': '/img/cascade/7.png',
    '8+0': '/img/cascade/8.png',
    '5+0|5+0': '/img/cascade/9.png',
    '6+0|6+0': '/img/cascade/10.png',
    '7+0|7+0': '/img/cascade/11.png',
    '8+0|8+0': '/img/cascade/12.png',
  },
  unlinked: {
    '(1)': '/img/unlinked/1.png',
    '1': '/img/unlinked/2.png',
    '(1)+1': '/img/unlinked/3.png',
    '1+1': '/img/unlinked/4.png',
    '(1)+1+(1)': '/img/unlinked/5.png',
    '1+1+1': '/img/unlinked/6.png',
    '(1)+1+1+(1)': '/img/unlinked/7.png',
    '1+1+1+1': '/img/unlinked/8.png',
  },
  'wall-mounted': {
    'Система 1W': '/img/wall-mounted/1.png',
    'Система 1W+1W': '/img/wall-mounted/2.png',
    'Система 1SW+1SW': '/img/wall-mounted/3.png',
  },
  partition: {
    '(1)+(1)+(1)+1': '/img/partition/1.png',
    '(1)+(1)+(1)+(1)+1': '/img/partition/2.png',
    '(1)+(1)+1+1+(1)+(1)': '/img/partition/3.png',
  },
};

export const glassImages: Record<string, string> = {
  'Прозрачное': '/img/glass/1.webp',
  'Пепельное': '/img/glass/2.webp',
  'Йодовое': '/img/glass/3.webp',
  'Рифленое': '/img/glass/4.webp',
  'Зеркальное': '/img/glass/5.webp',
  'Гравированное': '/img/glass/6.webp',
};

export const glassMobileImages: Record<string, string> = {
  'Прозрачное': '/img/glass/mobile/1.webp',
  'Пепельное': '/img/glass/mobile/2.webp',
  'Йодовое': '/img/glass/mobile/3.webp',
  'Рифленое': '/img/glass/mobile/4.webp',
  'Зеркальное': '/img/glass/mobile/5.webp',
  'Гравированное': '/img/glass/mobile/6.webp',
};

export const shotlanImages: Record<string, string> = {
  'Без шотланок': '/img/shotlan/none.webp',
  '1шт по горизонтали': '/img/shotlan/1.webp',
  '2шт по горизонтали': '/img/shotlan/2.webp',
  '1шт по вертикали': '/img/shotlan/3.webp',
  '1шт по вертикали и 1шт по горизонтали': '/img/shotlan/4.webp',
  '1шт по вертикали и 2шт по горизонтали': '/img/shotlan/5.webp',
  '1шт по вертикали и 3шт по горизонтали': '/img/shotlan/6.webp',
  '1шт по вертикали и 4шт по горизонтали': '/img/shotlan/7.webp',
  '1шт по вертикали и 5шт по горизонтали': '/img/shotlan/8.webp',
  'Очень много разделений': '/img/shotlan/9.webp',
};

export const shotlanMobileImages: Record<string, string> = {
  'Без шотланок': '/img/shotlan/mobile/0.webp',
  '1шт по горизонтали': '/img/shotlan/mobile/1.webp',
  '2шт по горизонтали': '/img/shotlan/mobile/2.webp',
  '1шт по вертикали': '/img/shotlan/mobile/3.webp',
  '1шт по вертикали и 1шт по горизонтали': '/img/shotlan/mobile/4.webp',
  '1шт по вертикали и 2шт по горизонтали': '/img/shotlan/mobile/5.webp',
  '1шт по вертикали и 3шт по горизонтали': '/img/shotlan/mobile/6.webp',
  '1шт по вертикали и 4шт по горизонтали': '/img/shotlan/mobile/7.webp',
  '1шт по вертикали и 5шт по горизонтали': '/img/shotlan/mobile/8.webp',
  'Очень много разделений': '/img/shotlan/mobile/9.webp',
};
