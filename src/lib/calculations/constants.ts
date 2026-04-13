// Exact port from saga_calc/assets/scripts/calc-constants.js

export const glassOptions = [
  'Прозрачное',
  'Пепельное',
  'Йодовое',
  'Рифленое',
  'Зеркальное',
  'Гравированное',
] as const;

export type GlassOption = (typeof glassOptions)[number];

export const shotlanOptions = [
  'Без шотланок',
  '1шт по горизонтали',
  '2шт по горизонтали',
  '1шт по вертикали',
  '1шт по вертикали и 1шт по горизонтали',
  '1шт по вертикали и 2шт по горизонтали',
  '1шт по вертикали и 3шт по горизонтали',
  '1шт по вертикали и 4шт по горизонтали',
  '1шт по вертикали и 5шт по горизонтали',
  'Очень много разделений',
] as const;

export type ShotlanOption = (typeof shotlanOptions)[number];

export const hideWithRiffled: ShotlanOption[] = [
  '1шт по вертикали и 3шт по горизонтали',
  '1шт по вертикали и 4шт по горизонтали',
  '1шт по вертикали и 5шт по горизонтали',
  'Очень много разделений',
];

export interface Prices {
  [key: string]: number | Record<string, number>;
  glass: Record<string, number>;
  installation: number;
  logistics: number;
}

export const defaultPrices: Prices = {
  vertical_profile: 60,
  cap_no_brush: 25,
  cap_with_brush: 25,
  profile_C_cap: 30,
  profile_V_cap: 30,
  horizontal_profile: 27,
  glass_seal: 7,
  bolts: 0.5,
  handles: 25,
  top_rail_rubber: 0.5,
  door_brush_joint: 0.5,
  top_rails_41: 75,
  side_rail_caps_45: 35,
  side_rail_caps_51: 35,
  bottom_double_caps: 7,
  bottom_single_caps: 5,
  corner_cap: 30,
  belt_connector_mechanism: 75,
  top_rails: 75,
  top_rails_47: 70,
  rail_to_rail_connectors: 0.5,
  rail_to_cap_connectors: 0.5,
  metal_rail_aligner: 0.5,
  plastic_rail_aligner: 0.25,
  moving_mechanism_dovodchik: 75,
  moving_mechanism_belt_connector: 75,
  moving_mechanism_ci: 75,
  moving_mechanism_ct: 65,
  cable_mechanism: 65,
  moving_mechanism: 75,
  adapter_belt: 5,
  belt_connector: 75,
  belt_adapter: 5,
  bottom_rollers: 10,
  corner_rubber_joint: 0.2,
  push_mechanism: 50,
  gap_base_profile: 10,
  gap_basic_cap_profile: 7,
  gap_deco_cap_profile: 8,
  inner_support_profile: 25,
  gap_rubber: 0.2,
  fixed_door_profile: 10,
  fixed_mechanism: 35,
  corner_magnet: 16,
  wall_connector: 5,
  divider_profile: 10,
  adhesive_profile: 4,
  additional_glass_seal: 7,
  bolts_extra: 0.5,
  tape_33m: 5,
  glass: {
    'Прозрачное': 45,
    'Пепельное': 27,
    'Йодовое': 27,
    'Рифленое': 82.5,
    'Зеркальное': 96,
    'Гравированное': 310,
  },
  installation: 60,
  logistics: 50,
};

export const componentNames: Record<string, string> = {
  vertical_profile: 'Профиль вертикальный (6м)',
  cap_no_brush: 'Профиль заглушка без щетки (6м)',
  cap_with_brush: 'Профиль заглушка с щеткой (6м)',
  profile_C_cap: 'Профиль заглушка "C" образная (6м)',
  profile_V_cap: 'Профиль заглушка "V" образная (6м)',
  horizontal_profile: 'Профиль горизонтальный (2м)',
  glass_seal: 'Уплотнитель для стекла (2,5м)',
  bolts: 'Болты для креплений (1шт)',
  handles: 'Ручка (1шт)',
  top_rail_rubber: 'Резина для верхних рельс (1м)',
  door_brush_joint: 'Щетка для стыка 2х дверей (1м)',
  top_rails_41: 'Рельсы верхние 41мм (6м)',
  top_rails: 'Рельсы верхние 41мм (6м)',
  top_rails_47: 'Рельсы верхние 47мм (6м)',
  side_rail_caps_45: 'Заглушки боковые для рельс 45мм (6м)',
  side_rail_caps_51: 'Заглушки боковые для рельс 51мм (6м)',
  bottom_double_caps: 'Заглушки двойные для низа рельс (3м)',
  bottom_single_caps: 'Заглушки одинарные для низа рельс (3м)',
  corner_cap: 'Профиль заглушка угловая (6м)',
  rail_to_rail_connectors: 'Соединитель рельса+рельса',
  rail_to_cap_connectors: 'Соединитель рельса+профиль',
  metal_rail_aligner: 'Выравниватель для рельсы металлический (1шт)',
  plastic_rail_aligner: 'Выравниватель для рельсы пластмассовый (1шт)',
  moving_mechanism_dovodchik: 'Механизм для двигающейся двери, доводчик (комплект на 1 дверь)',
  moving_mechanism_belt_connector: 'Механизм соединительный с ремнем (комплект на 1 дверь)',
  belt_connector: 'Механизм соединительный с ремнем (комплект на 1 дверь)',
  moving_mechanism_ci: 'Механизм для двигающейся двери, доводчик (комплект на 1 дверь)',
  moving_mechanism_ct: 'Механизм для двигающейся двери с тросом (комплект на 1 дверь)',
  cable_mechanism: 'Механизм соединительный с тросом (комплект на 1 дверь)',
  moving_mechanism: 'Механизм для двигающейся двери (комплект на 1 дверь)',
  belt_connector_mechanism: 'Механизм соединительный с ремнем (комплект на 1 дверь)',
  adapter_belt: 'Дополнительные адаптеры для соединения ремня (комплект на 1 дверь)',
  belt_adapter: 'Дополнительные адаптеры для соединения ремня (комплект на 1 дверь)',
  bottom_rollers: 'Дополнительные нижние ролики для двери (комплект на 1 дверь)',
  corner_rubber_joint: 'Резинка для стыка двух дверей (1м)',
  push_mechanism: 'Механизм Push (Толкни, чтобы открыть)',
  gap_base_profile: 'Профиль - основание для закрытия щели (3м)',
  gap_basic_cap_profile: 'Профиль - заглушка базовая для закрытия щели (3м)',
  gap_deco_cap_profile: 'Профиль - заглушка декоративная для закрытия щели (3м)',
  inner_support_profile: 'Внутренняя опора для рельсы (3м)',
  gap_rubber: 'Резинка для стыка двух дверей (1м)',
  fixed_door_profile: 'Профиль для стационарной двери (2м)',
  fixed_mechanism: 'Механизм для стационарной двери (комплект на 1 дверь)',
  corner_magnet: 'Магнит для стыка угла (4шт)',
  wall_connector: 'Металлический коннектор рельсы к стене (1шт)',
  glass: 'Стекло',
  installation: 'Сборка/установка',
  logistics: 'Доп расходы (логистика и т.д.)',
  divider_profile: 'Разделительный профиль, делящий стекло (1м)',
  additional_glass_seal: 'Дополнительный уплотнитель для стекла (2,5м)',
  bolts_extra: 'Дополнительные болты для креплений (1шт)',
  adhesive_profile: 'Разделительный профиль, клеящийся на стекло (3м)',
  tape_33m: 'Специальный скотч двухсторонний (33м)',
};

// Load custom prices from localStorage (client-side only)
export function getPrices(): Prices {
  if (typeof window === 'undefined') return defaultPrices;
  try {
    const custom = localStorage.getItem('customPrices');
    if (custom) return JSON.parse(custom);
  } catch {
    // ignore
  }
  return defaultPrices;
}
