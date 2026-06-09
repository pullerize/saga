// Media assets registry — ported from saga_calc/assets/scripts/images.js
// Paths relative to /public/

export const systemMedia: Record<string, { video: string; poster: string }> = {
  angle: { video: '', poster: '' },
  'embedded-wall': { video: '', poster: '' },
  sync: { video: '', poster: '' },
  cascade: { video: '', poster: '' },
  unlinked: { video: '', poster: '' },
  'wall-mounted': { video: '', poster: '' },
  partition: { video: '', poster: '' },
};

export const subsystemVideos: Record<string, Record<string, string>> = {
  angle: {
    '(1)+1C+1C+(1)': '',
    '1+2C+2C+1': '',
  },
  'embedded-wall': {
    '2+0': '',
    '2+0|2+0': '',
    '1WPUSH': '',
    '2WPUSH': '',
  },
  sync: {
    '(1)+1S+1S+(1)': '',
    '1+1S+1S+1': '',
    '(1)+(1)+1S+1S+(1)+(1)': '',
  },
  cascade: {
    '3+0': '',
    '4+0': '',
    '3+0 | 3+0': '',
    '4+0 | 4+0': '',
    '5+0': '',
    '6+0': '',
    '7+0': '',
    '8+0': '',
    '5+0 | 5+0': '',
    '6+0 | 6+0': '',
    '7+0 | 7+0': '',
    '8+0 | 8+0': '',
  },
  unlinked: {
    '(1)': '',
    '1': '',
    '(1)+1': '',
    '1+1': '',
    '(1)+1+(1)': '',
    '1+1+1': '',
    '(1)+1+1+(1)': '',
    '1+1+1+1': '',
  },
  'wall-mounted': {
    'Система 1W': '',
    'Система 1W+1W': '',
    'Система 1SW+1SW': '',
  },
  partition: {
    '(1)+(1)+(1)+1': '',
    '(1)+(1)+(1)+(1)+1': '',
    '(1)+(1)+1+1+(1)+(1)': '',
  },
};

export const subsystemPosters: Record<string, Record<string, string>> = {
  angle: {
    '(1)+1C+1C+(1)': '',
    '1+2C+2C+1': '',
  },
  'embedded-wall': {
    '2+0': '',
    '2+0|2+0': '',
    '1WPUSH': '',
    '2WPUSH': '',
  },
  sync: {
    '(1)+1S+1S+(1)': '',
    '1+1S+1S+1': '',
    '(1)+(1)+1S+1S+(1)+(1)': '',
  },
  cascade: {
    '3+0': '',
    '4+0': '',
    '3+0 | 3+0': '',
    '4+0 | 4+0': '',
    '5+0': '',
    '6+0': '',
    '7+0': '',
    '8+0': '',
    '5+0 | 5+0': '',
    '6+0 | 6+0': '',
    '7+0 | 7+0': '',
    '8+0 | 8+0': '',
  },
  unlinked: {
    '(1)': '',
    '1': '',
    '(1)+1': '',
    '1+1': '',
    '(1)+1+(1)': '',
    '1+1+1': '',
    '(1)+1+1+(1)': '',
    '1+1+1+1': '',
  },
  'wall-mounted': {
    'Система 1W': '',
    'Система 1W+1W': '',
    'Система 1SW+1SW': '',
  },
  partition: {
    '(1)+(1)+(1)+1': '',
    '(1)+(1)+(1)+(1)+1': '',
    '(1)+(1)+1+1+(1)+(1)': '',
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

/** Краткое описание стекла — для PDF/UI под картинкой стекла. */
export const glassDescriptions: Record<string, string> = {
  'Прозрачное':   'Прозрачное стекло толщиной 6 мм, каленое.',
  'Пепельное':    'Тонированное стекло пепельного оттенка, 6 мм, каленое.',
  'Йодовое':      'Тонированное стекло йодового оттенка, 6 мм, каленое.',
  'Рифленое':     'Рифлёное матовое стекло с фактурой, 6 мм, каленое.',
  'Зеркальное':   'Зеркальное стекло, 6 мм, каленое.',
  'Гравированное':'Декоративное стекло с гравировкой, 6 мм, каленое.',
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
