import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PARAMS: { key: string; label: string }[] = [
  { key: "doors", label: "Кол-во дверей" },
  { key: "num_doors", label: "Кол-во дверей" },
  { key: "num_rails", label: "Кол-во рельсов" },
  { key: "num_rails_41", label: "Рельсы 41мм (кол-во)" },
  { key: "num_rails_47", label: "Рельсы 47мм (кол-во)" },
  { key: "rails", label: "Кол-во рельсов" },
  { key: "num_handles", label: "Кол-во ручек" },
  { key: "handles", label: "Кол-во ручек" },
  { key: "num_side_caps", label: "Боковые заглушки" },
  { key: "side_rail_caps_45", label: "Заглушки рельс 45мм" },
  { key: "side_rail_caps_51", label: "Заглушки рельс 51мм" },
  { key: "num_side_caps_45", label: "Заглушки рельс 45мм" },
  { key: "num_side_caps_51", label: "Заглушки рельс 51мм" },
  { key: "num_bottom_double_caps", label: "Двойные заглушки низа" },
  { key: "num_bottom_single_caps", label: "Одинарные заглушки низа" },
  { key: "bottom_double_caps", label: "Двойные заглушки низа" },
  { key: "bottom_single_caps", label: "Одинарные заглушки низа" },
  { key: "cap_no_brush", label: "Заглушка без щётки" },
  { key: "cap_with_brush", label: "Заглушка с щёткой" },
  { key: "capWithBrush", label: "Заглушка с щёткой" },
  { key: "profile_cap_no_brush", label: "Профиль-заглушка без щётки" },
  { key: "profile_cap_with_brush", label: "Профиль-заглушка с щёткой" },
  { key: "profile_C_cap", label: "Профиль-заглушка C-образная" },
  { key: "profile_V_cap", label: "Профиль-заглушка V-образная" },
  { key: "corner_cap", label: "Угловая заглушка" },
  { key: "num_rail_to_rail_connectors", label: "Соединители рельса-рельса" },
  { key: "rail_to_rail_connectors", label: "Соединители рельса-рельса" },
  { key: "num_rrconn", label: "Соединители рельса-рельса" },
  { key: "num_rail_to_cap_connectors", label: "Соединители рельса-профиль" },
  { key: "rail_to_cap_connectors", label: "Соединители рельса-профиль" },
  { key: "num_rcconn", label: "Соединители рельса-профиль" },
  { key: "door_brush", label: "Щётка для стыка дверей" },
  { key: "door_brush_joint", label: "Щётка для стыка дверей" },
  { key: "moving_mechanism", label: "Подвижный механизм" },
  { key: "moving_mechanism_ci", label: "Механизм CI" },
  { key: "moving_mechanism_ct", label: "Механизм CT (с тросом)" },
  { key: "moving_mechanism_dovodchik", label: "Механизм-доводчик" },
  { key: "moving_mechanism_belt_connector", label: "Ремённый механизм" },
  { key: "moving_mechanism_tros", label: "Механизм с тросом" },
  { key: "num_moving_mechanisms", label: "Кол-во подвижных механизмов" },
  { key: "n_ci", label: "Механизм CI (кол-во)" },
  { key: "n_ct", label: "Механизм CT (кол-во)" },
  { key: "fixed_mechanism", label: "Неподвижный механизм" },
  { key: "num_fixed_mechanisms", label: "Кол-во неподвижных механизмов" },
  { key: "fixed_door_profile", label: "Профиль неподвижной двери" },
  { key: "belt_connector_mechanism", label: "Соединительный ремень" },
  { key: "belt_adapter", label: "Адаптер ремня" },
  { key: "adapter_belt", label: "Адаптер ремня" },
  { key: "bottom_rollers", label: "Нижние ролики" },
  { key: "corner_rubber_joint", label: "Угловая резинка" },
  { key: "gap_rubber", label: "Резинка зазора" },
  { key: "push_mechanism", label: "Механизм push-to-open" },
  { key: "gap_base_profile", label: "Базовый профиль зазора" },
  { key: "gap_basic_cap_profile", label: "Заглушка зазора (базовая)" },
  { key: "gap_deco_cap_profile", label: "Заглушка зазора (декор)" },
  { key: "inner_support_profile", label: "Внутренний опорный профиль" },
  { key: "width_adjustment", label: "Коррекция ширины" },
  { key: "door_width_offset", label: "Смещение ширины двери" },
];

async function main() {
  console.log("Seeding param definitions...");
  for (const p of PARAMS) {
    await prisma.paramDefinition.upsert({
      where: { key: p.key },
      update: { label: p.label },
      create: p,
    });
  }
  console.log(`Done — ${PARAMS.length} params seeded.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
