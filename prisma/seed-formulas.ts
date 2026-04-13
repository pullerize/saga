import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Русские названия компонентов
const N: Record<string, string> = {
  doorWidth: "Ширина двери",
  vertical_profile: "Профиль вертикальный (6м)",
  cap_no_brush: "Профиль заглушка без щётки (6м)",
  cap_with_brush: "Профиль заглушка с щёткой (6м)",
  profile_C_cap: 'Профиль заглушка "C" образная (6м)',
  profile_V_cap: 'Профиль заглушка "V" образная (6м)',
  corner_cap: "Профиль заглушка угловая (6м)",
  horizontal_profile: "Профиль горизонтальный (2м)",
  glass_seal: "Уплотнитель для стекла (2,5м)",
  bolts: "Болты для креплений (1шт)",
  handles: "Ручка (1шт)",
  top_rail_rubber: "Резина для верхних рельс (1м)",
  door_brush: "Щётка для стыка 2х дверей (1м)",
  top_rails_41: "Рельсы верхние 41мм (6м)",
  top_rails_47: "Рельсы верхние 47мм (6м)",
  side_rail_caps_45: "Заглушки боковые для рельс 45мм (6м)",
  side_rail_caps_51: "Заглушки боковые для рельс 51мм (6м)",
  bottom_double_caps: "Заглушки двойные для низа рельс (3м)",
  bottom_single_caps: "Заглушки одинарные для низа рельс (3м)",
  rail_to_rail: "Соединитель рельса+рельса",
  rail_to_cap: "Соединитель рельса+профиль",
  metal_aligner: "Выравниватель металлический (1шт)",
  plastic_aligner: "Выравниватель пластмассовый (1шт)",
  moving_mech_ci: "Механизм двигающейся двери CI (1 дверь)",
  moving_mech_dovodchik: "Механизм двигающейся двери доводчик (1 дверь)",
  belt_connector: "Механизм соединительный с ремнем (1 дверь)",
  belt_adapter: "Адаптеры для соединения ремня (1 дверь)",
  bottom_rollers: "Нижние ролики для двери (1 дверь)",
  corner_rubber: "Угловая резинка для стыка (1м)",
  fixed_door_profile: "Профиль для стационарной двери (2м)",
  fixed_mech: "Механизм для стационарной двери (1 дверь)",
  tros_mechanism: "Механизм с тросом (1 дверь)",
  door_brush_cord: "Резинка для стыка дверей (1м)",
  push_mechanism: "Механизм Push (толкни чтобы открыть)",
  gap_base_profile: "Профиль-основание для закрытия щели (3м)",
  gap_basic_cap: "Профиль-заглушка базовая для щели (3м)",
  gap_deco_cap: "Профиль-заглушка декоративная для щели (3м)",
  inner_support: "Внутренняя опора для рельсы (3м)",
  magnet: "Магнит для стыка угла (4шт)",
  glass_area: "Стекло (м²)",
  installation: "Сборка/установка (м²)",
  logistics: "Доп расходы (логистика)",
};

type F = { componentName: string; formula: string };

function formulas(sys: string, sub: string, items: F[]) {
  return items.map((f, i) => ({
    systemName: sys,
    subsystemName: sub,
    componentName: f.componentName,
    formula: f.formula,
    sortOrder: i,
  }));
}

// Common formulas (same across most systems, parameterized)
function commonFormulas(dwFormula: string): F[] {
  return [
    { componentName: N.doorWidth, formula: dwFormula },
    { componentName: N.vertical_profile, formula: "ЕСЛИ(Высота проёма <= 3000; 1; 2) * Кол-во дверей" },
    { componentName: N.horizontal_profile, formula: "ЕСЛИ(Ширина двери <= 970; 1; 2) * Кол-во дверей" },
    { componentName: N.glass_seal, formula: "((Ширина двери + Высота проёма) * 2) / 2500 * Кол-во дверей" },
    { componentName: N.bolts, formula: "Кол-во дверей * 8" },
    { componentName: N.handles, formula: "Кол-во ручек" },
    { componentName: N.glass_area, formula: "Ширина проёма (полностью) * Высота проёма / 1000000" },
    { componentName: N.installation, formula: "Ширина проёма (полностью) * Высота проёма / 1000000" },
    { componentName: N.logistics, formula: "1" },
  ];
}

async function main() {
  await prisma.systemFormula.deleteMany();
  console.log("Cleared old formulas");

  const all: Array<{ systemName: string; subsystemName: string; componentName: string; formula: string; sortOrder: number }> = [];

  // ═══════════════════════════════════════
  // КАСКАДНЫЕ ДВЕРИ
  // ═══════════════════════════════════════
  const cascadeSubs: [string, string][] = [
    ["3+0", "(Ширина проёма (полностью) + 35) / Кол-во дверей"],
    ["4+0", "(Ширина проёма (полностью) + 52) / Кол-во дверей"],
    ["5+0", "(Ширина проёма (полностью) + 70) / Кол-во дверей"],
    ["6+0", "(Ширина проёма (полностью) + 87) / Кол-во дверей"],
    ["7+0", "(Ширина проёма (полностью) + 105) / Кол-во дверей"],
    ["8+0", "(Ширина проёма (полностью) + 122) / Кол-во дверей"],
    ["3+0|3+0", "(Ширина проёма (полностью) + 70 - 15) / Кол-во дверей"],
    ["4+0|4+0", "(Ширина проёма (полностью) + 105 - 15) / Кол-во дверей"],
    ["5+0|5+0", "(Ширина проёма (полностью) + 140 - 15) / Кол-во дверей"],
    ["6+0|6+0", "(Ширина проёма (полностью) + 175 - 15) / Кол-во дверей"],
    ["7+0|7+0", "(Ширина проёма (полностью) + 210 - 15) / Кол-во дверей"],
    ["8+0|8+0", "(Ширина проёма (полностью) + 245 - 15) / Кол-во дверей"],
  ];
  for (const [sub, dw] of cascadeSubs) {
    all.push(...formulas("Каскадные двери", sub, [
      ...commonFormulas(dw),
      { componentName: N.cap_no_brush, formula: "ЕСЛИ(Высота проёма <= 3000; 0.5; 1) * Профиль заглушка без щётки" },
      { componentName: N.cap_with_brush, formula: "ЕСЛИ(Высота проёма <= 3000; 0.5; 1) * Профиль заглушка с щёткой" },
      { componentName: N.profile_C_cap, formula: "ЕСЛИ(Высота проёма <= 3000; 0.5; 1) * Профиль заглушка C" },
      { componentName: N.profile_V_cap, formula: "ЕСЛИ(Высота проёма <= 3000; 0.5; 1) * Профиль заглушка V" },
      { componentName: N.top_rail_rubber, formula: "Ширина проёма (полностью) * Кол-во рельсов * 2 / 1000" },
      { componentName: N.door_brush, formula: "Щётка для дверей * Кол-во дверей / 1000 * Высота проёма" },
      { componentName: N.top_rails_41, formula: "ЕСЛИ(Ширина проёма (полностью) <= 3000; 0.5; ЕСЛИ(Ширина проёма (полностью) <= 6000; 1; ЕСЛИ(Ширина проёма (полностью) <= 9000; 1.5; 2))) * Кол-во рельсов" },
      { componentName: N.side_rail_caps_45, formula: "ЕСЛИ(Ширина проёма (полностью) <= 3000; 0.5; ЕСЛИ(Ширина проёма (полностью) <= 6000; 1; ЕСЛИ(Ширина проёма (полностью) <= 9000; 1.5; 2))) * Кол-во боковых заглушек" },
      { componentName: N.bottom_double_caps, formula: "ЕСЛИ(Ширина проёма (полностью) <= 3000; 1; ЕСЛИ(Ширина проёма (полностью) <= 6000; 2; ЕСЛИ(Ширина проёма (полностью) <= 9000; 3; 4))) * Кол-во нижних двойных заглушек" },
      { componentName: N.bottom_single_caps, formula: "ЕСЛИ(Высота проёма <= 3000; 1; ЕСЛИ(Высота проёма <= 6000; 2; ЕСЛИ(Высота проёма <= 9000; 3; 4))) * Кол-во нижних одинарных заглушек" },
      { componentName: N.rail_to_rail, formula: "Ширина проёма (полностью) / 300 * Кол-во соединителей рельса+рельса" },
      { componentName: N.rail_to_cap, formula: "Ширина проёма (полностью) / 300 * Кол-во соединителей рельса+профиль" },
      { componentName: N.metal_aligner, formula: "Ширина проёма (полностью) / 500 * Кол-во рельсов" },
      { componentName: N.plastic_aligner, formula: "Ширина проёма (полностью) / 500 * Кол-во рельсов * 2" },
      { componentName: N.moving_mech_ci, formula: "Механизм CI" },
      { componentName: N.belt_connector, formula: "Механизм соединительный с ремнем" },
      { componentName: N.belt_adapter, formula: "Адаптеры ремня" },
      { componentName: N.corner_rubber, formula: "Угловая резинка * 2 * Высота проёма / 1000" },
      { componentName: N.bottom_rollers, formula: "Нижние ролики" },
    ]));
  }
  console.log("✓ Каскадные двери");

  // ═══════════════════════════════════════
  // СИНХРОННЫЕ ДВЕРИ
  // ═══════════════════════════════════════
  const syncSubs: [string, string][] = [
    ["1W+1W", "(Ширина проёма (полностью) + 32 - 15) / Кол-во дверей"],
    ["2W+2W", "(Ширина проёма (полностью) + 32 - 15) / Кол-во дверей"],
    ["3W+3W", "(Ширина проёма (полностью) + 32 - 15) / Кол-во дверей"],
  ];
  for (const [sub, dw] of syncSubs) {
    all.push(...formulas("Синхронные двери", sub, [
      ...commonFormulas(dw),
      { componentName: N.tros_mechanism, formula: "Механизм с тросом" },
      { componentName: N.fixed_door_profile, formula: "Высота проёма * 2 / 1000" },
      { componentName: N.fixed_mech, formula: "ЕСЛИ((Ширина двери - 12) <= 970; 1; 2) * Механизм стационарной двери" },
    ]));
  }
  console.log("✓ Синхронные двери");

  // ═══════════════════════════════════════
  // ДВЕРИ С УГЛОВЫМ ПРИМЫКАНИЕМ
  // ═══════════════════════════════════════
  const angleSubs: [string, string][] = [
    ["(1)+1C+1C+(1)", "(Ширина проёма (полностью) + 32 - 15) / Кол-во дверей"],
    ["1+2C+2C+1", "(Ширина проёма (полностью) + 70 - 15) / Кол-во дверей"],
  ];
  for (const [sub, dw] of angleSubs) {
    all.push(...formulas("Двери с угловым примыканием", sub, [
      ...commonFormulas(dw),
      { componentName: N.corner_cap, formula: "ЕСЛИ(Высота проёма <= 3000; 0.5; 1) * Профиль заглушка угловая" },
      { componentName: N.moving_mech_dovodchik, formula: "Механизм доводчик" },
      { componentName: N.belt_connector, formula: "Механизм соединительный с ремнем" },
      { componentName: N.belt_adapter, formula: "ЕСЛИ((Ширина двери - 12) <= 970; 1; 2) * Адаптеры ремня" },
      { componentName: N.bottom_rollers, formula: "Нижние ролики" },
      { componentName: N.fixed_door_profile, formula: "ЕСЛИ((Ширина двери - 12) <= 970; 1; 2) * Профиль стационарной двери" },
      { componentName: N.fixed_mech, formula: "Механизм стационарной двери" },
      { componentName: N.magnet, formula: "1" },
    ]));
  }
  console.log("✓ Двери с угловым примыканием");

  // ═══════════════════════════════════════
  // ПУШ ДВЕРИ (EMBEDDED-WALL)
  // ═══════════════════════════════════════
  const pushSubs: [string, string][] = [
    ["2+0", "(Ширина проёма (открытая часть) + 17.5 + 16) / Кол-во дверей"],
    ["2+0|2+0", "(Ширина проёма (открытая часть) + 70 - 15 + 32) / Кол-во дверей"],
    ["1WPUSH", "(Ширина проёма (открытая часть) - 6) / Кол-во дверей"],
    ["2WPUSH", "(Ширина проёма (открытая часть) - 6 + 16) / Кол-во дверей"],
  ];
  for (const [sub, dw] of pushSubs) {
    all.push(...formulas("Пуш двери", sub, [
      ...commonFormulas(dw),
      { componentName: N.push_mechanism, formula: "Push механизм" },
      { componentName: N.gap_base_profile, formula: "Профиль-основание щели" },
      { componentName: N.gap_basic_cap, formula: "Профиль-заглушка базовая щели" },
      { componentName: N.gap_deco_cap, formula: "Профиль-заглушка декоративная щели" },
      { componentName: N.inner_support, formula: "Внутренняя опора рельсы" },
    ]));
  }
  console.log("✓ Пуш двери");

  // ═══════════════════════════════════════
  // НЕ СВЯЗАННЫЕ МЕЖДУ СОБОЙ ДВЕРИ
  // ═══════════════════════════════════════
  const unlinkedSubs: [string, string][] = [
    ["1W", "Ширина проёма (полностью) / Кол-во дверей"],
    ["1W+1W", "Ширина проёма (полностью) / Кол-во дверей"],
    ["2W", "(Ширина проёма (полностью) + 16) / Кол-во дверей"],
    ["2W+2W", "(Ширина проёма (полностью) + 16) / Кол-во дверей"],
    ["3W", "(Ширина проёма (полностью) + 32) / Кол-во дверей"],
    ["3W+3W", "(Ширина проёма (полностью) + 32) / Кол-во дверей"],
    ["1W|1W", "(Ширина проёма (полностью) + 32 - 15) / Кол-во дверей"],
    ["2W|2W", "(Ширина проёма (полностью) + 32 - 15) / Кол-во дверей"],
  ];
  for (const [sub, dw] of unlinkedSubs) {
    all.push(...formulas("Не связанные двери", sub, commonFormulas(dw)));
  }
  console.log("✓ Не связанные двери");

  // ═══════════════════════════════════════
  // НАСТЕННЫЕ ДВЕРИ
  // ═══════════════════════════════════════
  const wallSubs: [string, string][] = [
    ["1W", "(Ширина проёма (открытая часть) + 16) / Кол-во дверей"],
    ["2W", "(Ширина проёма (открытая часть) + 32) / Кол-во дверей"],
    ["1W|1W", "(Ширина проёма (открытая часть) + 32 - 15) / Кол-во дверей"],
  ];
  for (const [sub, dw] of wallSubs) {
    all.push(...formulas("Настенные двери", sub, commonFormulas(dw)));
  }
  console.log("✓ Настенные двери");

  // ═══════════════════════════════════════
  // СТЕНА ПЕРЕГОРОДКА
  // ═══════════════════════════════════════
  const partSubs: [string, string][] = [
    ["2W", "(Ширина проёма (полностью) + 16) / Кол-во дверей"],
    ["2W+2W", "(Ширина проёма (полностью) + 16) / Кол-во дверей"],
    ["1W|1W", "(Ширина проёма (полностью) + 32 - 15) / Кол-во дверей"],
  ];
  for (const [sub, dw] of partSubs) {
    all.push(...formulas("Стена перегородка", sub, commonFormulas(dw)));
  }
  console.log("✓ Стена перегородка");

  // ═══════════════════════════════════════
  // PIVOT
  // ═══════════════════════════════════════
  const pivotSubs: [string, string][] = [
    ["1", "(Ширина проёма (полностью) - 3 * (Кол-во дверей + 1)) / Кол-во дверей"],
    ["2", "(Ширина проёма (полностью) - 3 * (Кол-во дверей + 1)) / Кол-во дверей"],
    ["3", "(Ширина проёма (полностью) - 3 * (Кол-во дверей + 1)) / Кол-во дверей"],
    ["1+1", "(Ширина проёма (полностью) - 3 * (Кол-во дверей + 1) + 1) / Кол-во дверей"],
    ["2+2", "(Ширина проёма (полностью) - 3 * (Кол-во дверей + 1)) / Кол-во дверей"],
    ["3+3", "(Ширина проёма (полностью) - 3 * (Кол-во дверей + 1)) / Кол-во дверей"],
    ["4+4", "(Ширина проёма (полностью) - 3 * (Кол-во дверей + 1)) / Кол-во дверей"],
  ];
  for (const [sub, dw] of pivotSubs) {
    all.push(...formulas("Pivot", sub, commonFormulas(dw)));
  }
  console.log("✓ Pivot");

  // ═══════════════════════════════════════
  // ГАРМОШКИ
  // ═══════════════════════════════════════
  const harmSubs: [string, string][] = [
    ["3", "(Ширина проёма (полностью) - (Кол-во дверей * 3) - 93) / Кол-во дверей"],
    ["5", "(Ширина проёма (полностью) - (Кол-во дверей * 3) - 93) / Кол-во дверей"],
    ["7", "(Ширина проёма (полностью) - (Кол-во дверей * 3) - 93) / Кол-во дверей"],
  ];
  for (const [sub, dw] of harmSubs) {
    all.push(...formulas("Гармошки", sub, commonFormulas(dw)));
  }
  console.log("✓ Гармошки");

  // Bulk insert
  for (const f of all) {
    await prisma.systemFormula.upsert({
      where: {
        systemName_subsystemName_componentName: {
          systemName: f.systemName,
          subsystemName: f.subsystemName,
          componentName: f.componentName,
        },
      },
      update: { formula: f.formula, sortOrder: f.sortOrder },
      create: f,
    });
  }

  console.log(`\n✓ Загружено ${all.length} формул`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
