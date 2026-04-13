import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.$transaction(async (tx) => {
    // ── Clear existing data (FK-safe order) ──
    await tx.calculation.deleteMany();
    await tx.partnerPrice.deleteMany();
    await tx.component.deleteMany();
    await tx.subsystem.deleteMany();
    await tx.doorSystem.deleteMany();
    await tx.glassType.deleteMany();
    await tx.shotlanOption.deleteMany();
    await tx.additionalService.deleteMany();
    await tx.user.deleteMany();

    console.log('  Cleared existing data');

    // ══════════════════════════════════════════
    // 1. Users
    // ══════════════════════════════════════════

    const adminHash = await hash('admin123', 12);
    const partnerHash = await hash('partner123', 12);

    await tx.user.create({
      data: {
        email: 'admin@saga.uz',
        passwordHash: adminHash,
        name: 'Администратор',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    await tx.user.create({
      data: {
        email: 'partner@saga.uz',
        passwordHash: partnerHash,
        name: 'Партнёр Демо',
        role: 'PARTNER',
        status: 'ACTIVE',
        companyName: 'Demo Company',
      },
    });

    console.log('  Created users');

    // ══════════════════════════════════════════
    // 2. Components
    // ══════════════════════════════════════════

    const components: { key: string; name: string; defaultPrice: number; unit?: string; category?: string }[] = [
      { key: 'vertical_profile', name: 'Профиль вертикальный (6м)', defaultPrice: 60 },
      { key: 'cap_no_brush', name: 'Профиль заглушка без щетки (6м)', defaultPrice: 25 },
      { key: 'cap_with_brush', name: 'Профиль заглушка с щеткой (6м)', defaultPrice: 25 },
      { key: 'profile_C_cap', name: 'Профиль заглушка "C" образная (6м)', defaultPrice: 30 },
      { key: 'profile_V_cap', name: 'Профиль заглушка "V" образная (6м)', defaultPrice: 30 },
      { key: 'horizontal_profile', name: 'Профиль горизонтальный (2м)', defaultPrice: 27 },
      { key: 'glass_seal', name: 'Уплотнитель для стекла (2,5м)', defaultPrice: 7 },
      { key: 'bolts', name: 'Болты для креплений (1шт)', defaultPrice: 0.5 },
      { key: 'handles', name: 'Ручка (1шт)', defaultPrice: 25 },
      { key: 'top_rail_rubber', name: 'Резина для верхних рельс (1м)', defaultPrice: 0.5 },
      { key: 'door_brush_joint', name: 'Щетка для стыка 2х дверей (1м)', defaultPrice: 0.5 },
      { key: 'top_rails_41', name: 'Рельсы верхние 41мм (6м)', defaultPrice: 75 },
      { key: 'top_rails', name: 'Рельсы верхние 41мм (6м)', defaultPrice: 75 },
      { key: 'top_rails_47', name: 'Рельсы верхние 47мм (6м)', defaultPrice: 70 },
      { key: 'side_rail_caps_45', name: 'Заглушки боковые для рельс 45мм (6м)', defaultPrice: 35 },
      { key: 'side_rail_caps_51', name: 'Заглушки боковые для рельс 51мм (6м)', defaultPrice: 35 },
      { key: 'bottom_double_caps', name: 'Заглушки двойные для низа рельс (3м)', defaultPrice: 7 },
      { key: 'bottom_single_caps', name: 'Заглушки одинарные для низа рельс (3м)', defaultPrice: 5 },
      { key: 'corner_cap', name: 'Профиль заглушка угловая (6м)', defaultPrice: 30 },
      { key: 'belt_connector_mechanism', name: 'Механизм соединительный с ремнем (комплект на 1 дверь)', defaultPrice: 75 },
      { key: 'rail_to_rail_connectors', name: 'Соединитель рельса+рельса', defaultPrice: 0.5 },
      { key: 'rail_to_cap_connectors', name: 'Соединитель рельса+профиль', defaultPrice: 0.5 },
      { key: 'metal_rail_aligner', name: 'Выравниватель для рельсы металлический (1шт)', defaultPrice: 0.5 },
      { key: 'plastic_rail_aligner', name: 'Выравниватель для рельсы пластмассовый (1шт)', defaultPrice: 0.25 },
      { key: 'moving_mechanism_dovodchik', name: 'Механизм для двигающейся двери, доводчик (комплект на 1 дверь)', defaultPrice: 75 },
      { key: 'moving_mechanism_belt_connector', name: 'Механизм соединительный с ремнем (комплект на 1 дверь)', defaultPrice: 75 },
      { key: 'moving_mechanism_ci', name: 'Механизм для двигающейся двери, доводчик (комплект на 1 дверь)', defaultPrice: 75 },
      { key: 'moving_mechanism_ct', name: 'Механизм для двигающейся двери с тросом (комплект на 1 дверь)', defaultPrice: 65 },
      { key: 'cable_mechanism', name: 'Механизм соединительный с тросом (комплект на 1 дверь)', defaultPrice: 65 },
      { key: 'moving_mechanism', name: 'Механизм для двигающейся двери (комплект на 1 дверь)', defaultPrice: 75 },
      { key: 'adapter_belt', name: 'Дополнительные адаптеры для соединения ремня (комплект на 1 дверь)', defaultPrice: 5 },
      { key: 'belt_connector', name: 'Механизм соединительный с ремнем (комплект на 1 дверь)', defaultPrice: 75 },
      { key: 'belt_adapter', name: 'Дополнительные адаптеры для соединения ремня (комплект на 1 дверь)', defaultPrice: 5 },
      { key: 'bottom_rollers', name: 'Дополнительные нижние ролики для двери (комплект на 1 дверь)', defaultPrice: 10 },
      { key: 'corner_rubber_joint', name: 'Резинка для стыка двух дверей (1м)', defaultPrice: 0.2 },
      { key: 'push_mechanism', name: 'Механизм Push (Толкни, чтобы открыть)', defaultPrice: 50 },
      { key: 'gap_base_profile', name: 'Профиль - основание для закрытия щели (3м)', defaultPrice: 10 },
      { key: 'gap_basic_cap_profile', name: 'Профиль - заглушка базовая для закрытия щели (3м)', defaultPrice: 7 },
      { key: 'gap_deco_cap_profile', name: 'Профиль - заглушка декоративная для закрытия щели (3м)', defaultPrice: 8 },
      { key: 'inner_support_profile', name: 'Внутренняя опора для рельсы (3м)', defaultPrice: 25 },
      { key: 'gap_rubber', name: 'Резинка для стыка двух дверей (1м)', defaultPrice: 0.2 },
      { key: 'fixed_door_profile', name: 'Профиль для стационарной двери (2м)', defaultPrice: 10 },
      { key: 'fixed_mechanism', name: 'Механизм для стационарной двери (комплект на 1 дверь)', defaultPrice: 35 },
      { key: 'corner_magnet', name: 'Магнит для стыка угла (4шт)', defaultPrice: 16 },
      { key: 'wall_connector', name: 'Металлический коннектор рельсы к стене (1шт)', defaultPrice: 5 },
      { key: 'divider_profile', name: 'Разделительный профиль, делящий стекло (1м)', defaultPrice: 10 },
      { key: 'adhesive_profile', name: 'Разделительный профиль, клеящийся на стекло (3м)', defaultPrice: 4 },
      { key: 'additional_glass_seal', name: 'Дополнительный уплотнитель для стекла (2,5м)', defaultPrice: 7 },
      { key: 'bolts_extra', name: 'Дополнительные болты для креплений (1шт)', defaultPrice: 0.5 },
      { key: 'tape_33m', name: 'Специальный скотч двухсторонний (33м)', defaultPrice: 5 },
      { key: 'installation', name: 'Сборка/установка', defaultPrice: 60, unit: 'м²', category: 'service' },
      { key: 'logistics', name: 'Доп расходы (логистика и т.д.)', defaultPrice: 50, unit: '', category: 'service' },
    ];

    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      await tx.component.create({
        data: {
          key: c.key,
          name: c.name,
          defaultPrice: c.defaultPrice,
          unit: c.unit ?? 'шт',
          category: c.category ?? 'component',
          sortOrder: i,
        },
      });
    }

    console.log(`  Created ${components.length} components`);

    // ══════════════════════════════════════════
    // 3. Glass Types
    // ══════════════════════════════════════════

    const glassTypes: { name: string; defaultPrice: number; restrictedShotlans?: string[] }[] = [
      { name: 'Прозрачное', defaultPrice: 45 },
      { name: 'Пепельное', defaultPrice: 27 },
      { name: 'Йодовое', defaultPrice: 27 },
      {
        name: 'Рифленое',
        defaultPrice: 82.5,
        restrictedShotlans: [
          '1шт по вертикали и 3шт по горизонтали',
          '1шт по вертикали и 4шт по горизонтали',
          '1шт по вертикали и 5шт по горизонтали',
          'Очень много разделений',
        ],
      },
      { name: 'Зеркальное', defaultPrice: 96 },
      { name: 'Гравированное', defaultPrice: 310 },
    ];

    for (let i = 0; i < glassTypes.length; i++) {
      const g = glassTypes[i];
      await tx.glassType.create({
        data: {
          name: g.name,
          defaultPrice: g.defaultPrice,
          sortOrder: i,
          restrictedShotlans: JSON.stringify(g.restrictedShotlans ?? []),
        },
      });
    }

    console.log(`  Created ${glassTypes.length} glass types`);

    // ══════════════════════════════════════════
    // 4. Shotlan Options
    // ══════════════════════════════════════════

    const shotlanOptions: { name: string; calcMethod: string }[] = [
      { name: 'Без шотланок', calcMethod: 'none' },
      { name: '1шт по горизонтали', calcMethod: '1h' },
      { name: '2шт по горизонтали', calcMethod: '2h' },
      { name: '1шт по вертикали', calcMethod: '1v' },
      { name: '1шт по вертикали и 1шт по горизонтали', calcMethod: '1v1h' },
      { name: '1шт по вертикали и 2шт по горизонтали', calcMethod: '1v2h' },
      { name: '1шт по вертикали и 3шт по горизонтали', calcMethod: '1v3h' },
      { name: '1шт по вертикали и 4шт по горизонтали', calcMethod: '1v4h' },
      { name: '1шт по вертикали и 5шт по горизонтали', calcMethod: '1v5h' },
      { name: 'Очень много разделений', calcMethod: 'many' },
    ];

    for (let i = 0; i < shotlanOptions.length; i++) {
      const s = shotlanOptions[i];
      await tx.shotlanOption.create({
        data: {
          name: s.name,
          calcMethod: s.calcMethod,
          sortOrder: i,
        },
      });
    }

    console.log(`  Created ${shotlanOptions.length} shotlan options`);

    // ══════════════════════════════════════════
    // 5. Door Systems & Subsystems
    // ══════════════════════════════════════════

    // ── Cascade ──
    const cascade = await tx.doorSystem.create({
      data: {
        slug: 'cascade',
        name: 'Каскадные двери',
        minWidth: 1615,
        maxWidth: 12000,
        sortOrder: 0,
      },
    });

    const cascadeSubsystems: { name: string; min: number; max: number; params: Record<string, number> }[] = [
      {
        name: '3+0', min: 1615, max: 4500,
        params: {
          num_doors: 3, num_rails: 3, num_side_caps: 2,
          num_bottom_double_caps: 2, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 4, num_rail_to_cap_connectors: 10,
          num_handles: 4, door_brush: 4,
          profile_cap_no_brush: 2, profile_cap_with_brush: 4,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 2, belt_connector_mechanism: 1,
          belt_adapter: 0, bottom_rollers: 1, corner_rubber_joint: 0,
        },
      },
      {
        name: '4+0', min: 2145, max: 6000,
        params: {
          num_doors: 4, num_rails: 4, num_side_caps: 2,
          num_bottom_double_caps: 3, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 6, num_rail_to_cap_connectors: 12,
          num_handles: 4, door_brush: 6,
          profile_cap_no_brush: 2, profile_cap_with_brush: 6,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 2, belt_connector_mechanism: 2,
          belt_adapter: 2, bottom_rollers: 2, corner_rubber_joint: 0,
        },
      },
      {
        name: '5+0', min: 2680, max: 6000,
        params: {
          num_doors: 5, num_rails: 5, num_side_caps: 2,
          num_bottom_double_caps: 4, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 8, num_rail_to_cap_connectors: 14,
          num_handles: 4, door_brush: 8,
          profile_cap_no_brush: 2, profile_cap_with_brush: 8,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 2, belt_connector_mechanism: 3,
          belt_adapter: 3, bottom_rollers: 3, corner_rubber_joint: 0,
        },
      },
      {
        name: '6+0', min: 3147, max: 6000,
        params: {
          num_doors: 6, num_rails: 6, num_side_caps: 2,
          num_bottom_double_caps: 5, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 10, num_rail_to_cap_connectors: 16,
          num_handles: 4, door_brush: 10,
          profile_cap_no_brush: 2, profile_cap_with_brush: 10,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 2, belt_connector_mechanism: 4,
          belt_adapter: 4, bottom_rollers: 4, corner_rubber_joint: 0,
        },
      },
      {
        name: '7+0', min: 3745, max: 6000,
        params: {
          num_doors: 7, num_rails: 7, num_side_caps: 2,
          num_bottom_double_caps: 6, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 12, num_rail_to_cap_connectors: 18,
          num_handles: 4, door_brush: 12,
          profile_cap_no_brush: 2, profile_cap_with_brush: 12,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 2, belt_connector_mechanism: 5,
          belt_adapter: 5, bottom_rollers: 5, corner_rubber_joint: 0,
        },
      },
      {
        name: '8+0', min: 4278, max: 6000,
        params: {
          num_doors: 8, num_rails: 8, num_side_caps: 2,
          num_bottom_double_caps: 7, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 14, num_rail_to_cap_connectors: 20,
          num_handles: 4, door_brush: 14,
          profile_cap_no_brush: 2, profile_cap_with_brush: 14,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 2, belt_connector_mechanism: 6,
          belt_adapter: 6, bottom_rollers: 6, corner_rubber_joint: 0,
        },
      },
      {
        name: '3+0|3+0', min: 3230, max: 9000,
        params: {
          num_doors: 6, num_rails: 3, num_side_caps: 2,
          num_bottom_double_caps: 2, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 4, num_rail_to_cap_connectors: 10,
          num_handles: 8, door_brush: 8,
          profile_cap_no_brush: 2, profile_cap_with_brush: 8,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism_ci: 4, belt_connector_mechanism: 2,
          belt_adapter: 0, bottom_rollers: 2, corner_rubber_joint: 1,
        },
      },
      {
        name: '4+0|4+0', min: 4295, max: 12000,
        params: {
          num_doors: 8, num_rails: 4, num_side_caps: 2,
          num_bottom_double_caps: 3, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 6, num_rail_to_cap_connectors: 12,
          num_handles: 8, door_brush: 12,
          profile_cap_no_brush: 2, profile_cap_with_brush: 12,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism_ci: 4, belt_connector_mechanism: 4,
          belt_adapter: 4, bottom_rollers: 4, corner_rubber_joint: 1,
        },
      },
      {
        name: '5+0|5+0', min: 5360, max: 12000,
        params: {
          num_doors: 10, num_rails: 5, num_side_caps: 2,
          num_bottom_double_caps: 4, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 8, num_rail_to_cap_connectors: 14,
          num_handles: 8, door_brush: 16,
          profile_cap_no_brush: 2, profile_cap_with_brush: 16,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism_ci: 4, belt_connector_mechanism: 6,
          belt_adapter: 6, bottom_rollers: 6, corner_rubber_joint: 1,
        },
      },
      {
        name: '6+0|6+0', min: 6425, max: 12000,
        params: {
          num_doors: 12, num_rails: 6, num_side_caps: 2,
          num_bottom_double_caps: 5, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 10, num_rail_to_cap_connectors: 16,
          num_handles: 8, door_brush: 20,
          profile_cap_no_brush: 2, profile_cap_with_brush: 20,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism_ci: 4, belt_connector_mechanism: 8,
          belt_adapter: 8, bottom_rollers: 8, corner_rubber_joint: 1,
        },
      },
      {
        name: '7+0|7+0', min: 7490, max: 12000,
        params: {
          num_doors: 14, num_rails: 7, num_side_caps: 2,
          num_bottom_double_caps: 6, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 12, num_rail_to_cap_connectors: 18,
          num_handles: 8, door_brush: 24,
          profile_cap_no_brush: 2, profile_cap_with_brush: 24,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism_ci: 4, belt_connector_mechanism: 10,
          belt_adapter: 10, bottom_rollers: 10, corner_rubber_joint: 1,
        },
      },
      {
        name: '8+0|8+0', min: 8555, max: 12000,
        params: {
          num_doors: 16, num_rails: 8, num_side_caps: 2,
          num_bottom_double_caps: 7, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 14, num_rail_to_cap_connectors: 20,
          num_handles: 8, door_brush: 28,
          profile_cap_no_brush: 2, profile_cap_with_brush: 28,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism_ci: 4, belt_connector_mechanism: 12,
          belt_adapter: 12, bottom_rollers: 12, corner_rubber_joint: 1,
        },
      },
    ];

    for (let i = 0; i < cascadeSubsystems.length; i++) {
      const s = cascadeSubsystems[i];
      await tx.subsystem.create({
        data: {
          systemId: cascade.id,
          name: s.name,
          minWidth: s.min,
          maxWidth: s.max,
          sortOrder: i,
          params: s.params,
        },
      });
    }

    console.log(`  Created cascade system with ${cascadeSubsystems.length} subsystems`);

    // ── Sync ──
    const sync = await tx.doorSystem.create({
      data: {
        slug: 'sync',
        name: 'Синхронные двери',
        minWidth: 2200,
        maxWidth: 9000,
        sortOrder: 1,
      },
    });

    const syncSubsystems: { name: string; min: number; max: number; params: Record<string, number> }[] = [
      {
        name: '(1)+1S+1S+(1)', min: 2200, max: 6000,
        params: {
          num_doors: 4, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 4, door_brush: 4,
          profile_cap_no_brush: 2, profile_cap_with_brush: 4,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism: 1, fixed_mechanism: 2,
          fixed_door_profile: 2, moving_mechanism_tros: 1,
        },
      },
      {
        name: '1+1S+1S+1', min: 2200, max: 7500,
        params: {
          num_doors: 4, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 4, door_brush: 4,
          profile_cap_no_brush: 2, profile_cap_with_brush: 4,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism: 3, fixed_mechanism: 0,
          fixed_door_profile: 0, moving_mechanism_tros: 1,
        },
      },
      {
        name: '(1)+(1)+1S+1S+(1)+(1)', min: 3350, max: 9000,
        params: {
          num_doors: 6, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 4, door_brush: 4,
          profile_cap_no_brush: 6, profile_cap_with_brush: 4,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism: 1, fixed_mechanism: 4,
          fixed_door_profile: 4, moving_mechanism_tros: 1,
        },
      },
    ];

    for (let i = 0; i < syncSubsystems.length; i++) {
      const s = syncSubsystems[i];
      await tx.subsystem.create({
        data: {
          systemId: sync.id,
          name: s.name,
          minWidth: s.min,
          maxWidth: s.max,
          sortOrder: i,
          params: s.params,
        },
      });
    }

    console.log(`  Created sync system with ${syncSubsystems.length} subsystems`);

    // ── Unlinked ──
    const unlinked = await tx.doorSystem.create({
      data: {
        slug: 'unlinked',
        name: 'Не связанные двери',
        minWidth: 500,
        maxWidth: 6000,
        sortOrder: 2,
      },
    });

    const unlinkedSubsystems: { name: string; min: number; max: number; params: Record<string, number> }[] = [
      {
        name: '(1)', min: 500, max: 2400,
        params: {
          num_doors: 1, num_rails: 1, num_side_caps: 2,
          num_bottom_double_caps: 0, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 0, num_rail_to_cap_connectors: 6,
          num_moving_mechanisms: 0, num_fixed_mechanisms: 1,
          num_handles: 0, door_brush: 0,
          profile_cap_no_brush: 2, profile_cap_with_brush: 0,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism: 0, fixed_mechanism: 1,
          fixed_door_profile: 1, door_brush_joint: 0,
        },
      },
      {
        name: '1', min: 500, max: 2400,
        params: {
          num_doors: 1, num_rails: 1, num_side_caps: 2,
          num_bottom_double_caps: 0, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 0, num_rail_to_cap_connectors: 6,
          num_moving_mechanisms: 1, num_fixed_mechanisms: 0,
          num_handles: 2, door_brush: 0,
          profile_cap_no_brush: 2, profile_cap_with_brush: 0,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism: 1, fixed_mechanism: 0,
          fixed_door_profile: 0, door_brush_joint: 0,
        },
      },
      {
        name: '(1)+1', min: 1000, max: 2400,
        params: {
          num_doors: 2, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_moving_mechanisms: 1, num_fixed_mechanisms: 1,
          num_handles: 0, door_brush: 2,
          profile_cap_no_brush: 2, profile_cap_with_brush: 2,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism: 1, fixed_mechanism: 1,
          fixed_door_profile: 1, door_brush_joint: 0,
        },
      },
      {
        name: '1+1', min: 1000, max: 2400,
        params: {
          num_doors: 2, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_moving_mechanisms: 2, num_fixed_mechanisms: 0,
          num_handles: 4, door_brush: 2,
          profile_cap_no_brush: 2, profile_cap_with_brush: 2,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism: 2, fixed_mechanism: 0,
          fixed_door_profile: 0, door_brush_joint: 0,
        },
      },
      {
        name: '(1)+1+(1)', min: 1500, max: 3600,
        params: {
          num_doors: 3, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_moving_mechanisms: 1, num_fixed_mechanisms: 2,
          num_handles: 2, door_brush: 4,
          profile_cap_no_brush: 2, profile_cap_with_brush: 4,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism: 1, fixed_mechanism: 2,
          fixed_door_profile: 2, door_brush_joint: 0,
        },
      },
      {
        name: '1+1+1', min: 1500, max: 3600,
        params: {
          num_doors: 3, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_moving_mechanisms: 3, num_fixed_mechanisms: 0,
          num_handles: 6, door_brush: 4,
          profile_cap_no_brush: 2, profile_cap_with_brush: 4,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism: 3, fixed_mechanism: 0,
          fixed_door_profile: 0, door_brush_joint: 0,
        },
      },
      {
        name: '(1)+1+1+(1)', min: 2000, max: 6000,
        params: {
          num_doors: 4, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_moving_mechanisms: 2, num_fixed_mechanisms: 2,
          num_handles: 4, door_brush: 4,
          profile_cap_no_brush: 2, profile_cap_with_brush: 4,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism: 2, fixed_mechanism: 2,
          fixed_door_profile: 2, door_brush_joint: 1,
        },
      },
      {
        name: '1+1+1+1', min: 2000, max: 6000,
        params: {
          num_doors: 4, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_moving_mechanisms: 4, num_fixed_mechanisms: 0,
          num_handles: 4, door_brush: 4,
          profile_cap_no_brush: 2, profile_cap_with_brush: 4,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism: 4, fixed_mechanism: 0,
          fixed_door_profile: 0, door_brush_joint: 1,
        },
      },
    ];

    for (let i = 0; i < unlinkedSubsystems.length; i++) {
      const s = unlinkedSubsystems[i];
      await tx.subsystem.create({
        data: {
          systemId: unlinked.id,
          name: s.name,
          minWidth: s.min,
          maxWidth: s.max,
          sortOrder: i,
          params: s.params,
        },
      });
    }

    console.log(`  Created unlinked system with ${unlinkedSubsystems.length} subsystems`);

    // ── Embedded-wall ──
    const embeddedWall = await tx.doorSystem.create({
      data: {
        slug: 'embedded-wall',
        name: 'Врезанные в стену двери',
        minWidth: 550,
        maxWidth: 6000,
        hasExtraField: true,
        sortOrder: 3,
      },
    });

    const embeddedWallSubsystems: { name: string; min: number; max: number; params: Record<string, number> }[] = [
      {
        name: '2+0', min: 1068, max: 3000,
        params: {
          num_doors: 2, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 2, door_brush: 2,
          profile_cap_no_brush: 2, profile_cap_with_brush: 2,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 1, belt_connector_mechanism: 1,
          belt_adapter: 0, bottom_rollers: 1,
          gap_rubber: 0, capWithBrush: 2, push_mechanism: 0,
          gap_base_profile: 0, gap_basic_cap_profile: 0,
          gap_deco_cap_profile: 0, inner_support_profile: 0,
          corner_rubber_joint: 0,
        },
      },
      {
        name: '2+0|2+0', min: 2115, max: 6000,
        params: {
          num_doors: 4, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 2, door_brush: 2,
          profile_cap_no_brush: 2, profile_cap_with_brush: 4,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism_ci: 2, belt_connector_mechanism: 2,
          belt_adapter: 2, bottom_rollers: 2,
          gap_rubber: 1, capWithBrush: 4, push_mechanism: 0,
          gap_base_profile: 0, gap_basic_cap_profile: 0,
          gap_deco_cap_profile: 0, inner_support_profile: 0,
          corner_rubber_joint: 1,
        },
      },
      {
        name: '1WPUSH', min: 550, max: 1500,
        params: {
          num_doors: 1, num_rails: 1, num_side_caps: 2,
          num_bottom_double_caps: 0, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 6,
          num_handles: 2, door_brush: 2,
          profile_cap_no_brush: 3, profile_cap_with_brush: 0,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 1, belt_connector_mechanism: 0,
          belt_adapter: 3, bottom_rollers: 0,
          gap_rubber: 0, capWithBrush: 0, push_mechanism: 1,
          gap_base_profile: 2, gap_basic_cap_profile: 2,
          gap_deco_cap_profile: 2, inner_support_profile: 1,
        },
      },
      {
        name: '2WPUSH', min: 1084, max: 3000,
        params: {
          num_doors: 2, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 2, door_brush: 4,
          profile_cap_no_brush: 2, profile_cap_with_brush: 2,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism_ci: 1, belt_connector_mechanism: 1,
          belt_adapter: 4, bottom_rollers: 1,
          gap_rubber: 0, capWithBrush: 2, push_mechanism: 1,
          gap_base_profile: 2, gap_basic_cap_profile: 2,
          gap_deco_cap_profile: 2, inner_support_profile: 1,
        },
      },
    ];

    for (let i = 0; i < embeddedWallSubsystems.length; i++) {
      const s = embeddedWallSubsystems[i];
      await tx.subsystem.create({
        data: {
          systemId: embeddedWall.id,
          name: s.name,
          minWidth: s.min,
          maxWidth: s.max,
          sortOrder: i,
          params: s.params,
        },
      });
    }

    console.log(`  Created embedded-wall system with ${embeddedWallSubsystems.length} subsystems`);

    // ── Partition ──
    const partition = await tx.doorSystem.create({
      data: {
        slug: 'partition',
        name: 'Стена-перегородка',
        minWidth: 2400,
        maxWidth: 9000,
        sortOrder: 4,
      },
    });

    const partitionSubsystems: { name: string; min: number; max: number; params: Record<string, number> }[] = [
      {
        name: '(1)+(1)+(1)+1', min: 2400, max: 6000,
        params: {
          num_doors: 4, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 2, door_brush: 2,
          profile_cap_no_brush: 6, profile_cap_with_brush: 2,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism: 1, fixed_mechanism: 3,
          fixed_door_profile: 3, door_width_offset: 16,
        },
      },
      {
        name: '(1)+(1)+(1)+(1)+1', min: 3000, max: 7500,
        params: {
          num_doors: 5, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 2, door_brush: 2,
          profile_cap_no_brush: 8, profile_cap_with_brush: 2,
          profile_C_cap: 0, profile_V_cap: 0,
          moving_mechanism: 1, fixed_mechanism: 4,
          fixed_door_profile: 4, door_width_offset: 16,
        },
      },
      {
        name: '(1)+(1)+1+1+(1)+(1)', min: 3600, max: 9000,
        params: {
          num_doors: 6, num_rails: 2, num_side_caps: 2,
          num_bottom_double_caps: 1, num_bottom_single_caps: 2,
          num_rail_to_rail_connectors: 2, num_rail_to_cap_connectors: 8,
          num_handles: 4, door_brush: 4,
          profile_cap_no_brush: 6, profile_cap_with_brush: 4,
          profile_C_cap: 1, profile_V_cap: 1,
          moving_mechanism: 2, fixed_mechanism: 4,
          fixed_door_profile: 4, door_width_offset: 17,
        },
      },
    ];

    for (let i = 0; i < partitionSubsystems.length; i++) {
      const s = partitionSubsystems[i];
      await tx.subsystem.create({
        data: {
          systemId: partition.id,
          name: s.name,
          minWidth: s.min,
          maxWidth: s.max,
          sortOrder: i,
          params: s.params,
        },
      });
    }

    console.log(`  Created partition system with ${partitionSubsystems.length} subsystems`);

    // ── Wall-mounted ──
    const wallMounted = await tx.doorSystem.create({
      data: {
        slug: 'wall-mounted',
        name: 'Настенные двери',
        minWidth: 500,
        maxWidth: 3000,
        maxFullWidth: 6000,
        hasExtraField: true,
        sortOrder: 5,
      },
    });

    const wallMountedSubsystems: { name: string; min: number; max: number; params: Record<string, number> }[] = [
      {
        name: 'Система 1W', min: 500, max: 1500,
        params: {
          num_doors: 1,
          num_rails_41: 1, num_rails_47: 0,
          num_side_caps_45: 2, num_side_caps_51: 0,
          num_bottom_single_caps: 2, num_bottom_double_caps: 0,
          num_rrconn: 0, num_rcconn: 6,
          num_handles: 2,
          profile_cap_no_brush: 2,
          profile_C_cap: 0, profile_V_cap: 0,
          n_ci: 1, n_ct: 0,
          corner_rubber_joint: 0,
          door_brush: 0, fixed_door_profile: 0,
          door_width_offset: 16,
        },
      },
      {
        name: 'Система 1W+1W', min: 1000, max: 3000,
        params: {
          num_doors: 2,
          num_rails_41: 1, num_rails_47: 0,
          num_side_caps_45: 2, num_side_caps_51: 0,
          num_bottom_single_caps: 2, num_bottom_double_caps: 0,
          num_rrconn: 0, num_rcconn: 6,
          num_handles: 4,
          profile_cap_no_brush: 2,
          profile_C_cap: 1, profile_V_cap: 1,
          n_ci: 2, n_ct: 0,
          corner_rubber_joint: 1,
          door_brush: 0, fixed_door_profile: 0,
          door_width_offset: 32,
        },
      },
      {
        name: 'Система 1SW+1SW', min: 1000, max: 3000,
        params: {
          num_doors: 2,
          num_rails_41: 0, num_rails_47: 1,
          num_side_caps_45: 0, num_side_caps_51: 2,
          num_bottom_single_caps: 2, num_bottom_double_caps: 0,
          num_rrconn: 0, num_rcconn: 6,
          num_handles: 4,
          profile_cap_no_brush: 2,
          profile_C_cap: 1, profile_V_cap: 1,
          n_ci: 1, n_ct: 1,
          corner_rubber_joint: 1,
          door_brush: 0, fixed_door_profile: 1,
          door_width_offset: 17,
        },
      },
    ];

    for (let i = 0; i < wallMountedSubsystems.length; i++) {
      const s = wallMountedSubsystems[i];
      await tx.subsystem.create({
        data: {
          systemId: wallMounted.id,
          name: s.name,
          minWidth: s.min,
          maxWidth: s.max,
          sortOrder: i,
          params: s.params,
        },
      });
    }

    console.log(`  Created wall-mounted system with ${wallMountedSubsystems.length} subsystems`);

    // ── Angle ──
    const angle = await tx.doorSystem.create({
      data: {
        slug: 'angle',
        name: 'Двери с угловым примыканием',
        minWidth: 1615,
        maxWidth: 6000,
        sortOrder: 6,
      },
    });

    const angleSubsystems: { name: string; min: number; max: number; params: Record<string, number> }[] = [
      {
        name: '(1)+1C+1C+(1)', min: 1615, max: 4500,
        params: {
          doors: 4, rails: 2, side_rail_caps_45: 2,
          bottom_double_caps: 1, bottom_single_caps: 2,
          rail_to_rail_connectors: 2, rail_to_cap_connectors: 10,
          handles: 4, door_brush_joint: 4,
          cap_no_brush: 2, cap_with_brush: 4, corner_cap: 2,
          moving_mechanism_dovodchik: 1, moving_mechanism_belt_connector: 1,
          adapter_belt: 0, bottom_rollers: 1, corner_rubber_joint: 0,
          fixed_door_profile: 2, fixed_mechanism: 2, width_adjustment: 32,
        },
      },
      {
        name: '1+2C+2C+1', min: 2145, max: 6000,
        params: {
          doors: 6, rails: 3, side_rail_caps_45: 2,
          bottom_double_caps: 2, bottom_single_caps: 2,
          rail_to_rail_connectors: 4, rail_to_cap_connectors: 12,
          handles: 4, door_brush_joint: 8,
          cap_no_brush: 2, cap_with_brush: 8, corner_cap: 2,
          moving_mechanism_dovodchik: 1, moving_mechanism_belt_connector: 1,
          adapter_belt: 2, bottom_rollers: 2, corner_rubber_joint: 0,
          fixed_door_profile: 2, fixed_mechanism: 2, width_adjustment: 70,
        },
      },
    ];

    for (let i = 0; i < angleSubsystems.length; i++) {
      const s = angleSubsystems[i];
      await tx.subsystem.create({
        data: {
          systemId: angle.id,
          name: s.name,
          minWidth: s.min,
          maxWidth: s.max,
          sortOrder: i,
          params: s.params,
        },
      });
    }

    console.log(`  Created angle system with ${angleSubsystems.length} subsystems`);

    // ══════════════════════════════════════════
    // 6. Additional Services
    // ══════════════════════════════════════════

    const additionalServices: { name: string; defaultPrice: number; priceUnit: string }[] = [
      { name: 'Демонтаж старой двери', defaultPrice: 50, priceUnit: 'fixed' },
      { name: 'Доставка', defaultPrice: 30, priceUnit: 'fixed' },
      { name: 'Армирование проёма', defaultPrice: 80, priceUnit: 'per_sqm' },
      { name: 'Подъём на этаж', defaultPrice: 10, priceUnit: 'fixed' },
      { name: 'Уборка после монтажа', defaultPrice: 25, priceUnit: 'fixed' },
    ];

    for (let i = 0; i < additionalServices.length; i++) {
      const s = additionalServices[i];
      await tx.additionalService.create({
        data: {
          name: s.name,
          defaultPrice: s.defaultPrice,
          priceUnit: s.priceUnit,
          showInPdf: true,
          sortOrder: i,
        },
      });
    }

    console.log(`  Created ${additionalServices.length} additional services`);
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
