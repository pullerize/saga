// Exact port from saga_calc/assets/scripts/calc-functions.js
// All formulas preserved 1:1

import { getPrices, componentNames, type Prices } from './constants';
import type { SubsystemParams } from './systemsData';

export interface CalcComponent {
  key: string;
  name: string;
  qty: number;
  price: number;
  sum: number;
  unit: string;
  group?: string;
}

export interface CalcResult {
  components: CalcComponent[];
  total: number;
  doorWidth: number;
}

// ─── Helper ────────────────────────────────────────────

function getPrice(prices: Prices, key: string): number {
  const v = prices[key];
  return typeof v === 'number' ? v : 0;
}

function addComponent(
  components: CalcComponent[],
  prices: Prices,
  key: string,
  qty: number
) {
  if (qty > 0) {
    const price = getPrice(prices, key);
    const sum = Math.round(qty * price * 100) / 100;
    components.push({
      key,
      name: componentNames[key] || key,
      qty,
      price,
      sum,
      unit: 'шт',
    });
  }
}

function addGlassInstLogistics(
  components: CalcComponent[],
  prices: Prices,
  area: number,
  glass: string
) {
  const gp = (prices.glass && prices.glass[glass]) || 0;
  components.push({
    key: 'glass',
    name: componentNames.glass || 'Стекло',
    qty: area,
    price: gp,
    sum: Math.round(area * gp * 100) / 100,
    unit: 'м²',
  });
  components.push({
    key: 'installation',
    name: componentNames.installation || 'Сборка/установка',
    qty: area,
    price: getPrice(prices, 'installation'),
    sum: Math.round(area * getPrice(prices, 'installation') * 100) / 100,
    unit: 'м²',
  });
  components.push({
    key: 'logistics',
    name: componentNames.logistics || 'Доп расходы',
    qty: 1,
    price: getPrice(prices, 'logistics'),
    sum: getPrice(prices, 'logistics'),
    unit: '',
  });
}

function addShotlan(
  components: CalcComponent[],
  prices: Prices,
  shotlan: string,
  doorWidth: number,
  height: number,
  numDoors: number
) {
  const add = (key: string, qty: number) => addComponent(components, prices, key, qty);

  switch (shotlan) {
    case '1шт по горизонтали': {
      const d = ((doorWidth - 32) <= 995 ? 1 : 2) * numDoors;
      add('divider_profile', d);
      add('additional_glass_seal', Math.ceil(d * 2 * 1000 / 2500));
      add('bolts_extra', numDoors * 8);
      break;
    }
    case '1шт по вертикали': {
      const d = (height <= 3000 ? 3 : 4) * numDoors;
      add('divider_profile', d);
      add('additional_glass_seal', Math.ceil(d * 2 * 1000 / 2500));
      add('bolts_extra', numDoors * 8);
      break;
    }
    case '2шт по горизонтали': {
      const d = ((doorWidth - 32) <= 995 ? 1 : 2) * numDoors * 2;
      add('divider_profile', d);
      add('additional_glass_seal', Math.ceil(d * 2 * 1000 / 2500));
      add('bolts_extra', numDoors * 16);
      break;
    }
    case '1шт по вертикали и 1шт по горизонтали': {
      const v = (height <= 3200 ? 3 : 4) * numDoors;
      const h = ((doorWidth - 32) <= 995 ? 1 : 2) * numDoors;
      const d = v + h;
      add('divider_profile', d);
      add('additional_glass_seal', Math.ceil(d * 2 * 1000 / 2500));
      add('bolts_extra', numDoors * 16);
      break;
    }
    case '1шт по вертикали и 2шт по горизонтали': {
      const v = (height <= 3200 ? 3 : 4) * numDoors;
      const h = ((doorWidth - 32) <= 995 ? 1 : 2) * 2 * numDoors;
      const d = v + h;
      add('divider_profile', d);
      add('additional_glass_seal', Math.ceil(d * 2 * 1000 / 2500));
      add('bolts_extra', numDoors * 24);
      break;
    }
    case '1шт по вертикали и 3шт по горизонтали': {
      let adh = ((doorWidth - 32) <= 995 ? 1 : ((doorWidth - 32) <= 1995 ? 2 : 3)) * 3 + (height <= 3000 ? 3 : 4);
      adh = adh * 2 * numDoors;
      add('adhesive_profile', adh);
      add('tape_33m', Math.ceil(adh / 33));
      break;
    }
    case '1шт по вертикали и 4шт по горизонтали': {
      let adh = ((doorWidth - 32) <= 995 ? 1 : ((doorWidth - 32) <= 1995 ? 2 : 3)) * 4 + (height <= 3000 ? 3 : 4);
      adh = adh * 2 * numDoors;
      add('adhesive_profile', adh);
      add('tape_33m', Math.ceil(adh / 33));
      break;
    }
    case '1шт по вертикали и 5шт по горизонтали': {
      let adh = ((doorWidth - 32) <= 995 ? 1 : ((doorWidth - 32) <= 1995 ? 2 : 3)) * 5 + (height <= 3000 ? 3 : 4);
      adh = adh * 2 * numDoors;
      add('adhesive_profile', adh);
      add('tape_33m', Math.ceil(adh / 33));
      break;
    }
    case 'Очень много разделений': {
      const hBase = (doorWidth - 32) <= 995 ? 1 : ((doorWidth - 32) <= 1995 ? 2 : 3);
      const heightUnits = Math.ceil(height / 40);
      const adh = hBase * heightUnits * 2;
      add('adhesive_profile', adh);
      add('tape_33m', Math.ceil(adh / 33));
      break;
    }
  }
}

// ─── calcDoorWidth ─────────────────────────────────────

export function calcDoorWidth(width: number, subsystem: string | null, params: SubsystemParams): number {
  if (!subsystem) {
    const base = width / Math.max(1, params.num_doors || 1);
    const dw = Math.floor(base);
    return base - dw > 0.4 ? dw + 1 : dw;
  }
  let raw: number;
  switch (subsystem) {
    case '3+0': raw = (width + 35) / params.num_doors; break;
    case '4+0': raw = (width + 52) / params.num_doors; break;
    case '5+0': raw = (width + 70) / params.num_doors; break;
    case '6+0': raw = (width + 87) / params.num_doors; break;
    case '7+0': raw = (width + 105) / params.num_doors; break;
    case '8+0': raw = (width + 122) / params.num_doors; break;
    case '3+0|3+0': raw = (width + 70 - 15) / params.num_doors; break;
    case '4+0|4+0': raw = (width + 105 - 15) / params.num_doors; break;
    case '5+0|5+0': raw = (width + 140 - 15) / params.num_doors; break;
    case '6+0|6+0': raw = (width + 175 - 15) / params.num_doors; break;
    case '7+0|7+0': raw = (width + 210 - 15) / params.num_doors; break;
    case '8+0|8+0': raw = (width + 245 - 15) / params.num_doors; break;
    default: {
      const clear = subsystem.replace(/[()+\s]/g, '');
      switch (clear) {
        case '1': raw = width / Math.max(1, params.num_doors); break;
        case '11': raw = (width + 16) / Math.max(1, params.num_doors); break;
        case '111': raw = (width + 32) / Math.max(1, params.num_doors); break;
        case '1111': raw = (width + 32 - 15) / Math.max(1, params.num_doors); break;
        default: raw = width / Math.max(1, params.num_doors);
      }
    }
  }
  let dw = Math.floor(raw);
  if (raw - dw > 0.4) dw += 1;
  return dw;
}

// ─── calculateComponents (cascade, unlinked) ──────────

export function calculateComponents(
  width: number, height: number, subsystem: string,
  params: SubsystemParams, glass: string, shotlan: string
): CalcResult {
  const prices = getPrices();
  const doorWidth = calcDoorWidth(width, subsystem, params);
  const components: CalcComponent[] = [];
  const add = (key: string, qty: number) => addComponent(components, prices, key, qty);

  add('vertical_profile', (height <= 3200 ? 1 : 2) * params.num_doors);
  add('cap_no_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_no_brush || 0));
  add('cap_with_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_with_brush || 0));
  add('profile_C_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_C_cap || 0));
  add('profile_V_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_V_cap || 0));
  add('horizontal_profile', (doorWidth <= 1000 ? 1 : 2) * params.num_doors);
  add('glass_seal', Math.ceil(((doorWidth + height) * 2 / 2500) * params.num_doors));
  add('bolts', params.num_doors * 8);
  add('handles', params.num_handles || 0);
  add('top_rail_rubber', Math.ceil((width * params.num_rails * 2) / 1000));
  add('door_brush_joint', Math.ceil((params.door_brush || 0) * height / 1000));
  const railMult = width <= 3000 ? 0.5 : (width <= 6000 ? 1 : (width <= 9000 ? 1.5 : 2));
  const capMult = width <= 3000 ? 1 : (width <= 6000 ? 2 : (width <= 9000 ? 3 : 4));
  add('top_rails_41', railMult * params.num_rails);
  add('side_rail_caps_45', railMult * params.num_side_caps);
  add('bottom_double_caps', capMult * params.num_bottom_double_caps);
  add('bottom_single_caps', capMult * params.num_bottom_single_caps);
  add('rail_to_rail_connectors', Math.ceil(width / 300 * (params.num_rail_to_rail_connectors || 0)));
  add('rail_to_cap_connectors', Math.ceil(width / 300 * (params.num_rail_to_cap_connectors || 0)));
  add('metal_rail_aligner', Math.ceil(width / 500 * params.num_rails));
  add('plastic_rail_aligner', Math.ceil(width / 500 * params.num_rails * 2));
  add('moving_mechanism_ci', params.moving_mechanism_ci || 0);
  add('belt_connector_mechanism', params.belt_connector_mechanism || 0);
  add('belt_adapter', (doorWidth - 12 <= 970 ? 1 : 2) * (params.belt_adapter || 0));
  add('bottom_rollers', params.bottom_rollers || 0);
  add('corner_rubber_joint', Math.ceil(height * 2 / 1000 * (params.corner_rubber_joint || 0)));
  add('moving_mechanism', params.moving_mechanism || 0);
  add('fixed_mechanism', params.fixed_mechanism || 0);
  add('fixed_door_profile', (doorWidth - 12 <= 970 ? 1 : 2) * (params.fixed_door_profile || 0));

  const area = width * height / 1000000;
  addGlassInstLogistics(components, prices, area, glass);
  addShotlan(components, prices, shotlan, doorWidth, height, params.num_doors);

  let total = 0;
  components.forEach(c => { total += c.sum; });
  return { components, total, doorWidth };
}

// ─── calculatePartitionComponents ─────────────────────

export function calculatePartitionComponents(
  widthFull: number, height: number, subsystem: string,
  params: SubsystemParams, glass: string, shotlan: string
): CalcResult {
  const prices = getPrices();
  const numDoors = params.num_doors || 1;
  const offset = params.door_width_offset || 0;

  const raw = (widthFull + offset) / Math.max(1, numDoors);
  let doorWidth = Math.floor(raw);
  if (raw - doorWidth > 0.4) doorWidth += 1;

  const components: CalcComponent[] = [];
  const add = (key: string, qty: number) => addComponent(components, prices, key, qty);

  add('vertical_profile', (height <= 3200 ? 1 : 2) * numDoors);
  add('cap_no_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_no_brush || 0));
  add('cap_with_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_with_brush || 0));
  add('profile_C_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_C_cap || 0));
  add('profile_V_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_V_cap || 0));
  add('horizontal_profile', (doorWidth <= 1000 ? 1 : 2) * numDoors);
  add('glass_seal', Math.ceil(((doorWidth + height) * 2 / 2500) * numDoors));
  add('bolts', numDoors * 8);
  add('handles', params.num_handles || 0);
  add('top_rail_rubber', Math.ceil((widthFull * (params.num_rails || 0) * 2) / 1000));
  add('door_brush_joint', Math.ceil((params.door_brush || 0) * height / 1000));
  const railMult = widthFull <= 3000 ? 0.5 : (widthFull <= 6000 ? 1 : (widthFull <= 9000 ? 1.5 : 2));
  const capMult = widthFull <= 3000 ? 1 : (widthFull <= 6000 ? 2 : (widthFull <= 9000 ? 3 : 4));
  add('top_rails', railMult * (params.num_rails || 0));
  add('side_rail_caps_45', railMult * (params.num_side_caps || 0));
  add('bottom_double_caps', capMult * (params.num_bottom_double_caps || 0));
  add('bottom_single_caps', capMult * (params.num_bottom_single_caps || 0));
  add('rail_to_rail_connectors', Math.ceil(widthFull / 300 * (params.num_rail_to_rail_connectors || 0)));
  add('rail_to_cap_connectors', Math.ceil(widthFull / 300 * (params.num_rail_to_cap_connectors || 0)));
  add('metal_rail_aligner', Math.ceil(widthFull / 500 * (params.num_rails || 0)));
  add('plastic_rail_aligner', Math.ceil(widthFull / 500 * (params.num_rails || 0) * 2));
  add('moving_mechanism', params.moving_mechanism || 0);
  add('fixed_mechanism', params.fixed_mechanism || 0);
  add('fixed_door_profile', (doorWidth - 12 <= 970 ? 1 : 2) * (params.fixed_door_profile || 0));
  add('corner_rubber_joint', Math.ceil(height * 2 / 1000));

  const area = widthFull * height / 1000000;
  addGlassInstLogistics(components, prices, area, glass);
  addShotlan(components, prices, shotlan, doorWidth, height, numDoors);

  let total = 0;
  components.forEach(c => { total += c.sum; });
  return { components, total, doorWidth };
}

// ─── calculateWallMountedComponents ───────────────────

export function calculateWallMountedComponents(
  widthFull: number, openWidth: number, height: number, subsystem: string,
  params: SubsystemParams, glass: string, shotlan: string
): CalcResult {
  const prices = getPrices();
  const numDoors = params.num_doors || 1;
  let raw: number;
  switch (subsystem) {
    case 'Система 1W': raw = (openWidth + 16) / numDoors; break;
    case 'Система 1W+1W': raw = (openWidth + 32) / numDoors; break;
    case 'Система 1SW+1SW': raw = (openWidth + 32 - 15) / numDoors; break;
    default: raw = openWidth / numDoors;
  }
  let doorWidth = Math.floor(raw);
  if (raw - doorWidth > 0.4) doorWidth += 1;

  const components: CalcComponent[] = [];
  const add = (key: string, qty: number) => addComponent(components, prices, key, qty);

  add('vertical_profile', (height <= 3200 ? 1 : 2) * numDoors);
  add('cap_no_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_no_brush || 0));
  add('cap_with_brush', (height <= 3200 ? 0.5 : 1) * (params.cap_with_brush || 0));
  add('profile_C_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_C_cap || 0));
  add('profile_V_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_V_cap || 0));
  add('horizontal_profile', (doorWidth <= 1000 ? 1 : 2) * numDoors);
  add('glass_seal', Math.ceil(((doorWidth + height) * 2 / 2500) * numDoors));
  add('bolts', numDoors * 8);
  add('handles', params.num_handles || 0);
  add('top_rail_rubber', Math.ceil((widthFull * (params.num_rails_41 || 0) * 2) / 1000));
  add('door_brush_joint', Math.ceil((params.door_brush || 0) * height / 1000));
  const railMult = widthFull <= 3000 ? 0.5 : 1;
  const capMult = widthFull <= 3000 ? 1 : 2;
  add('top_rails_41', railMult * (params.num_rails_41 || 0));
  add('top_rails_47', railMult * (params.num_rails_47 || 0));
  add('side_rail_caps_45', railMult * (params.num_side_caps_45 || 0));
  add('side_rail_caps_51', railMult * (params.num_side_caps_51 || 0));
  add('bottom_single_caps', capMult * (params.num_bottom_single_caps || 0));
  add('bottom_double_caps', capMult * (params.num_bottom_double_caps || 0));
  const numRCConn = params.num_rcconn ?? params.num_rail_to_cap_connectors ?? 0;
  const numRRConn = params.num_rrconn ?? params.num_rail_to_rail_connectors ?? 0;
  add('rail_to_cap_connectors', Math.ceil(widthFull / 300 * numRCConn));
  add('rail_to_rail_connectors', numRRConn);
  add('metal_rail_aligner', Math.ceil(widthFull / 500 * (params.num_rails_41 || 0)));
  add('plastic_rail_aligner', Math.ceil(widthFull / 500 * (params.num_rails_41 || 0) * 2));
  add('wall_connector', Math.ceil(widthFull / 400));
  const nci = params.n_ci ?? params.moving_mechanism_ci ?? 0;
  const nct = params.n_ct ?? params.moving_mechanism_ct ?? 0;
  add('moving_mechanism_ci', nci);
  add('moving_mechanism_ct', nct);
  add('belt_adapter', (doorWidth - 12 <= 970 ? 1 : 2) * (params.belt_adapter || 0));
  add('bottom_rollers', params.bottom_rollers || 0);
  add('corner_rubber_joint', Math.ceil((params.corner_rubber_joint || 0) * 2 * height / 1000));
  add('fixed_door_profile', (doorWidth - 12 <= 970 ? 1 : 2) * (params.fixed_door_profile || 0));

  const area = openWidth * height / 1000000;
  addGlassInstLogistics(components, prices, area, glass);
  addShotlan(components, prices, shotlan, doorWidth, height, numDoors);

  let total = 0;
  components.forEach(c => { total += c.sum; });
  return { components, total, doorWidth };
}

// ─── calculateAngleComponents ─────────────────────────

export function calculateAngleComponents(
  widthFull: number, height: number, subsystem: string,
  params: SubsystemParams, glass: string, shotlan: string
): CalcResult {
  const prices = getPrices();
  const numDoors = params.doors || 1;
  const widthAdj = params.width_adjustment || 0;

  const raw = (widthFull + widthAdj - 15) / Math.max(1, numDoors);
  let doorWidth = Math.floor(raw);
  if (raw - doorWidth > 0.4) doorWidth += 1;

  const components: CalcComponent[] = [];
  const add = (key: string, qty: number) => addComponent(components, prices, key, qty);

  add('vertical_profile', (height <= 3200 ? 1 : 2) * numDoors);
  add('cap_no_brush', (height <= 3200 ? 0.5 : 1) * (params.cap_no_brush || 0));
  add('cap_with_brush', (height <= 3200 ? 0.5 : 1) * (params.cap_with_brush || 0));
  add('corner_cap', (height <= 3200 ? 0.5 : 1) * (params.corner_cap || 0));
  add('horizontal_profile', (doorWidth <= 1000 ? 1 : 2) * numDoors);
  add('glass_seal', Math.ceil(((doorWidth + height) * 2 / 2500) * numDoors));
  add('bolts', numDoors * 8);
  add('handles', params.handles || 0);
  add('top_rail_rubber', Math.ceil((widthFull * (params.rails || 0) * 2) / 1000));
  add('door_brush_joint', Math.ceil((params.door_brush_joint || 0) * height / 1000));
  const railMult = widthFull <= 3000 ? 0.5 : (widthFull <= 6000 ? 1 : (widthFull <= 9000 ? 1.5 : 2));
  const capMult = widthFull <= 3000 ? 1 : (widthFull <= 6000 ? 2 : (widthFull <= 9000 ? 3 : 4));
  add('top_rails', railMult * (params.rails || 0));
  add('side_rail_caps_45', railMult * (params.side_rail_caps_45 || 0));
  add('bottom_double_caps', capMult * (params.bottom_double_caps || 0));
  add('bottom_single_caps', capMult * (params.bottom_single_caps || 0));
  add('rail_to_rail_connectors', Math.ceil(widthFull / 300 * (params.rail_to_rail_connectors || 0)));
  add('rail_to_cap_connectors', Math.ceil(widthFull / 300 * (params.rail_to_cap_connectors || 0)));
  add('metal_rail_aligner', Math.ceil(widthFull / 500 * (params.rails || 0)));
  add('plastic_rail_aligner', Math.ceil(widthFull / 500 * (params.rails || 0) * 2));
  add('moving_mechanism_dovodchik', params.moving_mechanism_dovodchik || 0);
  add('moving_mechanism_belt_connector', params.moving_mechanism_belt_connector || 0);
  add('adapter_belt', (doorWidth - 12 <= 970 ? 1 : 2) * (params.adapter_belt || 0));
  add('bottom_rollers', params.bottom_rollers || 0);
  add('corner_rubber_joint', Math.ceil((params.corner_rubber_joint || 0) * 2 * height / 1000));
  add('fixed_door_profile', (doorWidth - 12 <= 970 ? 1 : 2) * (params.fixed_door_profile || 0));
  add('fixed_mechanism', params.fixed_mechanism || 0);
  add('corner_magnet', 1);

  const area = widthFull * height / 1000000;
  addGlassInstLogistics(components, prices, area, glass);
  addShotlan(components, prices, shotlan, doorWidth, height, numDoors);

  let total = 0;
  components.forEach(c => { total += c.sum; });
  return { components, total, doorWidth };
}

// ─── calculateEmbeddedComponents ──────────────────────

export function calculateEmbeddedComponents(
  widthFull: number, openWidth: number, height: number, subsystem: string,
  params: SubsystemParams, glass: string, shotlan: string
): CalcResult {
  const prices = getPrices();
  const numDoors = params.num_doors || 1;
  let raw: number;
  switch (subsystem) {
    case '2+0': raw = (openWidth + 17.5 + 16) / numDoors; break;
    case '2+0|2+0': raw = (openWidth + 70 - 15 + 32) / numDoors; break;
    case '1WPUSH': raw = (openWidth - 6) / numDoors; break;
    case '2WPUSH': raw = (openWidth - 6 + 16) / numDoors; break;
    default: raw = openWidth / numDoors;
  }
  let doorWidth = Math.floor(raw);
  if (raw - doorWidth > 0.4) doorWidth += 1;

  const components: CalcComponent[] = [];
  const add = (key: string, qty: number) => addComponent(components, prices, key, qty);

  add('vertical_profile', (height <= 3200 ? 1 : 2) * numDoors);
  add('cap_no_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_no_brush || 0));
  add('cap_with_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_with_brush || 0));
  add('profile_C_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_C_cap || 0));
  add('profile_V_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_V_cap || 0));
  add('horizontal_profile', (doorWidth <= 1000 ? 1 : 2) * numDoors);
  add('glass_seal', Math.ceil(((doorWidth + height) * 2 / 2500) * numDoors));
  add('bolts', numDoors * 8);
  add('handles', params.num_handles || 0);
  add('top_rail_rubber', Math.ceil((widthFull * (params.num_rails || 0) * 2) / 1000));
  add('door_brush_joint', Math.ceil((params.door_brush || 0) * height / 1000));
  const railMult = widthFull <= 3000 ? 0.5 : (widthFull <= 6000 ? 1 : (widthFull <= 9000 ? 1.5 : 2));
  const capMult = widthFull <= 3000 ? 1 : (widthFull <= 6000 ? 2 : (widthFull <= 9000 ? 3 : 4));
  add('top_rails_41', railMult * (params.num_rails || 0));
  add('side_rail_caps_45', railMult * (params.num_side_caps || 0));
  add('bottom_double_caps', capMult * (params.num_bottom_double_caps || 0));
  add('bottom_single_caps', capMult * (params.num_bottom_single_caps || 0));
  add('rail_to_rail_connectors', Math.ceil(widthFull / 300 * (params.num_rail_to_rail_connectors || 0)));
  add('rail_to_cap_connectors', Math.ceil(widthFull / 300 * (params.num_rail_to_cap_connectors || 0)));
  add('metal_rail_aligner', Math.ceil(widthFull / 500 * (params.num_rails || 0)));
  add('plastic_rail_aligner', Math.ceil(widthFull / 500 * (params.num_rails || 0) * 2));
  add('moving_mechanism_ci', params.moving_mechanism_ci || 0);
  add('belt_connector_mechanism', params.belt_connector_mechanism || 0);
  add('belt_adapter', (doorWidth - 12 <= 970 ? 1 : 2) * (params.belt_adapter || 0));
  add('bottom_rollers', params.bottom_rollers || 0);
  add('gap_rubber', (params.gap_rubber || 0) * 2 * height / 1000);
  add('push_mechanism', params.push_mechanism || 0);
  add('gap_base_profile', params.gap_base_profile || 0);
  add('gap_basic_cap_profile', params.gap_basic_cap_profile || 0);
  add('gap_deco_cap_profile', params.gap_deco_cap_profile || 0);
  add('inner_support_profile', params.inner_support_profile || 0);
  add('corner_rubber_joint', Math.ceil(height * 2 / 1000 * (params.corner_rubber_joint || 0)));

  const area = openWidth * height / 1000000;
  addGlassInstLogistics(components, prices, area, glass);
  addShotlan(components, prices, shotlan, doorWidth, height, numDoors);

  let total = 0;
  components.forEach(c => { total += c.sum; });
  return { components, total, doorWidth };
}

// ─── calculateSyncComponents ──────────────────────────

export function calculateSyncComponents(
  widthFull: number, height: number, subsystem: string,
  params: SubsystemParams, glass: string, shotlan: string
): CalcResult {
  const prices = getPrices();
  const numDoors = params.num_doors || 1;
  const widthAdj = params.width_adjustment || 0;

  const raw = (widthFull + widthAdj - 15) / Math.max(1, numDoors);
  let doorWidth = Math.floor(raw);
  if (raw - doorWidth > 0.4) doorWidth += 1;

  const components: CalcComponent[] = [];
  const add = (key: string, qty: number) => addComponent(components, prices, key, qty);

  add('vertical_profile', (height <= 3200 ? 1 : 2) * numDoors);
  add('cap_no_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_no_brush || 0));
  add('cap_with_brush', (height <= 3200 ? 0.5 : 1) * (params.profile_cap_with_brush || 0));
  add('profile_C_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_C_cap || 0));
  add('profile_V_cap', (height <= 3200 ? 0.5 : 1) * (params.profile_V_cap || 0));
  add('horizontal_profile', (doorWidth <= 1000 ? 1 : 2) * numDoors);
  add('glass_seal', Math.ceil(((doorWidth + height) * 2 / 2500) * numDoors));
  add('bolts', numDoors * 8);
  add('handles', params.num_handles || 0);
  add('top_rail_rubber', Math.ceil((widthFull * (params.num_rails || 0) * 2) / 1000));
  add('door_brush_joint', Math.ceil((params.door_brush || 0) * height / 1000));
  const railMult = widthFull <= 3000 ? 0.5 : (widthFull <= 6000 ? 1 : 1.5);
  const capMult = widthFull <= 3000 ? 1 : (widthFull <= 6000 ? 2 : 3);
  add('top_rails_47', railMult * (params.num_rails || 0));
  add('side_rail_caps_51', railMult * (params.num_side_caps || 0));
  add('bottom_double_caps', capMult * (params.num_bottom_double_caps || 0));
  add('bottom_single_caps', capMult * (params.num_bottom_single_caps || 0));
  add('rail_to_rail_connectors', Math.ceil(widthFull / 300 * (params.num_rail_to_rail_connectors || 0)));
  add('rail_to_cap_connectors', Math.ceil(widthFull / 300 * (params.num_rail_to_cap_connectors || 0)));
  add('metal_rail_aligner', Math.ceil(widthFull / 500 * (params.num_rails || 0)));
  add('plastic_rail_aligner', Math.ceil(widthFull / 500 * (params.num_rails || 0) * 2));
  add('moving_mechanism_ci', params.moving_mechanism || 0);
  add('moving_mechanism_ct', params.moving_mechanism_tros || 0);
  add('fixed_mechanism', params.fixed_mechanism || 0);
  add('corner_rubber_joint', Math.ceil(height * 2 / 1000));
  add('fixed_door_profile', (doorWidth - 12 <= 970 ? 1 : 2) * (params.fixed_door_profile || 0));

  const area = widthFull * height / 1000000;
  addGlassInstLogistics(components, prices, area, glass);
  addShotlan(components, prices, shotlan, doorWidth, height, numDoors);

  let total = 0;
  components.forEach(c => { total += c.sum; });
  return { components, total, doorWidth };
}

// ─── Main dispatcher ──────────────────────────────────

export function calculateTotal(
  systemType: string,
  subsystem: string,
  params: SubsystemParams,
  fullWidth: number,
  openWidth: number,
  height: number,
  glass: string,
  shotlan: string
): CalcResult {
  switch (systemType) {
    case 'partition':
      return calculatePartitionComponents(fullWidth, height, subsystem, params, glass, shotlan);
    case 'wall-mounted':
      return calculateWallMountedComponents(fullWidth, openWidth, height, subsystem, params, glass, shotlan);
    case 'angle':
      return calculateAngleComponents(fullWidth, height, subsystem, params, glass, shotlan);
    case 'sync':
      return calculateSyncComponents(fullWidth, height, subsystem, params, glass, shotlan);
    case 'embedded-wall':
      return calculateEmbeddedComponents(fullWidth, openWidth, height, subsystem, params, glass, shotlan);
    default:
      // cascade, unlinked
      return calculateComponents(fullWidth, height, subsystem, params, glass, shotlan);
  }
}
